import { Integration } from '@/types/integrations';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
  modifiedTime: string;
}

function checkTokens(integration: Integration): void {
  if (!integration.settings?.tokens?.access_token) {
    throw new Error('No access token available');
  }
}

export async function refreshGoogleDriveToken(integration: Integration): Promise<Integration> {
  if (!integration.settings?.tokens?.refresh_token) {
    throw new Error('No refresh token available');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: integration.settings.tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const tokens = await response.json();

  return {
    ...integration,
    settings: {
      ...integration.settings,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: integration.settings.tokens.refresh_token,
        expires_at: Date.now() + tokens.expires_in * 1000,
      },
    },
  };
}

async function checkAndRefreshToken(integration: Integration): Promise<Integration> {
  checkTokens(integration);
  
  if (integration.settings?.tokens?.expires_at && Date.now() >= integration.settings.tokens.expires_at) {
    return await refreshGoogleDriveToken(integration);
  }
  
  return integration;
}

export async function uploadToGoogleDrive(
  integration: Integration,
  file: File,
  folderPath: string = '/Transcriptions'
): Promise<GoogleDriveFile> {
  integration = await checkAndRefreshToken(integration);

  // First, ensure the folder exists
  const folderId = await ensureFolderExists(integration, folderPath);

  // Create file metadata
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: [folderId]
  };

  // Upload the file
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${integration.settings!.tokens!.access_token}`,
    },
    body: form
  });

  if (!response.ok) {
    throw new Error('Failed to upload file to Google Drive');
  }

  return response.json();
}

export async function listFiles(
  integration: Integration,
  folderPath: string = '/Transcriptions'
): Promise<GoogleDriveFile[]> {
  integration = await checkAndRefreshToken(integration);

  const folderId = await ensureFolderExists(integration, folderPath);

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents&fields=files(id,name,mimeType,webViewLink,createdTime,modifiedTime)`,
    {
      headers: {
        'Authorization': `Bearer ${integration.settings!.tokens!.access_token}`,
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to list files from Google Drive');
  }

  const data = await response.json();
  return data.files;
}

export async function deleteFile(
  integration: Integration,
  fileId: string
): Promise<void> {
  integration = await checkAndRefreshToken(integration);

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${integration.settings!.tokens!.access_token}`,
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete file from Google Drive');
  }
}

async function ensureFolderExists(
  integration: Integration,
  folderPath: string
): Promise<string> {
  integration = await checkAndRefreshToken(integration);

  const pathParts = folderPath.split('/').filter(Boolean);
  let parentId = 'root';

  for (const part of pathParts) {
    // Check if folder exists
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${part}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents`,
      {
        headers: {
          'Authorization': `Bearer ${integration.settings!.tokens!.access_token}`,
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to check folder existence');
    }

    const data = await response.json();
    let folderId = data.files?.[0]?.id;

    // Create folder if it doesn't exist
    if (!folderId) {
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.settings!.tokens!.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: part,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId]
        })
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create folder');
      }

      const folder = await createResponse.json();
      folderId = folder.id;
    }

    parentId = folderId;
  }

  return parentId;
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-drive/callback`;

export interface GoogleDriveTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function getGoogleDriveTokens(code: string): Promise<GoogleDriveTokens> {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
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

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  const tokens = await tokenResponse.json();
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: tokens.expires_in,
  };
} 