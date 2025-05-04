'use client';

import { useState, useEffect } from 'react';
import { initPaddle } from '@/lib/paddle/client-debug';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export default function PaddleDebugButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [paddleInitialized, setPaddleInitialized] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Fetch user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        addLog('Fetching user data...');
        const supabase = createClientComponentClient<Database>();
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          addLog(`Error fetching user: ${error.message}`);
          return;
        }
        
        if (data.user) {
          addLog(`User authenticated with email: ${data.user.email}`);
          setUser({ email: data.user.email || '' });
        } else {
          addLog('No user authenticated');
        }
      } catch (error) {
        addLog(`Unexpected error fetching user: ${error}`);
      }
    };
    
    fetchUser();
  }, []);

  // Manually test Paddle initialization
  const testPaddleInit = async () => {
    try {
      addLog('Testing Paddle initialization...');
      setIsLoading(true);
      
      // Initialize Paddle
      const paddle = await initPaddle();
      
      if (paddle) {
        addLog('✅ Paddle initialized successfully');
        setPaddleInitialized(true);
        
        // Check if window.Paddle exists and is properly loaded
        if (typeof window !== 'undefined' && window.Paddle) {
          addLog(`Paddle Version: ${window.Paddle.version || 'Unknown'}`);
          addLog(`Environment: ${window.Paddle.Environment.get()}`);
          
          // Check if Checkout is available
          if (window.Paddle.Checkout) {
            addLog('✅ Paddle.Checkout is available');
          } else {
            addLog('❌ Paddle.Checkout is NOT available');
          }
        }
      } else {
        addLog('❌ Paddle initialization failed');
      }
    } catch (error) {
      addLog(`❌ Error initializing Paddle: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test checkout flow
  const testCheckout = async () => {
    if (!user?.email) {
      addLog('❌ Cannot test checkout: No authenticated user');
      return;
    }
    
    try {
      addLog('Testing checkout flow...');
      setIsLoading(true);
      
      // Check if Paddle is loaded
      if (typeof window === 'undefined' || !window.Paddle) {
        addLog('❌ Paddle not loaded, initializing first...');
        await testPaddleInit();
      }
      
      // Try direct API approach
      addLog('Opening checkout using direct Paddle API...');
      
      try {
        window.Paddle.Checkout.open({
          items: [
            {
              priceId: 'pri_01hxy2xmmz4xr3y31wpqfnw9v8', // Pro pack price ID
              quantity: 1
            }
          ],
          customer: {
            email: user.email
          },
          settings: {
            displayMode: 'overlay',
            theme: 'light',
            locale: 'en'
          },
          successCallback: () => {
            addLog('✅ Checkout completed successfully');
          },
          closeCallback: () => {
            addLog('Checkout closed by user');
            setIsLoading(false);
          }
        });
        
        addLog('Checkout API call completed - checkout should be visible now');
      } catch (error: any) {
        addLog(`❌ Error opening checkout: ${error?.message || 'Unknown error'}`);
        
        if (error?.message?.includes('checkout_not_enabled')) {
          addLog('⚠️ CRITICAL: Checkout not enabled for your Paddle account');
          addLog('Check with Paddle Support that the onboarding process has completed');
        } else if (error?.message?.includes('domain')) {
          addLog('⚠️ CRITICAL: Domain not approved in Paddle');
          addLog(`Current domain: ${window.location.host}`);
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      addLog(`❌ Error during checkout flow: ${error}`);
      setIsLoading(false);
    }
  };

  const checkDomainSetup = () => {
    addLog(`Current origin: ${window.location.origin}`);
    addLog(`Current host: ${window.location.host}`);
    addLog(`Current pathname: ${window.location.pathname}`);
    addLog(`Environment variables loaded:`);
    
    // Check relevant environment variables
    if (process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
      const tokenShort = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN.substring(0, 10) + '...';
      addLog(`✅ NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: ${tokenShort}`);
    } else {
      addLog('❌ NEXT_PUBLIC_PADDLE_CLIENT_TOKEN not set');
    }
    
    if (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT) {
      addLog(`✅ NEXT_PUBLIC_PADDLE_ENVIRONMENT: ${process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT}`);
    } else {
      addLog('❌ NEXT_PUBLIC_PADDLE_ENVIRONMENT not set, defaulting to sandbox');
    }
    
    addLog('⚠️ NOTE: Paddle checkout does not work on localhost by default');
    addLog('Consider using ngrok to test with a public domain');
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 mb-4">
      <h3 className="text-lg font-semibold mb-4">Paddle Checkout Debugger</h3>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={testPaddleInit}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Test Paddle Init'}
        </button>
        
        <button
          onClick={testCheckout}
          disabled={isLoading || !user}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Test Checkout'}
        </button>
        
        <button
          onClick={checkDomainSetup}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          Check Setup
        </button>
      </div>
      
      {/* Status */}
      <div className="mb-4">
        <p className="text-sm">
          <span className="font-medium">User:</span> {user ? user.email : 'Not authenticated'}
        </p>
        <p className="text-sm">
          <span className="font-medium">Paddle initialized:</span> {paddleInitialized ? '✅ Yes' : '❌ No'}
        </p>
      </div>
      
      {/* Logs */}
      <div className="bg-gray-100 rounded-md p-4 max-h-64 overflow-y-auto text-xs font-mono">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="pb-1">
              {log}
            </div>
          ))
        ) : (
          <p className="text-gray-500">Click a button to see debug logs</p>
        )}
      </div>
    </div>
  );
} 