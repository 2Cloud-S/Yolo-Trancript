import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Creates a Supabase admin client with full access to the database.
 * Only to be used on the server side in admin contexts like webhooks.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin credentials. Check environment variables.');
  }

  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * Get user credits by user ID using the admin client
 */
export async function getUserCreditsAdmin(userId: string) {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error('Error getting user credits:', error);
    return null;
  }
  
  return data;
}

/**
 * Create initial credits for a new user
 */
export async function createInitialCreditsForUser(userId: string, initialCredits: number = 0) {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('user_credits')
    .insert({
      user_id: userId,
      credits_balance: initialCredits
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating initial credits:', error);
    return null;
  }
  
  return data;
}

/**
 * Update user credits
 */
export async function updateUserCredits(userId: string, newBalance: number) {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('user_credits')
    .update({ credits_balance: newBalance })
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating user credits:', error);
    return null;
  }
  
  return data;
}

/**
 * Log credit usage
 */
export async function logCreditUsage(
  userId: string, 
  creditsUsed: number, 
  transcriptionId?: string, 
  description?: string
) {
  const supabase = createAdminClient();
  
  // First log the usage
  const { error: usageError } = await supabase
    .from('credit_usage')
    .insert({
      user_id: userId,
      transcription_id: transcriptionId,
      credits_used: creditsUsed,
      description: description || 'Transcription processing'
    });
    
  if (usageError) {
    console.error('Error logging credit usage:', usageError);
    return false;
  }
  
  // Then deduct from the balance
  const { data: userCredits, error: creditsError } = await supabase
    .from('user_credits')
    .select('id, credits_balance')
    .eq('user_id', userId)
    .single();
    
  if (creditsError) {
    console.error('Error getting current credit balance:', creditsError);
    return false;
  }
  
  const newBalance = Math.max(0, userCredits.credits_balance - creditsUsed);
  
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({ credits_balance: newBalance })
    .eq('id', userCredits.id);
    
  if (updateError) {
    console.error('Error updating credit balance:', updateError);
    return false;
  }
  
  return true;
}

/**
 * Check if user has sufficient credits
 */
export async function hasEfficientCredits(userId: string, requiredCredits: number): Promise<boolean> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('user_credits')
    .select('credits_balance')
    .eq('user_id', userId)
    .single();
    
  if (error || !data) {
    // If no record exists, user doesn't have credits
    return false;
  }
  
  return data.credits_balance >= requiredCredits;
} 