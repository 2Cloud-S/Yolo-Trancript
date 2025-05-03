import { NextResponse, type NextRequest } from 'next/server';
import { deleteFile, refreshGoogleDriveToken } from '@/lib/integrations/google-drive';
import { getCurrentUser, getIntegration, updateIntegration } from '@/lib/supabase/api-client';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
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

    // Resolve params
    const resolvedParams = await params;
    
    // Delete file from Google Drive
    await deleteFile(integration, resolvedParams.fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google Drive file delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file from Google Drive' },
      { status: 500 }
    );
  }
} 