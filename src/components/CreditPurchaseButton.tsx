'use client';

import { useState, useEffect } from 'react';
import { initPaddle, openCheckout } from '@/lib/paddle/client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';

interface CreditPurchaseButtonProps {
  priceId: string;
  packageName: string;
  className?: string;
  children?: React.ReactNode;
}

export default function CreditPurchaseButton({
  priceId,
  packageName,
  className = '',
  children = `Buy ${packageName}`
}: CreditPurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPaddleReady, setIsPaddleReady] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const router = useRouter();

  const logInfo = (message: string) => {
    console.log(`[CreditPurchaseButton] ${message}`);
  };

  const logError = (message: string, error?: any) => {
    console.error(`[CreditPurchaseButton] ${message}`, error || '');
  };

  // Initialize Paddle and fetch user data on mount
  useEffect(() => {
    const init = async () => {
      try {
        logInfo(`Initializing Paddle for ${packageName} purchase button...`);
        // Initialize Paddle
        const paddle = await initPaddle();
        if (paddle) {
          logInfo('Paddle initialized successfully');
          setIsPaddleReady(true);
        } else {
          logError('Paddle initialization returned null');
        }
      } catch (error) {
        logError('Error initializing Paddle:', error);
      }
    };

    init();

    // Fetch user data
    const fetchUser = async () => {
      logInfo('Fetching user data for credit purchase...');
      const supabase = createClientComponentClient<Database>();
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        logError('Error fetching user:', error);
        return;
      }
      
      if (data.user) {
        logInfo(`User authenticated with email: ${data.user.email}`);
        setUser({ email: data.user.email || '' });
      } else {
        logInfo('No user authenticated for credit purchase');
      }
    };
    
    fetchUser();
  }, [packageName]);

  const handlePurchase = async () => {
    try {
      logInfo(`Button clicked for ${packageName} (${priceId})`);
      setIsLoading(true);
      
      // If user is not logged in, redirect to login
      if (!user) {
        logInfo('User not authenticated, redirecting to login');
        router.push('/auth/login');
        return;
      }

      // Ensure Paddle is ready
      if (!isPaddleReady) {
        logInfo('Paddle not ready, initializing...');
        const paddle = await initPaddle();
        if (!paddle) {
          throw new Error('Failed to initialize Paddle');
        }
        setIsPaddleReady(true);
      }

      logInfo(`Initiating purchase for ${packageName} (${priceId}) for user ${user.email}`);
      
      // Try direct Paddle API first if available
      if (typeof window !== 'undefined' && window.Paddle && window.Paddle.Checkout) {
        try {
          logInfo('Attempting to use direct Paddle API...');
          
          window.Paddle.Checkout.open({
            items: [
              {
                priceId: priceId,
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
              logInfo('Checkout completed successfully via direct API');
            },
            closeCallback: () => {
              logInfo('Checkout closed by user via direct API');
              setIsLoading(false);
            }
          });
          
          logInfo('Direct Paddle API call completed - checkout should be visible');
          return;
        } catch (directApiError) {
          logError('Error using direct Paddle API, falling back to openCheckout:', directApiError);
        }
      }
      
      // Fallback to openCheckout helper
      logInfo('Using openCheckout helper...');
      await openCheckout(priceId, user.email);
      logInfo('openCheckout call completed');
      
    } catch (error) {
      logError('Error during checkout process:', error);
      alert('There was a problem initiating the checkout process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        children
      )}
    </button>
  );
} 