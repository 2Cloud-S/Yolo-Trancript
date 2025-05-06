import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { hasEfficientCredits, logCreditUsage } from '@/lib/supabase/admin-client';
import { createClient } from '@/lib/supabase/server';

// Calculate credits needed based on audio duration (in seconds)
function calculateCreditsNeeded(durationInSeconds: number): number {
  // 1 credit = 6 minutes (360 seconds) of audio
  const creditsPerMinute = 1 / 6; 
  const durationInMinutes = durationInSeconds / 60;
  const creditsNeeded = Math.ceil(durationInMinutes * creditsPerMinute);
  
  // Minimum 1 credit
  return Math.max(1, creditsNeeded);
}

// Get user's credit information
export async function GET() {
  try {
    console.log("Credits API called");
    const supabase = await createClient();
    
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error in credits API:", sessionError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!session || !session.user) {
      console.log("No session found in credits API");
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log("User authenticated in credits API, user ID:", userId);
    
    // Fetch the user's credit balance
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits_balance')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error("Error fetching credits:", error);
      
      // If the error is "No rows found", the user doesn't have a credits record yet
      if (error.code === 'PGRST116') {
        // Create an initial credits record
        const { error: insertError } = await supabase
          .from('user_credits')
          .insert({ user_id: userId, credits_balance: 0 });
        
        if (insertError) {
          console.error("Failed to create initial credits record:", insertError);
          return NextResponse.json({ error: 'Failed to initialize credits' }, { status: 500 });
        }
        
        return NextResponse.json({ credits_balance: 0 });
      }
      
      return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Exception in credits API:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Check if user has enough credits for transcription
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await req.json();
    const { action, durationInSeconds, transcriptionId } = body;
    
    // Check credit balance for a new transcription
    if (action === 'check') {
      if (!durationInSeconds || durationInSeconds <= 0) {
        return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
      }
      
      const creditsNeeded = calculateCreditsNeeded(durationInSeconds);
      const hasCredits = await hasEfficientCredits(user.id, creditsNeeded);
      
      return NextResponse.json({
        hasEnoughCredits: hasCredits,
        creditsNeeded,
      });
    }
    
    // Deduct credits for a completed transcription
    if (action === 'deduct') {
      if (!durationInSeconds || durationInSeconds <= 0) {
        return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
      }
      
      if (!transcriptionId) {
        return NextResponse.json({ error: 'Transcription ID required' }, { status: 400 });
      }
      
      const creditsNeeded = calculateCreditsNeeded(durationInSeconds);
      const success = await logCreditUsage(user.id, creditsNeeded, transcriptionId);
      
      if (!success) {
        return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        creditsDeducted: creditsNeeded,
      });
    }
    
    // Get transaction history
    if (action === 'history') {
      // Fetch credit transactions
      const { data: transactions, error: txError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (txError) {
        console.error('Error fetching transactions:', txError);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
      }
      
      // Fetch credit usage
      const { data: usage, error: usageError } = await supabase
        .from('credit_usage')
        .select('*, transcriptions(file_name)')
        .eq('user_id', user.id)
        .order('used_at', { ascending: false });
        
      if (usageError) {
        console.error('Error fetching usage:', usageError);
        return NextResponse.json({ error: 'Failed to fetch usage history' }, { status: 500 });
      }
      
      return NextResponse.json({
        transactions,
        usage
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Unexpected error in credits API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 