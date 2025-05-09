import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Parse the URL to check the path
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Create the response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add CORS headers for API routes
  if (path.startsWith('/api/')) {
    // Set CORS headers to allow all origins (or set specific origins in production)
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.headers.set('Access-Control-Allow-Headers', 
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    
    console.log(`[Middleware] Adding CORS headers for API route: ${path}`);
    
    // Handle OPTIONS requests for CORS preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }
  
  // Exclude webhook endpoints from middleware processing
  // These need to be accessible by external services without authentication
  if (path.startsWith('/api/webhook') || path === '/webhook-test') {
    console.log(`[Middleware] Skipping middleware for webhook endpoint: ${path}`);
    return response;
  }
  
  // Check if it's a protected route
  const isProtectedRoute = path.startsWith('/dashboard') || 
                           path.startsWith('/transcribe');
  
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