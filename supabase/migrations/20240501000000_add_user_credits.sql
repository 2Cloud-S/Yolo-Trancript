-- Create user_credits table to track available credits
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create credit_transactions table to track credit purchases
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paddle_transaction_id TEXT,
  amount DECIMAL(10, 2),
  currency TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  credits_added INTEGER NOT NULL,
  package_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create credit_usage table to track credit consumption
CREATE TABLE IF NOT EXISTS credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transcription_id UUID REFERENCES transcriptions(id) ON DELETE SET NULL,
  credits_used INTEGER NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  description TEXT
);

-- Create trigger to update the updated_at timestamp on user_credits
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON user_credits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for user_credits
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own credit balance"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policies for credit_transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own credit transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policies for credit_usage
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own credit usage"
  ON credit_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Create view for user credit summary
CREATE OR REPLACE VIEW user_credit_summary AS
SELECT
  uc.user_id,
  uc.credits_balance,
  COALESCE(SUM(ct.credits_added), 0) AS total_credits_purchased,
  COALESCE(SUM(cu.credits_used), 0) AS total_credits_used,
  (SELECT COUNT(*) FROM credit_transactions ct2 WHERE ct2.user_id = uc.user_id) AS purchase_count,
  (SELECT COUNT(*) FROM credit_usage cu2 WHERE cu2.user_id = uc.user_id) AS usage_count
FROM
  user_credits uc
LEFT JOIN credit_transactions ct ON uc.user_id = ct.user_id
LEFT JOIN credit_usage cu ON uc.user_id = cu.user_id
GROUP BY uc.user_id, uc.credits_balance;

-- Allow public access to the view for authenticated users
ALTER VIEW user_credit_summary OWNER TO postgres;
GRANT SELECT ON user_credit_summary TO authenticated; 