'use client';

import { useEffect, useState, useRef } from 'react';
import { CircleOff, RefreshCw, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type CreditBalanceProps = {
  showBuyButton?: boolean;
  compact?: boolean;
};

export default function CreditBalance({ showBuyButton = true, compact = false }: CreditBalanceProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Create Supabase client using the helper function that uses environment variables
  const supabase = createClient();
  
  // Keep track of subscription status
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const usageChannelRef = useRef<any>(null);
  const isSettingUpRef = useRef<boolean>(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCredits = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching credits...");
      // First check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No active session when fetching credits");
        setError('Please login to view credits');
        setIsLoading(false);
        return;
      }
      
      console.log("User authenticated, calling credits API");
      const response = await fetch('/api/credits');
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle auth error specifically
          setError('Authentication required');
        } else {
          console.error(`API error: ${response.status}`);
          throw new Error(`Failed to fetch credit balance: ${response.status}`);
        }
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log("Credits fetched successfully:", data);
      setCredits(data.credits_balance || 0);
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError('Could not load credit balance');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup realtime subscription
  const setupRealtimeSubscription = async () => {
    // Prevent multiple simultaneous setup attempts
    if (isSettingUpRef.current) {
      console.log("Setup already in progress, skipping");
      return;
    }
    
    isSettingUpRef.current = true;
    
    try {
      // Clean up any existing subscription first
      if (channelRef.current) {
        console.log("Cleaning up existing credit-updates subscription");
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      if (usageChannelRef.current) {
        console.log("Cleaning up existing credit-usage subscription");
        await supabase.removeChannel(usageChannelRef.current);
        usageChannelRef.current = null;
      }
      
      // Clear any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('No active session, cannot subscribe to realtime updates');
        isSettingUpRef.current = false;
        return;
      }
      
      const userId = session.user.id;
      console.log(`Setting up realtime subscription for user: ${userId}`);
      
      // Create a single channel with multiple subscriptions
      const channelId = `credits-channel-${Math.random().toString(36).substring(2, 7)}`;
      
      const channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_credits',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log("Received credits update:", payload);
            // Type check and safely access the credits_balance
            if (payload.new && 'credits_balance' in payload.new && 
                typeof payload.new.credits_balance === 'number') {
              setCredits(payload.new.credits_balance);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'credit_usage',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log("Received credit usage event:", payload);
            // When a new usage record is inserted, fetch the latest balance
            fetchCredits();
          }
        )
        .subscribe((status) => {
          console.log(`Credit channel subscription status: ${status}`);
          setSubscriptionStatus(status);
          
          if (status === 'SUBSCRIBED') {
            console.log("Successfully subscribed to realtime updates");
          }
          else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
            console.log(`Subscription failed with status: ${status}, will retry once...`);
            
            // Only retry once with exponential backoff
            const retryDelay = 5000;
            retryTimeoutRef.current = setTimeout(() => {
              console.log(`Retrying subscription after ${retryDelay}ms delay`);
              isSettingUpRef.current = false;
              setupRealtimeSubscription();
            }, retryDelay);
          }
        });
      
      channelRef.current = channel;
    } catch (err) {
      console.error('Error setting up subscription:', err);
    } finally {
      // Reset the setup flag after a delay to prevent immediate retries
      setTimeout(() => {
        isSettingUpRef.current = false;
      }, 1000);
    }
  };

  useEffect(() => {
    fetchCredits();
    setupRealtimeSubscription();
    
    // Listen for auth state changes to refresh subscriptions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth state changed: ${event}, session exists: ${!!session}`);
      
      if (session) {
        // User is authenticated - only setup if we don't have an active channel
        if (!channelRef.current) {
          console.log('User authenticated, setting up subscriptions and fetching credits');
          fetchCredits();
          setupRealtimeSubscription();
        }
      } else {
        // User is not authenticated
        console.log('User not authenticated, clearing credits');
        setCredits(null);
        
        // Clean up subscriptions
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        
        if (usageChannelRef.current) {
          supabase.removeChannel(usageChannelRef.current);
          usageChannelRef.current = null;
        }
        
        // Clear any pending retries
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      }
    });
    
    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      if (usageChannelRef.current) {
        supabase.removeChannel(usageChannelRef.current);
        usageChannelRef.current = null;
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 text-sm font-medium ${compact ? 'text-xs' : ''}`}>
        <RefreshCw className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
        <span>{compact ? 'Loading...' : 'Loading credits...'}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-red-500 ${compact ? 'text-xs' : ''}`}>
        <CircleOff className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
        <span>{compact ? 'Error' : error}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-1" onClick={() => fetchCredits()}>
        <CreditCard className="h-4 w-4 text-purple-500" />
        <span className="font-medium text-sm">
          {credits !== null ? `${credits} credits` : 'No credits'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md shadow-sm">
      <div className="flex items-center space-x-2" onClick={() => fetchCredits()}>
        <CreditCard className="h-5 w-5 text-purple-500" />
        <span className="font-medium">
          {credits !== null ? (
            <>
              <span className="text-lg">{credits}</span> <span className="text-sm text-gray-600">credits</span>
            </>
          ) : (
            'No credits'
          )}
        </span>
      </div>
      
      {showBuyButton && (
        <Link 
          href="/pricing" 
          className="px-3 py-1 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
        >
          Buy Credits
        </Link>
      )}
    </div>
  );
} 