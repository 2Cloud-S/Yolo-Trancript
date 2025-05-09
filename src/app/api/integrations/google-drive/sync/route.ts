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

    // Check if we received base64 data or a URL
    let fileBlob;
    if (fileUrl.startsWith('data:')) {
      // Handle base64 data
      try {
        // Extract the base64 content from the data URL
        const base64Data = fileUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        fileBlob = new Blob([bytes], { type: fileType });
      } catch (error) {
        console.error('Error processing base64 data:', error);
        return NextResponse.json({ error: 'Invalid base64 file data' }, { status: 400 });
      }
    } else {
      // Handle URL-based file download
      try {
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
          throw new Error(`Failed to download file from storage: ${fileResponse.statusText}`);
        }
        fileBlob = await fileResponse.blob();
      } catch (error) {
        console.error('Error downloading file:', error);
        return NextResponse.json({ 
          error: `Failed to download file from storage: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
      }
    }

    // Create the file object
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
    console.log(`Attempting to upload file ${fileName} to Google Drive`);
    const driveFile = await uploadToGoogleDrive(
      integration,
      file,
      integration.settings?.folder_path || '/Transcriptions'
    );
    console.log(`Successfully uploaded file to Google Drive: ${JSON.stringify(driveFile)}`);

    // Update last sync time
    await supabase
      .from('integrations')
      .update({
        last_sync: new Date().toISOString(),
      })
      .eq('id', integration.id);
      
    // Update transcription record with drive file information
    const { error: transcriptionUpdateError } = await supabase
      .from('transcriptions')
      .update({
        synced_to_drive: true,
        drive_file_id: driveFile.id,
        drive_file_link: driveFile.webViewLink
      })
      .eq('id', fileId)
      .eq('user_id', user.id);
      
    if (transcriptionUpdateError) {
      console.error('Failed to update transcription with drive file info:', transcriptionUpdateError);
      // Continue anyway, as the file was successfully uploaded to Drive
    }

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
      { error: `Failed to sync file with Google Drive: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 