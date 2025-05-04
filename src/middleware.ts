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
  const pathname = url.pathname;
  
  // Define route types 
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/transcribe');
  const isAuthRoute = pathname.startsWith('/auth');
  const isApiRoute = pathname.startsWith('/api');
  
  // Skip auth check for public API routes that don't need authentication
  if (isApiRoute && !pathname.startsWith('/api/protected')) {
    return response;
  }
  
  // Create Supabase client
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
      redirectUrl.searchParams.set('redirect', pathname);
      
      console.log(`[Middleware] Unauthorized access to ${pathname}, redirecting to login`);
      return NextResponse.redirect(redirectUrl);
    }
    
    console.log(`[Middleware] Authorized access to ${pathname} for user ${user.email}`);
  }
  
  // Handle auth routes when user is already logged in
  if (isAuthRoute && session) {
    // If trying to access login while already authenticated, redirect to dashboard
    if (pathname === '/auth/login') {
      console.log(`[Middleware] Already authenticated user attempting to access login, redirecting to dashboard`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Add debug logging for all requests
  const userEmail = session?.user?.email || 'unauthenticated';
  console.log(`[Middleware] ${pathname} | User: ${userEmail} | Session: ${!!session}`);

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