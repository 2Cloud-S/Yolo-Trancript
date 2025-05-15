'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import FileUpload from '@/components/FileUpload';
import TranscriptList from '@/components/TranscriptList';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { User } from '@supabase/supabase-js';
import { initPaddle } from '@/lib/paddle/client';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  // Initialize Paddle when dashboard loads
  useEffect(() => {
    const loadPaddle = async () => {
      try {
        console.log('Dashboard: Pre-initializing Paddle...');
        await initPaddle();
        console.log('Dashboard: Paddle pre-initialization complete');
      } catch (error) {
        console.error('Failed to pre-initialize Paddle:', error);
      }
    };
    
    loadPaddle();
  }, []);

  useEffect(() => {
    async function getUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.error("Error fetching user:", error);
        router.push('/auth/login');
        return;
      }
      
      setUser(user);
      setLoading(false);
    }
    
    getUser();

    // Set up polling to refresh transcripts every minute
    const intervalId = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 60000); // 60 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle when a file is uploaded successfully
  const handleUploadComplete = () => {
    // Trigger an immediate refresh after upload
    setRefreshTrigger(prev => prev + 1);
    
    // Schedule a few more refreshes to catch status updates
    // First refresh after 10 seconds
    setTimeout(() => setRefreshTrigger(prev => prev + 1), 10000);
    
    // Second refresh after 30 seconds
    setTimeout(() => setRefreshTrigger(prev => prev + 1), 30000);
    
    // Third refresh after 60 seconds
    setTimeout(() => setRefreshTrigger(prev => prev + 1), 60000);
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
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add new transcription</h2>
            <p className="text-gray-600 mb-4">Upload an audio file or enter a URL to an audio/video file for transcription.</p>
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