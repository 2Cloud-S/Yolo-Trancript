import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { createAdminClient } from '@/lib/supabase/admin-client';

/**
 * Credit check API route
 * Used to verify if a user has enough credits for an operation
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Unauthorized access to credit check API:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    const { action, creditsNeeded } = body;
    
    // Validate parameters
    if (action !== 'check' || typeof creditsNeeded !== 'number' || creditsNeeded <= 0) {
      return NextResponse.json({ 
        error: 'Invalid parameters. Expected: action="check" and creditsNeeded > 0' 
      }, { status: 400 });
    }
    
    // Use admin client to bypass RLS for reliable data access
    const adminClient = createAdminClient();
    
    // Get user's credit balance
    const { data, error } = await adminClient
      .from('user_credits')
      .select('credits_balance')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user credits:', error);
      
      // If no record is found, create one with 0 credits
      if (error.code === 'PGRST116') { // Not found
        const { data: newData, error: createError } = await adminClient
          .from('user_credits')
          .insert({ user_id: user.id, credits_balance: 0 })
          .select('credits_balance')
          .single();
          
        if (createError) {
          console.error('Error creating user credits record:', createError);
          return NextResponse.json({ error: 'Failed to check credits' }, { status: 500 });
        }
        
        // Return result with newly created record (0 credits)
        return NextResponse.json({
          hasEnoughCredits: false,
          creditsNeeded: creditsNeeded,
          creditsAvailable: 0,
          authenticated: true
        });
      }
      
      return NextResponse.json({ error: 'Failed to check credits' }, { status: 500 });
    }
    
    // Return credit status
    return NextResponse.json({
      hasEnoughCredits: (data.credits_balance >= creditsNeeded),
      creditsNeeded: creditsNeeded,
      creditsAvailable: data.credits_balance,
      authenticated: true
    });
    
  } catch (error) {
    console.error('Error in credit check API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 