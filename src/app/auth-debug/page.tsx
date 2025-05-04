'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthDebugPage() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const addLog = (message: string) => {
    console.log(`[AuthDebug] ${message}`);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        addLog('Fetching current auth status...');
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          addLog(`Error getting user: ${userError.message}`);
        } else {
          setUser(user);
          addLog(`User: ${user ? `Authenticated (${user.email})` : 'Not authenticated'}`);
        }
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          addLog(`Error getting session: ${sessionError.message}`);
        } else {
          setSession(session);
          addLog(`Session: ${session ? 'Active' : 'None'}`);
        }
      } catch (error) {
        addLog(`Unexpected error: ${error}`);
      }
    };

    fetchAuthStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Auth state change: ${event} (Session: ${!!session})`);
      
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null);
        setSession(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      addLog('Signing out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        addLog(`Error signing out: ${error.message}`);
      } else {
        addLog('Sign out successful');
      }
    } catch (error) {
      addLog(`Unexpected error during sign out: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToHomepage = () => {
    router.push('/');
  };
  
  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };
  
  const handleGoToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Auth Status</h2>
          
          <div className="space-y-4">
            <div>
              <p className="font-medium">User:</p>
              <div className="bg-gray-100 p-2 rounded">
                {user ? (
                  <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-40">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                ) : (
                  <p className="text-gray-500">Not authenticated</p>
                )}
              </div>
            </div>
            
            <div>
              <p className="font-medium">Session:</p>
              <div className="bg-gray-100 p-2 rounded">
                {session ? (
                  <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-40">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                ) : (
                  <p className="text-gray-500">No active session</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-x-4">
            <button
              onClick={handleSignOut}
              disabled={isLoading || !user}
              className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
            >
              {isLoading ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          
          <div className="space-y-4">
            <p>Test navigation between pages to see how auth state is maintained:</p>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGoToHomepage}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
              >
                Go to Homepage
              </button>
              
              <button
                onClick={handleGoToDashboard}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
              >
                Go to Dashboard
              </button>
              
              <button
                onClick={handleGoToLogin}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
        
        {/* Logs */}
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, i) => <div key={i} className="pb-1">{log}</div>)
            ) : (
              <p className="text-gray-500">No logs yet</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>
          This page is for debugging authentication issues. It displays the current authentication state and
          provides tools to test authentication flows.
        </p>
      </div>
    </div>
  );
} 