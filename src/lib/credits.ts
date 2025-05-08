import { supabase } from './supabase';

export interface TrialStatus {
  isTrial: boolean;
  remainingCredits: number;
  trialCreditsUsed: number;
  message?: string;
}

export async function checkTrialStatus(userId: string): Promise<TrialStatus> {
  const { data: credits, error } = await supabase
    .from('user_credits')
    .select('credits_balance, trial_status, trial_credits_used')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error checking trial status:', error);
    return {
      isTrial: false,
      remainingCredits: 0,
      trialCreditsUsed: 0,
      message: 'Error checking trial status'
    };
  }

  const isTrial = credits.trial_status;
  const remainingCredits = credits.credits_balance;
  const trialCreditsUsed = credits.trial_credits_used;

  let message = '';
  if (isTrial) {
    if (remainingCredits <= 0) {
      message = 'Your trial has ended. Please purchase credits to continue.';
    } else if (remainingCredits <= 1) {
      message = `You have ${remainingCredits} trial credit remaining.`;
    } else {
      message = `You have ${remainingCredits} trial credits remaining.`;
    }
  }

  return {
    isTrial,
    remainingCredits,
    trialCreditsUsed,
    message
  };
}

export async function useTrialCredit(userId: string): Promise<boolean> {
  const { data: credits, error: fetchError } = await supabase
    .from('user_credits')
    .select('credits_balance, trial_status, trial_credits_used')
    .eq('user_id', userId)
    .single();

  if (fetchError || !credits) {
    console.error('Error fetching credits:', fetchError);
    return false;
  }

  if (!credits.trial_status || credits.credits_balance <= 0) {
    return false;
  }

  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      credits_balance: credits.credits_balance - 1,
      trial_credits_used: credits.trial_credits_used + 1,
      trial_status: credits.credits_balance - 1 > 0
    })
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error updating trial credits:', updateError);
    return false;
  }

  return true;
} 