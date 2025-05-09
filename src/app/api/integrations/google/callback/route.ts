import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${requestUrl.origin}/dashboard/integrations?error=${error}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${requestUrl.origin}/dashboard/integrations?error=missing_params`);
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the client ID from either environment variable
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = `${requestUrl.origin}/api/integrations/google/callback`.replace(/([^:]\/)\/+/g, "$1");

    // Exchange the code for tokens
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await response.json();

    if (!response.ok) {
      throw new Error(tokens.error_description || 'Failed to get access token');
    }

    // Store the tokens in Supabase
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error: dbError } = await supabase
      .from('integrations')
      .upsert({
        id: `google-drive-${user.id}`,
        user_id: user.id,
        provider: 'google_drive',
        status: 'connected',
        connected_at: new Date().toISOString(),
        settings: {
          auto_save: true,
          folder_path: '/Transcriptions',
          sync_frequency: 'realtime',
          tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + (tokens.expires_in * 1000),
          }
        }
      });

    if (dbError) throw dbError;

    return NextResponse.redirect(`${requestUrl.origin}/dashboard/integrations?success=true`);
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.redirect(
      `${requestUrl.origin}/dashboard/integrations?error=${encodeURIComponent(errorMessage)}`
    );
  }
} 