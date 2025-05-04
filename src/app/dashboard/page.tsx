'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import FileUpload from '@/components/FileUpload';
import TranscriptList from '@/components/TranscriptList';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { User } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';
import { initPaddle } from '@/lib/paddle/client';

// Import the PaddleDebugger component dynamically to ensure client-side only
const PaddleDebugger = dynamic(() => import('./components/PaddleDebugger'), { ssr: false });

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  // Initialize Paddle when dashboard loads
  useEffect(() => {
    const loadPaddle = async () => {
      try {
        console.log('Pre-initializing Paddle from Dashboard');
        await initPaddle();
      } catch (error) {
        console.error('Failed to pre-initialize Paddle:', error);
      }
    };
    
    loadPaddle();
  }, []);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
      setLoading(false);
    }
    
    getUser();
  }, [router]);
  
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Transcription Dashboard</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Add Paddle Debugger - Only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 mx-4 p-4 border border-amber-300 bg-amber-50 rounded-md">
            <h3 className="font-medium text-amber-800 mb-2">Development Tools</h3>
            <PaddleDebugger />
          </div>
        )}
        
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