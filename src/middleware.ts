import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Parse the URL to check if it's a protected route
  const url = new URL(request.url);
  const isProtectedRoute = url.pathname.startsWith('/dashboard') || 
                           url.pathname.startsWith('/transcribe');
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // This is critical - set cookies in both request and response
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  // First refresh the session
  const { data: { session } } = await supabase.auth.getSession();
  
  // For protected routes, verify user exists
  if (isProtectedRoute) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Redirect to login if accessing protected route without authentication
      const redirectUrl = new URL('/auth/login', request.url);
      // Include the original URL as a redirect parameter
      redirectUrl.searchParams.set('redirect', url.pathname);
      
      console.log(`[Middleware] Unauthorized access attempt to ${url.pathname}, redirecting to login`);
      return NextResponse.redirect(redirectUrl);
    }
    
    console.log(`[Middleware] Authorized access to ${url.pathname} for user ${user.email}`);
  }
  
  // Add debug logging for all requests
  console.log(`[Middleware] Processed request for ${url.pathname}, auth session: ${!!session}`);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 