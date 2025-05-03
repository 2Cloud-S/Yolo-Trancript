import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
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

    // Get settings from request body
    const data = await request.json();
    const { auto_save, folder_path, sync_frequency } = data;

    // Validate settings
    if (auto_save !== undefined && typeof auto_save !== 'boolean') {
      return NextResponse.json({ error: 'Invalid auto_save value' }, { status: 400 });
    }

    if (folder_path !== undefined && typeof folder_path !== 'string') {
      return NextResponse.json({ error: 'Invalid folder_path value' }, { status: 400 });
    }

    if (sync_frequency !== undefined && !['realtime', 'daily', 'weekly'].includes(sync_frequency)) {
      return NextResponse.json({ error: 'Invalid sync_frequency value' }, { status: 400 });
    }

    // Update settings
    const { error: updateError } = await supabase
      .from('integrations')
      .update({
        settings: {
          ...integration.settings,
          auto_save: auto_save ?? integration.settings?.auto_save,
          folder_path: folder_path ?? integration.settings?.folder_path,
          sync_frequency: sync_frequency ?? integration.settings?.sync_frequency,
        },
      })
      .eq('id', integration.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google Drive settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update Google Drive settings' },
      { status: 500 }
    );
  }
} 