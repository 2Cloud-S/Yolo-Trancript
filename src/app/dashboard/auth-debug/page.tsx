'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AuthDebug() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [authEvents, setAuthEvents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionRefreshing, setIsSessionRefreshing] = useState(false);
  const supabase = createClient();
  
  const addAuthEvent = (event: string) => {
    setAuthEvents(prev => [...prev, `${new Date().toISOString()}: ${event}`]);
  };

  // Check current session
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error.message);
          addAuthEvent(`Error getting session: ${error.message}`);
          return;
        }
        
        setSessionInfo(data.session);
        
        if (data.session) {
          addAuthEvent(`Active session found: ${data.session.user.email}`);
        } else {
          addAuthEvent('No active session found');
        }
      } catch (err: any) {
        setError(err.message);
        addAuthEvent(`Exception getting session: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addAuthEvent(`Auth event: ${event}, session exists: ${!!session}`);
      setSessionInfo(session);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const refreshSession = async () => {
    try {
      setIsSessionRefreshing(true);
      addAuthEvent('Manually refreshing session...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        addAuthEvent(`Session refresh error: ${error.message}`);
        setError(error.message);
      } else {
        addAuthEvent(`Session refreshed: ${data.session ? 'success' : 'no session'}`);
        setSessionInfo(data.session);
      }
    } catch (err: any) {
      addAuthEvent(`Session refresh exception: ${err.message}`);
      setError(err.message);
    } finally {
      setIsSessionRefreshing(false);
    }
  };
  
  const testCreditsAPI = async () => {
    try {
      addAuthEvent('Testing credits API...');
      const response = await fetch('/api/credits');
      
      if (!response.ok) {
        addAuthEvent(`Credits API error: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      addAuthEvent(`Credits API success: ${JSON.stringify(data)}`);
    } catch (err: any) {
      addAuthEvent(`Credits API exception: ${err.message}`);
    }
  };
  
  const signOut = async () => {
    try {
      addAuthEvent('Signing out...');
      await supabase.auth.signOut();
      addAuthEvent('Sign out complete');
    } catch (err: any) {
      addAuthEvent(`Sign out error: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Supabase Auth Diagnostics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Session Information</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></span>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <span className="block text-sm font-medium text-gray-700 mb-1">Status:</span>
                <div className="flex items-center">
                  <div className={`h-3 w-3 rounded-full mr-2 ${sessionInfo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-medium">{sessionInfo ? 'Authenticated' : 'Not Authenticated'}</span>
                </div>
              </div>
              
              {sessionInfo && (
                <>
                  <div className="mb-3">
                    <span className="block text-sm font-medium text-gray-700 mb-1">User:</span>
                    <p className="text-sm">{sessionInfo.user.email}</p>
                  </div>
                  
                  <div className="mb-3">
                    <span className="block text-sm font-medium text-gray-700 mb-1">Session Expiry:</span>
                    <p className="text-sm">{new Date(sessionInfo.expires_at * 1000).toLocaleString()}</p>
                  </div>
                  
                  <div className="mb-3">
                    <span className="block text-sm font-medium text-gray-700 mb-1">User ID:</span>
                    <p className="text-sm break-all">{sessionInfo.user.id}</p>
                  </div>
                </>
              )}
              
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={refreshSession}
                  disabled={isSessionRefreshing}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {isSessionRefreshing ? 'Refreshing...' : 'Refresh Session'}
                </button>
                
                <button
                  onClick={testCreditsAPI}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Test Credits API
                </button>
                
                {sessionInfo ? (
                  <button
                    onClick={signOut}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Auth Events Log</h2>
          
          <div className="bg-gray-100 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
            {authEvents.length === 0 ? (
              <p className="text-gray-500">No auth events recorded yet</p>
            ) : (
              authEvents.map((event, i) => (
                <div key={i} className="mb-1 break-all">
                  {event}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Troubleshooting Tips</h3>
        
        <ul className="list-disc pl-5 space-y-1">
          <li>If you're seeing <strong>CLOSED</strong> realtime status, it could indicate connectivity issues with Supabase.</li>
          <li>Verify that you are making authenticated requests to the API by checking the session status.</li>
          <li>Check that your environment variables are properly set in <code>.env.local</code>.</li>
          <li>Try refreshing your session token if you're encountering authentication issues.</li>
          <li>Visit the project dashboard page and go to <strong>Database</strong> → <strong>Replication</strong> to confirm realtime is enabled.</li>
          <li>Clear browser storage and cookies if you're experiencing persistent authentication issues.</li>
        </ul>
        
        <div className="mt-4">
          <Link
            href="/dashboard/test-realtime"
            className="text-blue-600 hover:underline"
          >
            Go to Realtime Connection Test →
          </Link>
        </div>
      </div>
    </div>
  );
} 