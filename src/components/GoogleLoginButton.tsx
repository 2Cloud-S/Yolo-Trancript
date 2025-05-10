'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Script from 'next/script';
import { useRouter } from 'next/navigation';

// Define types for Google objects
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
        }
      }
    }
  }
}

// Type for Google credential response
interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

export default function GoogleLoginButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Generate nonce for security
  const generateNonce = async (): Promise<string[]> => {
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(nonce);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return [nonce, hashedNonce];
  };

  // Handle standard OAuth flow
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      // Google login flow will redirect the user
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setIsLoading(false);
    }
  };

  // Function to handle Google One Tap sign-in
  useEffect(() => {
    // Load Google Identity API
    const googleScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    
    // Skip if script is already loaded or loading
    if (googleScript) return;

    const initGoogleOneTap = async () => {
      if (typeof window !== 'undefined' && window.google && window.google.accounts) {
        try {
          // Check if user is already logged in
          const { data } = await supabase.auth.getSession();
          if (data.session) return;

          const [nonce, hashedNonce] = await generateNonce();
          
          // Initialize Google Identity API
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
            callback: async (response: GoogleCredentialResponse) => {
              try {
                const { data, error } = await supabase.auth.signInWithIdToken({
                  provider: 'google',
                  token: response.credential,
                  nonce,
                });
                
                if (error) throw error;
                
                router.push('/dashboard');
              } catch (error) {
                console.error('Error with Google One Tap sign-in:', error);
              }
            },
            nonce: hashedNonce,
            use_fedcm_for_prompt: true, // For Chrome's third-party cookie phase-out
          });
          
          // Display One Tap UI
          window.google.accounts.id.prompt();
        } catch (error) {
          console.error('Error initializing Google One Tap:', error);
        }
      }
    };

    // Initialize after the script loads
    window.onload = initGoogleOneTap;
  }, [router]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFD60A] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
        {isLoading ? 'Signing in...' : 'Continue with Google'}
      </button>
      
      {/* Div for Google One Tap UI */}
      <div id="google-one-tap" className="fixed top-0 right-0 z-[100]"></div>
    </>
  );
} 