import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

/**
 * Test endpoint to trigger credit updates for debugging purposes
 * Only accessible in development
 */
export async function POST(req: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    
    // Get current credit balance
    const { data: creditData, error: creditError } = await supabase
      .from('user_credit_summary')
      .select('credits_balance')
      .eq('user_id', user.id)
      .single();
      
    if (creditError) {
      console.error('Error fetching current credit balance:', creditError);
      return NextResponse.json(
        { error: 'Failed to fetch credit balance' },
        { status: 500 }
      );
    }
    
    const currentBalance = creditData?.credits_balance || 0;
    
    // Determine if we're adding or removing credits for the test
    // (alternating between adding and removing)
    const amountToChange = 1;
    const newBalance = currentBalance > 0 ? currentBalance - amountToChange : currentBalance + amountToChange;
    
    // Update user_credits table with the new balance
    const { error: updateError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: user.id,
        credits_balance: newBalance,
        updated_at: new Date().toISOString()
      });
      
    if (updateError) {
      console.error('Error updating credit balance:', updateError);
      return NextResponse.json(
        { error: 'Failed to update credit balance' },
        { status: 500 }
      );
    }
    
    // Return the updated credit information
    return NextResponse.json({
      previous_balance: currentBalance,
      new_balance: newBalance,
      changed_by: newBalance > currentBalance ? amountToChange : -amountToChange,
      action: newBalance > currentBalance ? 'added' : 'removed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Unexpected error in test-update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 