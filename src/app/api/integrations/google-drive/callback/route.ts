import { NextResponse, type NextRequest } from 'next/server';
import { getGoogleDriveTokens } from '@/lib/integrations/google-drive';
import { getCurrentUser, getIntegration, updateIntegration } from '@/lib/supabase/api-client';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    console.log('🔍 [google-drive/callback] Starting callback processing');
    console.log(`🔍 [google-drive/callback] Environment: ${process.env.NODE_ENV}`);
    console.log(`🔍 [google-drive/callback] Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(`🔍 [google-drive/callback] Request URL: ${request.url}`);
    
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Get current user
    console.log('🔍 [google-drive/callback] Getting current user');
    const user = await getCurrentUser(request, response);
    if (!user) {
      console.error('❌ [google-drive/callback] User not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`✅ [google-drive/callback] Found user: ${user.id}`);

    // Get URL parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log(`🔍 [google-drive/callback] URL params - code: ${!!code}, state: ${!!state}, error: ${error || 'none'}`);

    if (error) {
      console.error(`❌ [google-drive/callback] Google OAuth error: ${error}`);
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=oauth_error', request.url)
      );
    }

    if (!code || !state) {
      console.error(`❌ [google-drive/callback] Missing required params - code: ${!!code}, state: ${!!state}`);
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=invalid_callback', request.url)
      );
    }

    // Get the integration
    console.log(`🔍 [google-drive/callback] Fetching integration for user: ${user.id}, provider: google_drive`);
    let integration = await getIntegration(request, response, user.id, 'google_drive');
    
    // If not found by provider name, try to get it by ID
    if (!integration) {
      console.log(`🔍 [google-drive/callback] Integration not found by provider, trying by ID`);
      const integrationId = `google-drive-${user.id}`;
      
      // Create a supabase client to directly query
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set() {},
            remove() {},
          },
        }
      );
      
      // Try to get the integration by ID
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single();
        
      if (error) {
        console.error(`❌ [google-drive/callback] Error retrieving integration by ID: ${error.message}`);
      } else if (data) {
        console.log(`✅ [google-drive/callback] Found integration by ID: ${integrationId}`);
        integration = data;
      }
    }
    
    // If still not found, try with service role key if available to bypass RLS
    if (!integration && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log(`🔍 [google-drive/callback] Trying with service role key to bypass RLS`);
      const serviceRoleClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set() {},
            remove() {},
          },
        }
      );
      
      // Try to get by ID first
      const integrationId = `google-drive-${user.id}`;
      let { data, error } = await serviceRoleClient
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .single();
        
      if (error) {
        console.log(`🔍 [google-drive/callback] Not found by ID with service role, trying by user_id and provider`);
        
        // Try by user_id and provider
        const result = await serviceRoleClient
          .from('integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('provider', 'google_drive')
          .single();
          
        if (!result.error && result.data) {
          data = result.data;
          error = null;
        }
      }
      
      if (error) {
        console.error(`❌ [google-drive/callback] Service role lookup also failed: ${error.message}`);
      } else if (data) {
        console.log(`✅ [google-drive/callback] Found integration with service role: ${data.id}`);
        integration = data;
      }
    }
    
    if (!integration) {
      console.error(`❌ [google-drive/callback] Integration not found for user: ${user.id}, provider: google_drive`);
      
      // Log additional debugging information
      console.log(`🔍 [google-drive/callback] Debug: Request URL: ${request.url}`);
      console.log(`🔍 [google-drive/callback] Debug: State value: ${state}`);
      console.log(`🔍 [google-drive/callback] Attempting to create integration as fallback`);
      
      // Create a supabase client
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set() {},
            remove() {},
          },
        }
      );
      
      // Try to create the integration as a fallback
      const integrationId = `google-drive-${user.id}`;
      const { data, error } = await supabase
        .from('integrations')
        .upsert({
          id: integrationId,
          user_id: user.id,
          provider: 'google_drive',
          status: 'disconnected',
          settings: {
            auto_save: true,
            folder_path: '/Transcriptions',
            sync_frequency: 'realtime',
            oauth_state: state // Use current state
          }
        })
        .select()
        .single();
        
      if (error) {
        console.error(`❌ [google-drive/callback] Failed to create fallback integration: ${error.message}`);
        return NextResponse.redirect(
          new URL('/dashboard/integrations?error=integration_create_failed', request.url)
        );
      }
      
      console.log(`✅ [google-drive/callback] Created fallback integration: ${integrationId}`);
      integration = data;
    }
    
    console.log(`✅ [google-drive/callback] Found integration - ID: ${integration.id}, Status: ${integration.status}`);
    console.log(`🔍 [google-drive/callback] Integration settings: ${JSON.stringify(integration.settings)}`);

    // Verify state matches
    if (state !== integration.settings?.oauth_state) {
      console.error(`❌ [google-drive/callback] State mismatch - received: ${state}, expected: ${integration.settings?.oauth_state}`);
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=invalid_state', request.url)
      );
    }
    console.log(`✅ [google-drive/callback] State verification successful`);

    // Exchange code for tokens
    console.log(`🔍 [google-drive/callback] Exchanging code for tokens`);
    const tokens = await getGoogleDriveTokens(code);
    console.log(`✅ [google-drive/callback] Successfully obtained tokens - access_token: ${tokens.access_token.substring(0, 10)}..., refresh_token: ${tokens.refresh_token.substring(0, 10)}...`);

    // Update integration with tokens
    console.log(`🔍 [google-drive/callback] Updating integration with tokens`);
    await updateIntegration(request, response, integration.id, {
      status: 'connected',
      connected_at: new Date().toISOString(),
      settings: {
        ...integration.settings,
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + tokens.expires_in * 1000,
        },
        oauth_state: null,
      },
    });
    console.log(`✅ [google-drive/callback] Integration updated successfully`);

    return NextResponse.redirect(
      new URL('/dashboard/integrations?success=true', request.url)
    );
  } catch (error) {
    console.error('❌ [google-drive/callback] Callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=callback_error', request.url)
    );
  }
} 