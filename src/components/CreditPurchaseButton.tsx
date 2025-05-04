'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation';
import { initPaddle, openCheckout, savePendingPurchase, clearPendingPurchase } from '@/lib/paddle/client';

interface CreditPurchaseButtonProps {
  priceId: string;
  packageName: string;
  className?: string;
  text?: string;
}

export default function CreditPurchaseButton({
  priceId,
  packageName,
  className = '',
  text = 'Purchase'
}: CreditPurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const initPaddleAsync = async () => {
      try {
        await initPaddle();
      } catch (error) {
        console.info('Paddle initialization skipped:', error);
      }
    };

    initPaddleAsync();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.info('User not authenticated:', error.message);
        setIsAuthenticated(false);
        return;
      }
      
      if (!user) {
        console.info('No user found');
        setIsAuthenticated(false);
        return;
      }
      
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.info('Error fetching user:', error);
      setIsAuthenticated(false);
    }
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    
    try {
      // Save the purchase intent to localStorage using utility function
      savePendingPurchase(priceId, packageName);
      
      // Check if the user is authenticated
      if (!isAuthenticated) {
        console.log('User not authenticated, redirecting to login with redirect parameter');
        const currentPath = window.location.pathname;
        router.push(`/auth/login?redirect=${encodeURIComponent('/dashboard')}`);
        return;
      }
      
      if (!user || !user.email) {
        console.error('User email not available');
        setIsLoading(false);
        return;
      }

      const result = await openCheckout(priceId, user.email);
      if (!result) {
        console.error('Failed to open checkout');
      } else {
        // Add an event listener for successful purchase
        const handlePurchaseSuccess = () => {
          console.log('Purchase completed successfully!');
          clearPendingPurchase();
          window.removeEventListener('paddle:purchase:success', handlePurchaseSuccess);
        };
        
        window.addEventListener('paddle:purchase:success', handlePurchaseSuccess);
      }
    } catch (error) {
      console.error('Error during purchase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={isLoading}
      className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium ${className} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      {isLoading ? 'Processing...' : text}
    </button>
  );
} 