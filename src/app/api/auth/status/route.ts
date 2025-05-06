import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    try {
      // Get the user directly (authenticated session from cookie)
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Auth status error:', error);
        return NextResponse.json(
          { 
            error: error.message || 'Not authenticated',
            code: error.code || 'auth_error',
            authenticated: false 
          },
          { status: 401 }
        );
      }
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found', authenticated: false },
          { status: 401 }
        );
      }

      // Get user credits using the correct column name 'credits_balance'
      const { data: credits, error: creditsError } = await supabase
        .from('user_credits')
        .select('credits_balance')
        .eq('user_id', user.id)
        .single();

      if (creditsError) {
        console.error('Credits fetch error:', creditsError);
        
        // Still return authenticated status even if credits can't be fetched
        return NextResponse.json({
          userId: user.id,
          authenticated: true,
          credits: 0,
          hasCredits: false
        });
      }

      // Return auth data with credits
      return NextResponse.json({
        userId: user.id,
        authenticated: true,
        hasCredits: credits?.credits_balance > 0,
        credits: credits?.credits_balance || 0
      });
    } catch (authError: any) {
      console.error('Auth check error details:', authError);
      
      // More specific error for auth session missing
      if (authError.message && authError.message.includes('Auth session missing')) {
        return NextResponse.json(
          { 
            error: 'Your login session has expired. Please log in again.',
            code: 'session_expired',
            authenticated: false 
          }, 
          { status: 401 }
        );
      }
      
      throw authError; // Re-throw for the outer catch
    }
  } catch (error: any) {
    console.error('Auth status check failed:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Internal server error', 
        authenticated: false,
        code: error?.code || 'server_error'
      },
      { status: 500 }
    );
  }
} 