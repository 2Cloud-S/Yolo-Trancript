import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required', isAuthenticated: false },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { action, creditsNeeded } = body;
    
    if (action !== 'check' || typeof creditsNeeded !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    
    // Fetch user's credit balance
    const { data: creditData, error: creditError } = await supabase
      .from('user_credit_summary')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (creditError && creditError.code !== 'PGRST116') { // PGRST116 is the error code for "no rows returned"
      console.error('Error fetching credit balance:', creditError);
      return NextResponse.json(
        { error: 'Failed to fetch credit balance' },
        { status: 500 }
      );
    }
    
    // Default to 0 if no credit record found
    const creditsBalance = creditData?.credits_balance || 0;
    const hasEnoughCredits = creditsBalance >= creditsNeeded;
    
    return NextResponse.json({
      isAuthenticated: true,
      creditsBalance,
      creditsNeeded,
      hasEnoughCredits,
    });
    
  } catch (error) {
    console.error('Error processing credit check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 