'use client';

import { FormEvent, useState, useEffect, Suspense } from 'react';
import supabase from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import EnvWarning from '@/components/EnvWarning';
import YoloMascot from '@/components/YoloMascot';

// Client component that uses useSearchParams
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const redirectPath = returnUrl || searchParams.get('redirect') || '/dashboard';

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('[LoginPage] User already logged in, redirecting to:', redirectPath);
        router.push(redirectPath);
      }
    };
    
    checkSession();
  }, [redirectPath, router]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('[LoginPage] Attempting login for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('[LoginPage] Login error:', error.message);
        throw error;
      }
      
      console.log('[LoginPage] Login successful, redirecting to:', redirectPath);
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-2 border-gray-900 rounded-lg p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Sign In</h2>
      
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900">
            Email address
          </label>
          <div className="mt-1 relative rounded-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-500" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full pl-10 pr-3 py-2 border-2 border-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFD60A] sm:text-sm"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-900">
            Password
          </label>
          <div className="mt-1 relative rounded-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-500" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="block w-full pl-10 pr-3 py-2 border-2 border-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFD60A] sm:text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <div className="text-sm">
            <Link href="/auth/forgot-password" className="font-medium text-[#06B6D4] hover:underline">
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border-2 border-gray-900 rounded-md font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 shadow-[4px_4px_0px_0px_rgba(255,214,10,1)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </div>
            ) : (
              <>
                Sign in
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </div>
        
        <div className="mt-6 flex items-center justify-center">
          <span className="text-sm text-gray-600">Don&apos;t have an account?</span>
          <Link
            href={returnUrl ? `/auth/register?returnUrl=${encodeURIComponent(returnUrl)}` : "/auth/register"}
            className="ml-2 text-sm font-medium text-[#06B6D4] hover:underline"
          >
            Create a free account
          </Link>
        </div>
      </form>
    </div>
  );
}

// Fallback component when suspense is loading
function LoginFormFallback() {
  return (
    <div className="bg-white border-2 border-gray-900 rounded-lg p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Sign In</h2>
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-6 w-1/3 ml-auto bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-6 w-2/3 mx-auto bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default function Login() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  
  return (
    <div className="flex flex-col min-h-screen">
      <EnvWarning />
      
      {/* Header */}
      <header className="bg-[#FFD60A] shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 animate-fadeIn relative overflow-hidden group">
                <span className="inline-block transform transition-transform duration-500 ease-in-out group-hover:translate-x-1">
                  Yolo Transcript
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={returnUrl ? `/auth/register?returnUrl=${encodeURIComponent(returnUrl)}` : "/auth/register"}
                className="inline-flex items-center px-4 py-2 border-2 border-gray-900 text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="bg-[#FFD60A] p-8 rounded-lg border-2 border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
                <YoloMascot pose="waving" size="lg" />
                <div className="mt-4 p-4 bg-white rounded border border-gray-900">
                  <p className="text-gray-800 text-sm font-mono">&quot;Welcome back! Sign in to access your transcripts and continue your work.&quot;</p>
                </div>
              </div>
            </div>
            
            <div>
              <Suspense fallback={<LoginFormFallback />}>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} Yolo Transcript. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="/terms-of-service" className="text-sm text-gray-600 hover:text-gray-900">
                Terms of Service
              </Link>
              <Link href="/privacy-policy" className="text-sm text-gray-600 hover:text-gray-900">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 