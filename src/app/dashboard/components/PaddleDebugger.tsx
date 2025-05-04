'use client';

import { useState, useEffect } from 'react';
import { initPaddle, openCheckout } from '@/lib/paddle/client';

export default function PaddleDebugger() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [priceId, setPriceId] = useState('pri_01jtdj3q5xd7v2gvj87yfz57ym'); // Default price ID
  const [paddleLoaded, setPaddleLoaded] = useState(false);

  useEffect(() => {
    // Add console log listeners to capture Paddle logs
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      originalConsoleLog(...args);
      if (typeof args[0] === 'string' && args[0].includes('Paddle')) {
        addLog(`📋 ${args.join(' ')}`);
      }
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      if (typeof args[0] === 'string' && args[0].includes('Paddle')) {
        addLog(`❌ ${args.join(' ')}`);
      }
    };

    return () => {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toISOString().slice(11, 19)}] ${message}`]);
  };

  const testInitialization = async () => {
    try {
      setStatus('loading');
      addLog('Testing Paddle initialization...');
      
      // Check if Paddle exists globally
      if (typeof window !== 'undefined' && window.Paddle) {
        addLog('Paddle already exists in the window object');
      }
      
      const paddle = await initPaddle();
      
      if (paddle) {
        addLog('✓ Paddle initialized successfully');
        setPaddleLoaded(true);
        setStatus('success');
      } else {
        addLog('✗ Failed to initialize Paddle');
        setStatus('error');
      }
    } catch (error) {
      addLog(`✗ Error during initialization: ${error instanceof Error ? error.message : String(error)}`);
      setStatus('error');
    }
  };

  const testCheckout = async () => {
    if (!paddleLoaded) {
      addLog('⚠️ Please initialize Paddle first before testing checkout');
      return;
    }
    
    try {
      setStatus('loading');
      addLog(`Opening checkout for price ID: ${priceId}`);
      
      await openCheckout(priceId);
      
      addLog('Checkout request sent successfully');
      setStatus('success');
    } catch (error) {
      addLog(`✗ Error during checkout: ${error instanceof Error ? error.message : String(error)}`);
      setStatus('error');
    }
  };

  const checkEnvironment = () => {
    addLog('🔍 Checking environment variables:');
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'undefined';
    const hasToken = !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    
    addLog(`NEXT_PUBLIC_PADDLE_ENVIRONMENT: ${environment}`);
    addLog(`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: ${hasToken ? 'Set ✓' : 'Not set ✗'}`);
    
    if (window.location.hostname === 'localhost') {
      addLog('⚠️ Warning: You are on localhost. Paddle checkout may not work.');
      addLog('Consider using ngrok for local testing.');
    }
  };

  const clearLogs = () => {
    setLog([]);
    setStatus('idle');
  };

  return (
    <div className="paddle-debugger">
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priceId" className="block text-sm font-medium text-gray-700 mb-1">
            Price ID
          </label>
          <input
            type="text"
            id="priceId"
            value={priceId}
            onChange={(e) => setPriceId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <div className="flex items-end space-x-2">
          <button
            onClick={testInitialization}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm"
            disabled={status === 'loading'}
          >
            {paddleLoaded ? 'Reinitialize' : 'Initialize Paddle'}
          </button>
          <button
            onClick={testCheckout}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm"
            disabled={status === 'loading' || !paddleLoaded}
          >
            Test Checkout
          </button>
          <button
            onClick={checkEnvironment}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-md text-sm"
          >
            Check Env
          </button>
          <button
            onClick={clearLogs}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-xs overflow-auto h-60">
        {log.length > 0 ? (
          log.map((entry, index) => <div key={index}>{entry}</div>)
        ) : (
          <div className="text-gray-500">No logs yet. Run a test to see output here.</div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        <p>
          Note: To test in development, you must use a domain that Paddle accepts (not localhost).
          Consider using ngrok for local testing.
        </p>
      </div>
    </div>
  );
} 