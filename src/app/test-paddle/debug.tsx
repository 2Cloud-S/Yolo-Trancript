'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { initPaddle } from '@/lib/paddle/client-debug';
import { openCheckout } from '@/lib/paddle/client';

export default function PaddleDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [paddleInitialized, setPaddleInitialized] = useState(false);
  const [networkCalls, setNetworkCalls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add a log
  const log = (message: string) => {
    console.log(`[PaddleDebug] ${message}`);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  // Initialize Paddle
  const handleInitializePaddle = async () => {
    try {
      setIsLoading(true);
      log('Initializing Paddle...');
      
      const paddle = await initPaddle();
      if (paddle) {
        log('✅ Paddle initialized successfully');
        setPaddleInitialized(true);
        
        if (typeof window !== 'undefined' && window.Paddle) {
          log(`Paddle Version: ${window.Paddle.version || 'Unknown'}`);
          log(`Environment: ${window.Paddle.Environment.get()}`);
          
          if (window.Paddle.Checkout) {
            log('✅ Paddle.Checkout is available');
          } else {
            log('❌ Paddle.Checkout is NOT available');
          }
        }
      } else {
        log('❌ Paddle initialization failed');
      }
    } catch (error: any) {
      log(`❌ Error initializing Paddle: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch user status
  const handleFetchUser = async () => {
    try {
      setIsLoading(true);
      log('Fetching user status...');
      
      const supabase = createClientComponentClient<Database>();
      
      // Check for session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        log(`❌ Session error: ${sessionError.message}`);
        return;
      }
      
      if (!sessionData.session) {
        log('❌ No active session found');
        setAuthChecked(true);
        return;
      }
      
      log(`✅ Active session found: ${sessionData.session.expires_at}`);
      
      // Get user data
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        log(`❌ User error: ${userError.message}`);
        return;
      }
      
      if (!userData.user) {
        log('❌ No user found in session');
        return;
      }
      
      log(`✅ User authenticated as: ${userData.user.email}`);
      setUser(userData.user);
      setAuthChecked(true);
    } catch (error: any) {
      log(`❌ Error fetching user: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Test checkout
  const handleOpenCheckout = async () => {
    if (!user?.email) {
      log('❌ Cannot test checkout: No authenticated user');
      return;
    }
    
    try {
      setIsLoading(true);
      log('Opening checkout...');
      
      // Make sure Paddle is initialized
      if (!paddleInitialized || !window.Paddle) {
        log('Paddle not initialized, initializing first...');
        await handleInitializePaddle();
      }
      
      // Monitor network requests
      const originalFetch = window.fetch;
      window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : 'unknown';
        if (url.includes('paddle.com')) {
          log(`🌐 Network request to: ${url}`);
          setNetworkCalls(prev => [...prev, url]);
        }
        return originalFetch.apply(this, [input, init as any]);
      };
      
      // Pro pack price ID
      const priceId = 'pri_01jtdj3q5xd7v2gvj87yfz57ym';
      log(`Using price ID: ${priceId}`);
      
      // First try using the standard client
      log('Attempting to open checkout with standard client...');
      try {
        const result = await openCheckout(priceId, user.email);
        log(`Standard checkout result: ${result ? 'Success' : 'Failed'}`);
      } catch (clientError: any) {
        log(`❌ Standard client error: ${clientError?.message || 'Unknown error'}`);
        
        // Fall back to direct API if standard client fails
        log('Falling back to direct Paddle API...');
        
        // Create checkout options
        const checkoutOptions = {
          items: [{
            priceId: priceId,
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
            log('✅ Checkout completed successfully');
            setIsLoading(false);
          },
          closeCallback: () => {
            log('Checkout closed by user');
            setIsLoading(false);
            
            // Restore original fetch
            window.fetch = originalFetch;
          }
        };
        
        log(`Opening checkout with options: ${JSON.stringify(checkoutOptions, null, 2)}`);
        
        try {
          window.Paddle.Checkout.open(checkoutOptions);
          
          log('✅ Checkout.open() called successfully');
          
          // Check if anything happened
          setTimeout(() => {
            if (networkCalls.length === 0) {
              log('⚠️ No network calls detected to paddle.com');
              log('This suggests a client-side issue with Paddle.js');
              setIsLoading(false);
            }
          }, 3000);
        } catch (error: any) {
          log(`❌ Error opening checkout: ${error?.message || 'Unknown error'}`);
          
          if (error?.message?.includes('checkout_not_enabled')) {
            log('⚠️ CRITICAL: Checkout not enabled for your Paddle account');
            log('Check with Paddle Support that the onboarding process has completed');
          } else if (error?.message?.includes('domain')) {
            log('⚠️ CRITICAL: Domain not approved in Paddle');
            log(`Current domain: ${window.location.host}`);
          }
          
          setIsLoading(false);
        }
      }
    } catch (error: any) {
      log(`❌ Error during checkout process: ${error?.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };
  
  // Check domain setup
  const handleCheckDomain = () => {
    log('Checking domain setup...');
    log(`Current URL: ${window.location.href}`);
    log(`Origin: ${window.location.origin}`);
    log(`Host: ${window.location.host}`);
    log(`Hostname: ${window.location.hostname}`);
    log(`Protocol: ${window.location.protocol}`);
    log(`Port: ${window.location.port || '(default)'}`);
    
    // Check for localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      log('⚠️ WARNING: Using localhost - Paddle checkout does not work on localhost by default');
      log('Consider using ngrok to test with a public domain');
    }
    
    // Check relevant environment variables
    log('Environment variables:');
    
    if (process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
      const tokenShort = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN.substring(0, 8) + '...';
      log(`✅ NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: ${tokenShort}`);
    } else {
      log('❌ NEXT_PUBLIC_PADDLE_CLIENT_TOKEN not set');
    }
    
    if (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT) {
      log(`✅ NEXT_PUBLIC_PADDLE_ENVIRONMENT: ${process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT}`);
    } else {
      log('❌ NEXT_PUBLIC_PADDLE_ENVIRONMENT not set');
    }
  };
  
  // Initialize on load
  useEffect(() => {
    log('Page loaded - checking authentication status...');
    handleFetchUser();
  }, []);
  
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Enhanced Paddle Checkout Debugger</h1>
      
      {/* Authentication Status */}
      <div className="bg-white rounded-md shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
        
        {!authChecked ? (
          <p className="text-gray-500">Checking authentication status...</p>
        ) : user ? (
          <div className="p-4 bg-green-50 rounded-md border border-green-200">
            <p className="text-green-800 font-medium">✅ Authenticated</p>
            <p className="text-sm">Email: {user.email}</p>
            <p className="text-sm">ID: {user.id}</p>
          </div>
        ) : (
          <div className="p-4 bg-red-50 rounded-md border border-red-200">
            <p className="text-red-800 font-medium">❌ Not authenticated</p>
            <p className="text-sm">Please <a href="/auth/login" className="text-blue-600 underline">log in</a> to test checkout</p>
          </div>
        )}
        
        <button 
          onClick={handleFetchUser}
          disabled={isLoading}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          Refresh Auth Status
        </button>
      </div>
      
      {/* Actions */}
      <div className="bg-white rounded-md shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Test Actions</h2>
        
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleInitializePaddle}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Initialize Paddle'}
          </button>
          
          <button 
            onClick={handleOpenCheckout}
            disabled={isLoading || !user}
            className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Test Checkout'}
          </button>
          
          <button 
            onClick={handleCheckDomain}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md"
          >
            Check Domain Setup
          </button>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {paddleInitialized ? 
              '✅ Paddle is initialized' : 
              '❌ Paddle is not initialized - click "Initialize Paddle" first'}
          </p>
        </div>
      </div>
      
      {/* Logs */}
      <div className="bg-gray-900 rounded-md p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Debug Logs</h2>
        <pre className="bg-black text-green-400 p-4 rounded-md font-mono text-sm h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="pb-1">
              {log}
            </div>
          ))}
          {logs.length === 0 && <div className="text-gray-500">No logs yet</div>}
        </pre>
      </div>
      
      {networkCalls.length > 0 && (
        <div className="bg-white rounded-md shadow-md p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Paddle Network Calls</h2>
          <ul className="list-disc pl-5">
            {networkCalls.map((url, index) => (
              <li key={index} className="text-sm text-gray-800">{url}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 