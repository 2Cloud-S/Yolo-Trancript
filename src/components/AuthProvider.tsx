'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Function to check auth status and perform necessary actions
    const setupAuth = async () => {
      setIsLoading(true);
      
      // Get current auth state
      const { data: { user } } = await supabase.auth.getUser();
      const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/transcribe');
      
      console.log(`[AuthProvider] Setup - User: ${!!user}, Route: ${pathname}, Protected: ${isProtectedRoute}`);
      
      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(`[AuthProvider] Auth event: ${event}, session: ${!!session}`);
        
        if (event === 'SIGNED_IN') {
          // If on login page, redirect to dashboard
          if (pathname.includes('/auth/login') || pathname === '/') {
            router.push('/dashboard');
          } else {
            // Refresh the page to ensure the session is available to all components
            router.refresh();
          }
        }
        
        if (event === 'SIGNED_OUT') {
          // Redirect to home page on sign out
          router.push('/');
          // Force a refresh to clear any cached auth state
          router.refresh();
        }
        
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Just refresh the page to update client-side state
          router.refresh();
        }
      });
      
      setIsLoading(false);
      
      return () => {
        subscription.unsubscribe();
      };
    };
    
    setupAuth();
  }, [pathname, router, supabase]);

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