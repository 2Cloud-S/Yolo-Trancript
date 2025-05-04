-- Migration to fix RLS policies for credit-related tables

-- First, drop existing triggers to avoid duplicate errors
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;

-- Drop existing RLS policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own credit balance" ON user_credits;
DROP POLICY IF EXISTS "Users can view their own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can view their own credit usage" ON credit_usage;
DROP POLICY IF EXISTS "Users can manage their own credit balance" ON user_credits;
DROP POLICY IF EXISTS "Users can manage their own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can manage their own credit usage" ON credit_usage;
DROP POLICY IF EXISTS "Service role can manage all credit data" ON user_credits;
DROP POLICY IF EXISTS "Service role can manage all transaction data" ON credit_transactions;
DROP POLICY IF EXISTS "Service role can manage all credit usage data" ON credit_usage;

-- Recreate the trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON user_credits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on all three tables
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_credits
-- Users can only view their balance
CREATE POLICY "Users can view their own credit balance"
  ON user_credits
  FOR SELECT
  USING (auth.uid() = user_id);

-- No SELECT policies for users on transaction or usage tables
-- This prevents them from seeing their history

-- Create service role policies to allow full admin operations
CREATE POLICY "Service role can manage all credit data"
  ON user_credits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage all transaction data"
  ON credit_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage all credit usage data"
  ON credit_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to handle new user registration and create initial credit record
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create initial credit record for new user
  INSERT INTO public.user_credits (user_id, credits_balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create user_credits record for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create a simplified view that only shows credit balance
DROP VIEW IF EXISTS user_credit_summary;
CREATE OR REPLACE VIEW user_credit_summary AS
SELECT
  uc.user_id,
  uc.credits_balance
FROM
  user_credits uc;

-- Grant access to the view
ALTER VIEW user_credit_summary OWNER TO postgres;
GRANT SELECT ON user_credit_summary TO authenticated;

-- Add a comment about the view's purpose
COMMENT ON VIEW user_credit_summary IS 
  'Summary view of user credit balance only'; 