import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard';
    
    if (!code) {
      console.error('No code in request');
      return NextResponse.redirect(`${origin}/auth/error?error=missing_code`);
    }

    const supabase = await createClient();
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${origin}/auth/error?error=${error.message}`);
    }

    // Determine the correct redirect URL based on environment
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';
    
    if (isLocalEnv) {
      // Local development - no load balancer
      return NextResponse.redirect(`${origin}${next}`);
    } else if (forwardedHost) {
      // Production with load balancer
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    } else {
      // Production without load balancer
      return NextResponse.redirect(`${origin}${next}`);
    }
  } catch (error) {
    console.error('Unexpected error in callback route:', error);
    return NextResponse.redirect(`${origin}/auth/error?error=unexpected_error`);
  }
} 