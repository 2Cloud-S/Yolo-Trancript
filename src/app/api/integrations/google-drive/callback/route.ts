import { NextResponse, type NextRequest } from 'next/server';
import { getGoogleDriveTokens } from '@/lib/integrations/google-drive';
import { getCurrentUser, getIntegration, updateIntegration } from '@/lib/supabase/api-client';

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Get current user
    const user = await getCurrentUser(request, response);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get URL parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=oauth_error', request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=invalid_callback', request.url)
      );
    }

    // Get the integration
    const integration = await getIntegration(request, response, user.id, 'google_drive');
    if (!integration) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=integration_not_found', request.url)
      );
    }

    // Verify state matches
    if (state !== integration.settings?.oauth_state) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=invalid_state', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getGoogleDriveTokens(code);

    // Update integration with tokens
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

    return NextResponse.redirect(
      new URL('/dashboard/integrations?success=true', request.url)
    );
  } catch (error) {
    console.error('Google Drive OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=callback_error', request.url)
    );
  }
} 