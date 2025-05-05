import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

export async function GET() {
  try {
    // Create a Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json({ 
        status: 'error', 
        error: sessionError.message,
        authenticated: false
      }, { status: 500 });
    }
    
    if (!session) {
      return NextResponse.json({ 
        status: 'unauthenticated', 
        authenticated: false,
        message: 'No active session found'
      });
    }
    
    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json({ 
        status: 'error', 
        error: userError.message,
        authenticated: session ? true : false
      }, { status: 500 });
    }
    
    // Try to fetch user credit information as a test
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('credits_balance')
      .eq('user_id', user?.id)
      .single();
    
    // Get RLS debug info
    const { data: rlsCheck, error: rlsError } = await supabase.rpc('check_rls_permissions');
    
    return NextResponse.json({
      status: 'authenticated',
      authenticated: true,
      user: {
        id: user?.id,
        email: user?.email,
        lastSignIn: user?.last_sign_in_at
      },
      session: {
        expires: session?.expires_at,
        provider: session?.user?.app_metadata?.provider
      },
      credit_check: {
        data: creditData,
        error: creditError ? creditError.message : null
      },
      rls_check: {
        data: rlsCheck,
        error: rlsError ? rlsError.message : null
      }
    });
  } catch (error: any) {
    console.error('Unexpected error checking auth status:', error);
    return NextResponse.json({ 
      status: 'error', 
      error: error.message || 'Unexpected error',
      authenticated: false 
    }, { status: 500 });
  }
} 