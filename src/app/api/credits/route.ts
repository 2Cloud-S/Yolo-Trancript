import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { hasEfficientCredits, logCreditUsage, createAdminClient } from '@/lib/supabase/admin-client';

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
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use admin client to bypass RLS for reliable data access
    const adminClient = createAdminClient();
    
    // Get user's credit information
    const { data, error } = await adminClient
      .from('user_credits')
      .select('credits_balance')
      .eq('user_id', user.id)
      .single();
      
    if (error) {
      console.error('Error fetching user credits:', error);
      
      // If no records found, create an initial record with 0 credits
      if (error.code === 'PGRST116') { // Not found
        const { data: newData, error: createError } = await adminClient
          .from('user_credits')
          .insert({ user_id: user.id, credits_balance: 0 })
          .select('credits_balance')
          .single();
          
        if (createError) {
          console.error('Error creating user credits record:', createError);
          return NextResponse.json({ error: 'Failed to fetch credit information' }, { status: 500 });
        }
        
        return NextResponse.json({
          credits_balance: 0
        });
      }
      
      return NextResponse.json({ error: 'Failed to fetch credit information' }, { status: 500 });
    }
    
    return NextResponse.json({
      credits_balance: data.credits_balance
    });
  } catch (error) {
    console.error('Unexpected error in credits API:', error);
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
    
    // Disable history access for regular users
    if (action === 'history') {
      // Return empty data - users are not allowed to access credit history
      return NextResponse.json({
        transactions: [],
        usage: []
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Unexpected error in credits API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 