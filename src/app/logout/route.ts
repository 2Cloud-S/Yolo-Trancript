import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get the Supabase client
    const supabase = await createClient();
    
    // Sign out the user server-side
    await supabase.auth.signOut();
    
    // Redirect to home page with cache-busting headers to force a full page reload
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), {
      status: 302,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'Clear-Site-Data': '"cookies", "storage"'
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    // If there's an error, still try to redirect to home
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), {
      status: 302
    });
  }
} 