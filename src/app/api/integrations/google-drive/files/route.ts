import { NextResponse, type NextRequest } from 'next/server';
import { listFiles, refreshGoogleDriveToken } from '@/lib/integrations/google-drive';
import { getCurrentUser, getIntegration, updateIntegration } from '@/lib/supabase/api-client';

export async function GET(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Get current user
    const user = await getCurrentUser(request, response);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the integration
    let integration = await getIntegration(request, response, user.id, 'google_drive');
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (integration.status !== 'connected') {
      return NextResponse.json({ error: 'Integration is not connected' }, { status: 400 });
    }

    // Check if token needs refresh
    if (Date.now() >= (integration.settings?.tokens?.expires_at || 0)) {
      const refreshedIntegration = await refreshGoogleDriveToken(integration);
      integration = await updateIntegration(request, response, integration.id, {
        settings: refreshedIntegration.settings,
      });
    }

    // List files from Google Drive
    const files = await listFiles(
      integration,
      integration.settings?.folder_path || '/Transcriptions'
    );

    return NextResponse.json({
      success: true,
      files: files.map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
      })),
    });
  } catch (error) {
    console.error('Google Drive files list error:', error);
    return NextResponse.json(
      { error: 'Failed to list files from Google Drive' },
      { status: 500 }
    );
  }
} 