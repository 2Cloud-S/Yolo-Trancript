'use client';

import { useState, useEffect } from 'react';
import { openCheckout } from '@/lib/paddle/client';
import { Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

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
  children = 'Get Started'
}: CreditPurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  // Use auth-helpers-nextjs instead of auth-helpers-react
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClientComponentClient<Database>();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser({ email: data.user.email || '' });
      }
    };
    
    fetchUser();
  }, []);

  const handlePurchase = async () => {
    try {
      setIsLoading(true);
      
      // If user is not logged in, redirect to signup
      if (!user) {
        window.location.href = `/auth/register?package=${packageName}&redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      
      // Open Paddle checkout
      await openCheckout(priceId, user.email);
      
    } catch (error) {
      console.error('Error opening checkout:', error);
      alert('There was an error opening the checkout. Please try again.');
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
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
} 