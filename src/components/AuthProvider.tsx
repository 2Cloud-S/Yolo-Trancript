'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Function to check auth status and perform necessary actions
    const setupAuth = async () => {
      setIsLoading(true);
      
      // Get current auth state
      const { data: { user } } = await supabase.auth.getUser();
      const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/transcribe');
      
      // Check for redirect URL in query params (for after login)
      const redirectUrl = searchParams.get('redirect');
      
      console.log(`[AuthProvider] Setup - User: ${!!user}, Route: ${pathname}, Protected: ${isProtectedRoute}, Redirect: ${redirectUrl}`);
      
      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(`[AuthProvider] Auth event: ${event}, session: ${!!session}`);
        
        if (event === 'SIGNED_IN') {
          // Check if there's a redirect URL in the query parameters
          const redirectPath = searchParams.get('redirect');
          
          // If on login page, redirect to dashboard or the specified redirect path
          if (pathname.includes('/auth/login')) {
            const targetPath = redirectPath || '/dashboard';
            console.log(`[AuthProvider] SIGNED_IN event - Redirecting to ${targetPath}`);
            router.push(targetPath);
          } else {
            // Refresh the page to ensure the session is available to all components
            console.log('[AuthProvider] SIGNED_IN event - Refreshing current page');
            router.refresh();
          }
        }
        
        if (event === 'SIGNED_OUT') {
          // Clear local storage to ensure full cleanup
          console.log('[AuthProvider] SIGNED_OUT event - Cleaning up and redirecting to home');
          
          // Use a short timeout to ensure all Supabase operations complete
          // This helps avoid race conditions in auth state management
          setTimeout(() => {
            // Redirect to home page on sign out
            router.push('/');
            
            // Force a refresh to clear any cached auth state
            router.refresh();
          }, 50);
        }
        
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Just refresh the page to update client-side state
          console.log(`[AuthProvider] ${event} event - Refreshing page`);
          router.refresh();
        }
      });
      
      // If this is a protected route and user is not logged in, redirect to login
      if (isProtectedRoute && !user) {
        console.log('[AuthProvider] Protected route access attempt without auth - Redirecting to login');
        
        // Include the current path as the redirect target
        const loginPath = `/auth/login${pathname ? `?redirect=${encodeURIComponent(pathname)}` : ''}`;
        router.push(loginPath);
      }
      
      setIsLoading(false);
      
      return () => {
        console.log('[AuthProvider] Cleaning up auth subscription');
        subscription.unsubscribe();
      };
    };
    
    setupAuth();
  }, [pathname, router, supabase, searchParams]);

  // Simple loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
} 