'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { initPaddle, openCheckout } from '@/lib/paddle/client';
import Link from 'next/link';

export default function TestPaddlePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add a log with timestamp
  const log = (message: string) => {
    console.log(`[TestPaddle] ${message}`);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  // Initialize on load
  useEffect(() => {
    const init = async () => {
      try {
        log('Page loaded, initializing Paddle...');
        const paddleResult = await initPaddle();
        
        if (paddleResult) {
          log('✅ Paddle initialized successfully');
        } else {
          log('❌ Paddle initialization failed');
        }
        
        // Check user authentication
        log('Checking user authentication...');
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          log(`❌ Error fetching user: ${error.message}`);
          return;
        }
        
        if (data?.user) {
          log(`✅ User authenticated as: ${data.user.email}`);
          setUser(data.user);
        } else {
          log('❌ No authenticated user found');
        }
      } catch (error: any) {
        log(`❌ Error during initialization: ${error?.message || 'Unknown error'}`);
      }
    };
    
    init();
  }, []);
  
  // Handle checkout
  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      log('Starting checkout process...');
      
      // First verify user is authenticated
      if (!user) {
        log('❌ Cannot checkout: User not authenticated');
        return;
      }
      
      log(`Attempting to open checkout for user: ${user.email}`);
      
      // Using environment variable for Pro pack price ID
      const priceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || '';
      
      // Call openCheckout with the proper arguments
      const result = await openCheckout(priceId, user.email);
      
      log(`Checkout open result: ${result ? 'Success' : 'Failed'}`);
    } catch (error: any) {
      log(`❌ Error during checkout: ${error?.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Paddle Checkout Test Page</h1>
      
      <div className="bg-blue-50 p-4 rounded-md mb-6 border border-blue-200">
        <p className="mb-2">
          <span className="font-semibold">Need more detailed debugging?</span>
        </p>
        <Link 
          href="/test-paddle/debug" 
          className="text-blue-600 underline hover:text-blue-800"
        >
          Go to Enhanced Debug Page →
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-md shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">User Status</h2>
        
        {user ? (
          <div className="p-4 bg-green-50 rounded-md border border-green-200">
            <p className="text-green-800 font-medium">✅ Authenticated</p>
            <p className="text-sm">Email: {user.email}</p>
          </div>
        ) : (
          <div className="p-4 bg-red-50 rounded-md border border-red-200">
            <p className="text-red-800 font-medium">❌ Not authenticated</p>
            <p className="text-sm">Please <a href="/auth/login" className="text-blue-600 underline">log in</a> to test checkout</p>
          </div>
        )}
      </div>
      
      <button 
        onClick={handleCheckout}
        disabled={!user || isLoading}
        className="bg-green-600 px-6 py-3 rounded-md text-white font-medium disabled:opacity-50 mb-6"
      >
        {isLoading ? 'Processing...' : 'Test Checkout'}
      </button>
      
      <div className="bg-gray-900 p-6 rounded-md">
        <h2 className="text-lg font-semibold text-white mb-4">Logs</h2>
        <pre className="bg-black text-green-400 p-4 rounded-md font-mono text-sm h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="pb-1">
              {log}
            </div>
          ))}
          {logs.length === 0 && <div className="text-gray-500">No logs yet</div>}
        </pre>
      </div>
    </div>
  );
} 