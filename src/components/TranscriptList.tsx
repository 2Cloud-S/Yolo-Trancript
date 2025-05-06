'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserTranscripts, Transcript } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import moment from 'moment';
import { FileText, ExternalLink, Clock, Check, AlertCircle } from 'lucide-react';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import TranscriptionDisclaimer from '@/components/TranscriptionDisclaimer';
import { AssemblyAI } from 'assemblyai';

interface TranscriptListProps {
  userId?: string;
  refreshTrigger?: number;
}

export default function TranscriptList({ userId, refreshTrigger = 0 }: TranscriptListProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollTimer, setPollTimer] = useState<NodeJS.Timeout | null>(null);

  // Fetch transcripts from the database
  const fetchTranscripts = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTranscripts(data || []);
      
      // Check if there are any processing transcripts
      const hasProcessingTranscripts = (data || []).some(t => t.status === 'processing');
      
      // If there are processing transcripts, set up polling 
      if (hasProcessingTranscripts) {
        startPolling();
      } else if (pollTimer) {
        // If no processing transcripts and pollTimer exists, clear it
        clearInterval(pollTimer);
        setPollTimer(null);
      }
    } catch (err) {
      console.error('Error fetching transcripts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transcripts');
    } finally {
      setLoading(false);
    }
  };

  // Start polling for status updates
  const startPolling = () => {
    // Clear existing timer if any
    if (pollTimer) {
      clearInterval(pollTimer);
    }
    
    // Set polling interval to 30 seconds
    const timer = setInterval(checkProcessingTranscripts, 30000);
    setPollTimer(timer);
  };

  // Check status of processing transcripts
  const checkProcessingTranscripts = async () => {
    const processingTranscripts = transcripts.filter(t => t.status === 'processing');
    
    if (processingTranscripts.length === 0) {
      // If no processing transcripts, clear the timer
      if (pollTimer) {
        clearInterval(pollTimer);
        setPollTimer(null);
      }
      return;
    }
    
    // Check status for each processing transcript
    let hasUpdates = false;
    
    for (const transcript of processingTranscripts) {
      try {
        // Fetch transcript status from API
        const response = await fetch(`/api/transcription/${transcript.transcript_id}`);
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // If status has changed to 'completed'
        if (data.status === 'completed' && transcript.status === 'processing') {
          hasUpdates = true;
          
          // Update status in database
          await supabase
            .from('transcriptions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              transcription_text: data.text || '',
            })
            .eq('id', transcript.id);
        }
      } catch (err) {
        console.error(`Error checking status for transcript ${transcript.id}:`, err);
      }
    }
    
    // If any transcripts were updated, refresh the list
    if (hasUpdates) {
      fetchTranscripts();
    }
  };

  useEffect(() => {
    fetchTranscripts();
    
    // Clean up the interval when component unmounts
    return () => {
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [userId, refreshTrigger]);

  if (!userId) {
        return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Create an account to view your transcripts</h3>
        <p className="mt-2 text-sm text-gray-500">
          Sign up to access your transcription history and manage your files.
        </p>
        <div className="mt-6">
          <Link
            href="/auth/register"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create Account
          </Link>
        </div>
      </div>
        );
    }

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <LoadingSkeleton type="table-row" count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (transcripts.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No transcripts yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Upload your first audio or video file to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <TranscriptionDisclaimer compact={true} />
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {transcripts.map((transcript) => (
            <li key={transcript.id}>
                <Link
                  href={`/dashboard/transcript/${transcript.id}`}
                className="block hover:bg-gray-50"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {transcript.file_name}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transcript.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : transcript.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {transcript.status}
                        </p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="text-sm text-gray-500">
                        {new Date(transcript.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 