'use client';

import { useState, useEffect } from 'react';
import { initPaddle, openCheckout } from '@/lib/paddle/client';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';
import { trackCreditPurchase } from '@/lib/analytics';

interface CreditPurchaseButtonProps {
  priceId: string;
  packageName: string;
  className?: string;
  children?: React.ReactNode;
  mode?: 'redirect' | 'direct'; // 'redirect' sends to checkout page, 'direct' opens Paddle
}

export default function CreditPurchaseButton({
  priceId,
  packageName,
  className = '',
  children = `Buy ${packageName}`,
  mode = 'redirect'
}: CreditPurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPaddleReady, setIsPaddleReady] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [priceVerified, setPriceVerified] = useState(false);
  const router = useRouter();

  const logInfo = (message: string) => {
    console.log(`[CreditPurchaseButton] ${message}`);
  };

  const logError = (message: string, error?: any) => {
    console.error(`[CreditPurchaseButton] ${message}`, error || '');
  };

  // Verify the price ID using the API
  useEffect(() => {
    const verifyPriceId = async () => {
      if (!priceId) {
        setDebugInfo('No price ID provided to verify');
        return;
      }
      
      try {
        logInfo(`Verifying price ID: ${priceId}`);
        const response = await fetch(`/api/paddle/verify-price?priceId=${encodeURIComponent(priceId)}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to verify price ID');
        }
        
        if (result.success && result.data) {
          const { isPriceValid, isFormatValid, variableName } = result.data;
          setPriceVerified(isPriceValid);
          
          if (!isPriceValid) {
            setDebugInfo(`Price ID ${priceId} is not valid. Check the ${variableName} environment variable.`);
          } else if (!isFormatValid) {
            setDebugInfo(`Price ID format may be invalid. Expected to start with 'pri_'.`);
          } else {
            logInfo('Price ID verified successfully');
          }
        }
      } catch (error: any) {
        logError('Error verifying price ID:', error);
        setDebugInfo(`Price verification error: ${error.message}`);
      }
    };
    
    if (priceId) {
      verifyPriceId();
    }
  }, [priceId]);

  // Initialize Paddle and fetch user data on mount
  useEffect(() => {
    const init = async () => {
      try {
        logInfo(`Initializing Paddle for ${packageName} purchase button...`);
        
        // Check that priceId is valid
        if (!priceId) {
          setDebugInfo(`Missing price ID. Check that NEXT_PUBLIC_PADDLE_PRICE_${packageName.toUpperCase()} is set in .env.local`);
          throw new Error('Missing price ID');
        }
        
        // Initialize Paddle
        const paddle = await initPaddle();
        if (paddle) {
          logInfo('Paddle initialized successfully');
          setIsPaddleReady(true);
        } else {
          const envSetting = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'Not set';
          const tokenExists = !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
          setDebugInfo(`Paddle init failed. ENV: ${envSetting}, Token exists: ${tokenExists}`);
          logError('Paddle initialization returned null');
        }
      } catch (error: any) {
        logError('Error initializing Paddle:', error);
        setDebugInfo(`Init error: ${error.message || 'Unknown error'}`);
      }
    };

    init();

    // Fetch user data
    const fetchUser = async () => {
      logInfo('Fetching user data for credit purchase...');
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          // Only log the error but don't show it to the user
          // Non-authenticated users should be able to see pricing without errors
          logError('Error fetching user:', error);
          // Don't set error message for unauthenticated users on pricing page
          // setError('Authentication error. Please log in and try again.');
          return;
        }
        
        if (data.user) {
          logInfo(`User authenticated with email: ${data.user.email}`);
          setUser({ email: data.user.email || '' });
        } else {
          logInfo('No user authenticated for credit purchase');
        }
      } catch (e) {
        // Only log unexpected errors but don't show them to users on the pricing page
        logError('Unexpected error in fetchUser:', e);
        // Don't set error for general authentication issues on pricing page
        // setError('Unexpected authentication error. Please refresh and try again.');
      }
    };
    
    fetchUser();
  }, [packageName, priceId]);

  const handlePurchase = async () => {
    try {
      logInfo(`Button clicked for ${packageName} (${priceId})`);
      setIsLoading(true);
      setError(null);
      setDebugInfo(null);
      
      // If user is not logged in, redirect to login with return URL to checkout
      if (!user) {
        logInfo('User not authenticated, redirecting to login');
        const returnUrl = encodeURIComponent(`/dashboard/checkout?priceId=${priceId}&packageName=${packageName}`);
        router.push(`/auth/login?returnUrl=${returnUrl}`);
        return;
      }

      // Validate the price ID
      if (!priceId) {
        setError('Missing price ID. Please contact support.');
        setDebugInfo(`NEXT_PUBLIC_PADDLE_PRICE_${packageName.toUpperCase()} not set in environment variables`);
        return;
      }

      // Show warning if price is not verified
      if (!priceVerified) {
        setDebugInfo(`Warning: Price ID ${priceId} could not be verified. This may cause checkout to fail.`);
      }

      // Track the credit purchase initiation
      trackCreditPurchase(packageName, 0);

      // If in redirect mode, send to dashboard checkout page
      if (mode === 'redirect') {
        logInfo(`Redirecting to checkout page for ${packageName} (${priceId}) for user ${user.email}`);
        router.push(`/dashboard/checkout?priceId=${priceId}&packageName=${packageName}`);
        return;
      }
      
      // If in direct mode, open Paddle checkout immediately
      if (mode === 'direct') {
        try {
          logInfo(`Opening Paddle checkout for ${priceId}`);
          const paddle = await initPaddle();
          
          if (!paddle) {
            throw new Error('Failed to initialize Paddle');
          }
          
          paddle.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            customer: user ? { email: user.email } : undefined,
            successCallback: (data: any) => {
              logInfo('Purchase completed successfully');
              // Track successful purchase
              trackCreditPurchase(packageName, 0);
              window.location.reload();
            },
          });
          
          return; // Exit early and let the timeout handle errors if needed
        } catch (checkoutError: any) {
          const errorMessage = checkoutError.message || 'Unknown error';
          logError('Failed to open Paddle checkout:', errorMessage);
          setDebugInfo(`Checkout error: ${errorMessage}`);
        }
      }
      
    } catch (error: any) {
      logError('Error during checkout process:', error);
      setError(error?.message || 'There was a problem initiating the checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={handlePurchase}
        disabled={isLoading}
        className={`inline-flex items-center justify-center ${className}`}
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          user ? children : 'Get Started'
        )}
      </button>
      
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded text-xs text-gray-700">
          <p className="font-medium">Debug info:</p>
          <p className="font-mono">{debugInfo}</p>
        </div>
      )}
    </div>
  );
} 