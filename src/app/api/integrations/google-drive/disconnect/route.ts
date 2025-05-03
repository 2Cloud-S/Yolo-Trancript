import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the integration
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select()
      .eq('user_id', user.id)
      .eq('provider', 'google_drive')
      .single();

    if (fetchError || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Revoke Google Drive access token
    if (integration.settings?.tokens?.access_token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${integration.settings.tokens.access_token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
      } catch (error) {
        console.error('Failed to revoke Google Drive token:', error);
        // Continue with disconnection even if token revocation fails
      }
    }

    // Update integration status
    const { error: updateError } = await supabase
      .from('integrations')
      .update({
        status: 'disconnected',
        settings: {
          ...integration.settings,
          tokens: null,
        },
      })
      .eq('id', integration.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google Drive disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect from Google Drive' },
      { status: 500 }
    );
  }
} 