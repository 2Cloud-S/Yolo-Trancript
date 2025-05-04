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

  // Initialize Paddle and fetch user data on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize Paddle
        const paddle = await initPaddle();
        if (paddle) {
          setIsPaddleReady(true);
        }
      } catch (error) {
        console.error('Error initializing Paddle:', error);
      }
    };

    init();

    // Fetch user data
    const fetchUser = async () => {
      console.log('Fetching user data for credit purchase...');
      const supabase = createClientComponentClient<Database>();
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error fetching user:', error);
        return;
      }
      
      if (data.user) {
        console.log('User authenticated with email:', data.user.email);
        setUser({ email: data.user.email || '' });
      } else {
        console.log('No user authenticated for credit purchase');
      }
    };
    
    fetchUser();
  }, []);

  const handlePurchase = async () => {
    try {
      setIsLoading(true);
      
      // If user is not logged in, redirect to login
      if (!user) {
        console.log('User not authenticated, redirecting to login');
        router.push('/auth/login');
        return;
      }

      // Ensure Paddle is ready
      if (!isPaddleReady) {
        console.log('Paddle not ready, initializing...');
        const paddle = await initPaddle();
        if (!paddle) {
          throw new Error('Failed to initialize Paddle');
        }
      }

      console.log(`Initiating purchase for ${packageName} (${priceId})`);
      
      // Open Paddle checkout
      await openCheckout(priceId, user.email);
      
    } catch (error) {
      console.error('Error during checkout process:', error);
      alert('There was a problem initiating the checkout process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={isLoading || (!user && isPaddleReady)}
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