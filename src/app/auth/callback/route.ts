import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // Get redirect path from search params, checking both returnUrl and redirect
  const returnUrl = requestUrl.searchParams.get('returnUrl');
  const redirect = requestUrl.searchParams.get('redirect');
  const redirectPath = returnUrl || redirect || '/dashboard';

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(redirectPath, request.url));
} 