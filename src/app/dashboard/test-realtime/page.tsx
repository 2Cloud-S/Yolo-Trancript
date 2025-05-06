'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function RealtimeTest() {
  const [status, setStatus] = useState('Not connected');
  const [logs, setLogs] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const supabase = createClient();

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          addLog(`Auth error: ${error.message}`);
          return;
        }
        
        if (session?.user) {
          setUser(session.user);
          addLog(`Authenticated as: ${session.user.email}`);
        } else {
          addLog('Not authenticated');
        }
      } catch (err: any) {
        addLog(`Error checking auth: ${err.message}`);
      }
    };
    
    checkAuth();
  }, []);

  // Set up realtime subscription
  const setupSubscription = async () => {
    if (!user) {
      addLog('Cannot subscribe: no authenticated user');
      return;
    }
    
    try {
      setStatus('Connecting...');
      addLog('Setting up subscription to user_credits table');
      
      // Subscribe to credit changes for the current user
      const channel = supabase
        .channel('credit-updates-test')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_credits',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            addLog(`Received event: ${JSON.stringify(payload)}`);
          }
        )
        .subscribe((status) => {
          setStatus(status);
          addLog(`Subscription status: ${status}`);
          setIsSubscribed(status === 'SUBSCRIBED');
        });
        
      return () => {
        addLog('Unsubscribing from channel');
        channel.unsubscribe();
      };
    } catch (err: any) {
      addLog(`Error setting up subscription: ${err.message}`);
      setStatus('Error');
    }
  };

  // Manually trigger a credit update for testing
  const triggerCreditUpdate = async () => {
    if (!user) {
      addLog('Cannot update credits: no authenticated user');
      return;
    }
    
    try {
      addLog('Triggering credit update via API');
      const response = await fetch('/api/credits/test-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`API error: ${response.status} - ${errorText}`);
        return;
      }
      
      const data = await response.json();
      addLog(`API response: ${JSON.stringify(data)}`);
    } catch (err: any) {
      addLog(`Error triggering update: ${err.message}`);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Supabase Realtime Connection Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Authentication:</p>
            <p className="font-medium">
              {user ? (
                <span className="text-green-600">✓ Authenticated as {user.email}</span>
              ) : (
                <span className="text-red-600">✗ Not authenticated</span>
              )}
            </p>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">Subscription Status:</p>
            <p className="font-medium">
              {status === 'SUBSCRIBED' ? (
                <span className="text-green-600">✓ Connected</span>
              ) : status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR' ? (
                <span className="text-red-600">✗ {status}</span>
              ) : (
                <span className="text-yellow-600">{status}</span>
              )}
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            {!isSubscribed ? (
              <button 
                onClick={setupSubscription}
                disabled={!user}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Subscribe to Updates
              </button>
            ) : (
              <button 
                onClick={triggerCreditUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Test Credit Update
              </button>
            )}
            
            <Link
              href="/auth/login"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-center"
            >
              {user ? 'Re-authenticate' : 'Sign In'}
            </Link>
          </div>
        </div>
        
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Connection Logs</h2>
          <div className="bg-gray-100 p-4 rounded-md h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Troubleshooting Tips</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Make sure you have the correct environment variables set up for Supabase</li>
          <li>Check that realtime is enabled for the user_credits table in Supabase</li>
          <li>Verify that RLS policies are properly configured to allow access to the table</li>
          <li>Try refreshing the page and signing in again if you encounter issues</li>
          <li>Look for errors in the browser console related to websocket connections</li>
        </ul>
      </div>
    </div>
  );
} 