import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser, getIntegration, updateIntegration } from '@/lib/supabase/api-client';

export async function POST(request: NextRequest) {
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

    // Get request body
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Get Google Drive integration
    const integration = await getIntegration(request, response, user.id, 'google_drive');
    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    // Revoke the token
    const revokeResponse = await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
      }),
    });

    if (!revokeResponse.ok) {
      console.error('Token revocation error:', await revokeResponse.text());
      // Continue anyway as we're disconnecting
    }

    // Update integration status
    await updateIntegration(request, response, integration.id, {
      status: 'disconnected',
      connected_at: null,
      settings: {
        ...integration.settings,
        tokens: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Google Drive disconnect error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 