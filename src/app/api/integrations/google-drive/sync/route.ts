import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { uploadToGoogleDrive, refreshGoogleDriveToken } from '@/lib/integrations/google-drive';

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
    const { data: initialIntegration, error: fetchError } = await supabase
      .from('integrations')
      .select()
      .eq('user_id', user.id)
      .eq('provider', 'google_drive')
      .single();

    if (fetchError || !initialIntegration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (initialIntegration.status !== 'connected') {
      return NextResponse.json({ error: 'Integration is not connected' }, { status: 400 });
    }

    // Get the file data from the request
    const data = await request.json();
    const { fileId, fileName, fileType, fileUrl } = data;

    if (!fileId || !fileName || !fileType || !fileUrl) {
      return NextResponse.json({ error: 'Missing required file data' }, { status: 400 });
    }

    // Download the file from Supabase storage
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error('Failed to download file from storage');
    }

    const fileBlob = await fileResponse.blob();
    const file = new File([fileBlob], fileName, { type: fileType });

    // Check if token needs refresh
    let integration = initialIntegration;
    if (Date.now() >= (integration.settings?.tokens?.expires_at || 0)) {
      integration = await refreshGoogleDriveToken(integration);

      // Update integration with new tokens
      const { error: updateError } = await supabase
        .from('integrations')
        .update({
          settings: integration.settings,
        })
        .eq('id', integration.id);

      if (updateError) {
        throw updateError;
      }
    }

    // Upload file to Google Drive
    const driveFile = await uploadToGoogleDrive(
      integration,
      file,
      integration.settings?.folder_path || '/Transcriptions'
    );

    // Update last sync time
    await supabase
      .from('integrations')
      .update({
        last_sync: new Date().toISOString(),
      })
      .eq('id', integration.id);

    return NextResponse.json({
      success: true,
      file: {
        id: driveFile.id,
        name: driveFile.name,
        webViewLink: driveFile.webViewLink,
      },
    });
  } catch (error) {
    console.error('Google Drive sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync file with Google Drive' },
      { status: 500 }
    );
  }
} 