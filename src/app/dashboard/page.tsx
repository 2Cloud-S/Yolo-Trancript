'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FileUpload from '@/components/FileUpload';
import TranscriptList from '@/components/TranscriptList';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { User } from '@supabase/supabase-js';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Redirect to login if not authenticated
          router.push('/auth/login');
          return;
        }
        
        setUser(user);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, [router]);

  const handleUploadComplete = () => {
    // Refresh transcript list after upload
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center space-y-4">
        <LoadingSkeleton type="card" className="max-w-md w-full" />
        <LoadingSkeleton type="text" size="lg" count={3} className="max-w-md" />
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