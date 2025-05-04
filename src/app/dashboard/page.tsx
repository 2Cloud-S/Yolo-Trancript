'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import FileUpload from '@/components/FileUpload';
import TranscriptList from '@/components/TranscriptList';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { User } from '@supabase/supabase-js';
import { initPaddle, openCheckout, getPendingPurchase, clearPendingPurchase } from '@/lib/paddle/client';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  // Initialize Paddle and check for pending purchases when dashboard loads
  useEffect(() => {
    const loadPaddleAndCheckPurchase = async () => {
      try {
        console.log('Dashboard: Pre-initializing Paddle...');
        await initPaddle();
        console.log('Dashboard: Paddle pre-initialization complete');
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Check for pending purchase using the utility function
        const pendingPurchase = getPendingPurchase();
        if (pendingPurchase) {
          console.log(`Dashboard: Found pending purchase for ${pendingPurchase.packageName}`);
          
          // Add a slight delay to ensure the dashboard is fully loaded
          setTimeout(async () => {
            try {
              console.log(`Dashboard: Resuming purchase for ${pendingPurchase.packageName}`);
              const result = await openCheckout(pendingPurchase.priceId, user.email || '');
              
              if (result) {
                console.log('Dashboard: Checkout opened successfully');
                
                // Add event listener for successful purchase
                const handlePurchaseSuccess = (event: any) => {
                  console.log('Dashboard: Purchase completed successfully!');
                  clearPendingPurchase();
                  window.removeEventListener('paddle:purchase:success', handlePurchaseSuccess);
                };
                
                window.addEventListener('paddle:purchase:success', handlePurchaseSuccess);
              } else {
                console.error('Dashboard: Failed to open checkout');
              }
            } catch (error) {
              console.error('Dashboard: Error opening checkout:', error);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to initialize Paddle:', error);
      }
    };
    
    loadPaddleAndCheckPurchase();
  }, []);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }
      
      setUser(user);
      setLoading(false);
    }
    
    getUser();
  }, [router, supabase]);
  
  const handleUploadComplete = () => {
    // Trigger a refresh of the transcript list
    setRefreshTrigger(prev => prev + 1);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Transcription Dashboard</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Upload a new file</h2>
            <FileUpload userId={user?.id} onUploadComplete={handleUploadComplete} />
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your transcripts</h2>
            {user && (
              <TranscriptList userId={user.id} refreshTrigger={refreshTrigger} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 