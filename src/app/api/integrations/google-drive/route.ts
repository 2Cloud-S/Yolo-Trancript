import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes } from 'crypto';

const isDevelopment = process.env.NODE_ENV === 'development';
const BASE_URL = isDevelopment 
  ? 'http://localhost:3000' 
  : process.env.NEXT_PUBLIC_APP_URL;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${BASE_URL}/api/integrations/google-drive/callback`.replace(/([^:]\/)\/+/g, "$1");

const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [google-drive/route] Starting OAuth initialization');
    console.log(`🔍 [google-drive/route] Using redirect URI: ${REDIRECT_URI}`);
    console.log(`🔍 [google-drive/route] Using client ID: ${GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.substring(0, 10) + '...' : 'undefined'}`);
    
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    console.log('🔍 [google-drive/route] Creating Supabase client');
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
              path: options.path ?? '/',
              domain: options.domain,
            });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              path: options.path ?? '/',
              domain: options.domain,
              maxAge: 0,
            });
          },
        },
      }
    );

    // Get current user
    console.log('🔍 [google-drive/route] Getting current user');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('❌ [google-drive/route] User not authenticated');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=Unauthorized`
      );
    }
    console.log(`✅ [google-drive/route] Found user: ${user.id}`);

    // Generate state parameter for security
    const state = randomBytes(32).toString('hex');
    console.log(`🔍 [google-drive/route] Generated state: ${state.substring(0, 10)}...`);

    // Check if integration already exists
    console.log(`🔍 [google-drive/route] Checking for existing integration - user: ${user.id}, provider: google_drive`);
    const { data: existingIntegration, error: fetchError } = await supabase
      .from('integrations')
      .select()
      .eq('user_id', user.id)
      .eq('provider', 'google_drive')
      .single();

    if (fetchError) {
      console.log(`🔍 [google-drive/route] No existing integration found: ${fetchError.message}`);
    } else {
      console.log(`✅ [google-drive/route] Found existing integration: ${existingIntegration.id}`);
    }

    // Create or update the integration with the state
    if (existingIntegration) {
      // Update existing integration with new state
      console.log(`🔍 [google-drive/route] Updating existing integration: ${existingIntegration.id}`);
      const { error: updateError } = await supabase
        .from('integrations')
        .update({
          settings: {
            ...existingIntegration.settings,
            oauth_state: state
          }
        })
        .eq('id', existingIntegration.id);
      
      if (updateError) {
        console.error(`❌ [google-drive/route] Error updating integration: ${updateError.message}`);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=Failed to update integration`
        );
      }
      console.log(`✅ [google-drive/route] Successfully updated integration with state`);
    } else {
      // Create new integration record
      const integrationId = `google-drive-${user.id}`;
      console.log(`🔍 [google-drive/route] Creating new integration: ${integrationId}`);
      
      const { error: insertError } = await supabase
        .from('integrations')
        .insert({
          id: integrationId,
          user_id: user.id,
          provider: 'google_drive',
          status: 'disconnected',
          settings: {
            auto_save: true,
            folder_path: '/Transcriptions',
            sync_frequency: 'realtime',
            oauth_state: state
          }
        });
      
      if (insertError) {
        console.error(`❌ [google-drive/route] Error creating integration: ${insertError.message}`);
        console.log(`🔍 [google-drive/route] Insert error details: ${JSON.stringify(insertError)}`);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=Failed to create integration: ${insertError.message}`
        );
      }
      
      // Verify the record was created by fetching it back
      console.log(`🔍 [google-drive/route] Verifying integration was created`);
      const { data: verifyIntegration, error: verifyError } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single();
        
      if (verifyError || !verifyIntegration) {
        console.error(`❌ [google-drive/route] Integration verification failed: ${verifyError?.message || 'Record not found'}`);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=Integration creation verification failed`
        );
      }
      
      console.log(`✅ [google-drive/route] Successfully created and verified new integration`);
      console.log(`🔍 [google-drive/route] Integration data: ${JSON.stringify(verifyIntegration)}`);
    }

    // Store state in a cookie for verification in callback
    console.log(`🔍 [google-drive/route] Creating redirect response to Google OAuth`);
    console.log(`🔍 [google-drive/route] Using BASE_URL: ${BASE_URL}`);
    
    const redirectResponse = NextResponse.redirect(
      `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: GOOGLE_OAUTH_SCOPES,
        access_type: 'offline',
        prompt: 'consent',
        state,
      }).toString()}`
    );

    // Set state cookie
    console.log(`🔍 [google-drive/route] Setting oauth_state cookie`);
    redirectResponse.cookies.set({
      name: 'google_oauth_state',
      value: state,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });

    console.log(`✅ [google-drive/route] Redirecting to Google OAuth`);
    return redirectResponse;
  } catch (error) {
    console.error('❌ [google-drive/route] OAuth initialization error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=Failed to initialize Google Drive connection: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
} 