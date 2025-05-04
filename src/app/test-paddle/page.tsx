'use client';

import { useState, useEffect } from 'react';
import { initPaddle } from '@/lib/paddle/client-debug';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export default function TestPaddlePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const log = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  useEffect(() => {
    log('Page loaded - fetching user...');
    
    // Initialize Paddle
    initPaddle().then(paddle => {
      if (paddle) {
        log('Paddle initialized on page load');
      } else {
        log('Failed to initialize Paddle on page load');
      }
    });
    
    // Fetch user
    const fetchUser = async () => {
      const supabase = createClientComponentClient<Database>();
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        log(`Auth error: ${error.message}`);
        return;
      }
      
      if (data.user) {
        log(`User authenticated: ${data.user.email}`);
        setUser(data.user);
      } else {
        log('No user authenticated');
      }
    };
    
    fetchUser();
  }, []);
  
  const handleCheckout = async () => {
    if (!user?.email) {
      log('No authenticated user! Please log in first.');
      return;
    }
    
    try {
      setIsLoading(true);
      log('Initializing Paddle...');
      
      const paddle = await initPaddle();
      if (!paddle) {
        throw new Error('Failed to initialize Paddle');
      }
      
      log('Opening checkout...');
      
      // Use native Paddle API directly
      try {
        window.Paddle.Checkout.open({
          items: [{
            priceId: 'pri_01hxy2xmmz4xr3y31wpqfnw9v8', // Pro pack (100 credits)
            quantity: 1
          }],
          customer: {
            email: user.email
          },
          settings: {
            displayMode: 'overlay',
            theme: 'light',
            locale: 'en'
          },
          successCallback: () => {
            log('Checkout completed successfully');
            setIsLoading(false);
          },
          closeCallback: () => {
            log('Checkout closed by user');
            setIsLoading(false);
          }
        });
        
        log('Checkout opened successfully');
      } catch (paddleError: any) {
        log(`Paddle checkout error: ${paddleError?.message || 'Unknown error'}`);
        
        if (paddleError?.message?.includes('domain')) {
          log('ERROR: Domain not approved in Paddle');
        }
        if (paddleError?.message?.includes('checkout_not_enabled')) {
          log('ERROR: Checkout not enabled for this account');
        }
        
        setIsLoading(false);
      }
    } catch (error: any) {
      log(`Error: ${error?.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Paddle Checkout Test Page</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">User Status</h2>
        {user ? (
          <div className="p-4 bg-green-50 rounded-md border border-green-200 text-green-800">
            <p>Logged in as: {user.email}</p>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200 text-yellow-800">
            <p>Not logged in. Please <a href="/auth/login" className="underline">log in</a> to test checkout.</p>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Checkout</h2>
        <button
          onClick={handleCheckout}
          disabled={isLoading || !user}
          className="px-6 py-3 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Opening Checkout...' : 'Open Paddle Checkout'}
        </button>
      </div>
      
      <div className="bg-gray-900 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="pb-1">
              {log}
            </div>
          ))}
          {logs.length === 0 && <div className="text-gray-500">No logs yet</div>}
        </div>
      </div>
    </div>
  );
} 