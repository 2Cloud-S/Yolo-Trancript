'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getTranscript, updateTranscript, Transcript } from '@/lib/supabase';
import { getTranscription } from '@/lib/assemblyai';
import SpeakerDiarization from '@/components/SpeakerDiarization';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import TranscriptionDisclaimer from '@/components/TranscriptionDisclaimer';
import TranscriptExportOptions from '@/components/TranscriptExportOptions';
import TranscriptDetails from '@/components/TranscriptDetails';

export default function TranscriptView({ params }: { params: Promise<{ id: string }> }) {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const [transcriptData, setTranscriptData] = useState<any>(null);
  const router = useRouter();

  // First, resolve the params
  useEffect(() => {
    async function resolveParams() {
      try {
        const resolvedParams = await params;
        setTranscriptId(resolvedParams.id);
      } catch (error) {
        console.error('Error resolving params:', error);
        setError('Failed to load transcript ID');
        setLoading(false);
      }
    }
    
    resolveParams();
  }, [params]);

  // Then, use the resolved transcriptId to check user and load transcript
  useEffect(() => {
    if (!transcriptId) return;

    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }
        
        setUser(user);
        await loadTranscript(transcriptId as string, user.id);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/auth/login');
      }
    }

    checkUser();
  }, [transcriptId, router]);

  const loadTranscript = async (id: string, userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading transcript:', { id, userId });
      
      // Get transcript from database
      const transcriptData = await getTranscript(id);
      console.log('Retrieved transcript from Supabase:', transcriptData);
      
      // Verify ownership
      if (transcriptData.user_id !== userId) {
        console.log('Ownership verification failed:', { 
          transcriptUserId: transcriptData.user_id, 
          currentUserId: userId 
        });
        router.push('/dashboard');
        return;
      }
      
      setTranscript(transcriptData);
      
      // If transcript is processing or has no text, check status from AssemblyAI
      if (transcriptData.status === 'processing' || !transcriptData.transcription_text) {
        console.log('Checking AssemblyAI status for transcript:', transcriptData.transcript_id);
        const assemblyData = await getTranscription(transcriptData.transcript_id);
        console.log('AssemblyAI response:', assemblyData);
        setTranscriptData(assemblyData);
        
        // Update status if changed
        if (
          assemblyData.status !== transcriptData.status ||
          (assemblyData.status === 'completed' && assemblyData.text && !transcriptData.transcription_text)
        ) {
          console.log('Updating transcript with new data from AssemblyAI');
          const updates: Partial<Transcript> = {
            status: assemblyData.status
          };
          
          // Add text and duration if transcription is complete
          if (assemblyData.status === 'completed' && assemblyData.text) {
            updates.transcription_text = assemblyData.text;
            updates.duration = assemblyData.audio_duration || 0;
          }
          
          // Update transcript in database
          const updatedTranscript = await updateTranscript(id, updates);
          console.log('Updated transcript in Supabase:', updatedTranscript);
          setTranscript(updatedTranscript);
        }
      } else {
        // If transcript is already completed, get the enhanced data with speaker diarization
        const assemblyData = await getTranscription(transcriptData.transcript_id);
        setTranscriptData(assemblyData);
      }
    } catch (err: any) {
      console.error('Error in loadTranscript:', err);
      setError(err.message || 'Failed to load transcript');
    } finally {
      setLoading(false);
    }
  };

  const refreshTranscript = () => {
    if (user && transcript && transcriptId) {
      loadTranscript(transcriptId as string, user.id);
    }
  };

  // Handle speaker label changes
  const handleSpeakerLabelChange = async (speakerId: string, label: string): Promise<void> => {
    if (!transcript || !transcriptData) return;
    
    try {
      // Update the labels in the metadata
      const updatedMetadata = {
        ...transcript.metadata,
        speakerLabels: {
          ...(transcript.metadata?.speakerLabels || {}),
          [speakerId]: label
        }
      };
      
      // Update transcript in database
      await updateTranscript(transcript.id, {
        metadata: updatedMetadata
      });
      
      // Update local state
      setTranscript({
        ...transcript,
        metadata: updatedMetadata
      });
    } catch (error) {
      console.error('Error updating speaker label:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <LoadingSkeleton type="text" size="lg" />
          <LoadingSkeleton type="text" size="md" count={3} />
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="text" size="full" count={10} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
            <div className="mt-4">
              <Link href="/dashboard" className="text-red-700 underline">
                Return to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <p className="text-gray-500">Transcript not found.</p>
            <div className="mt-4">
              <Link href="/dashboard" className="text-indigo-600 underline">
                Return to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{transcript.file_name}</h1>
              <div className="mt-1 flex items-center">
                <span className="mr-2 text-sm text-gray-500">
                  {new Date(transcript.created_at).toLocaleDateString()}
                </span>
                {transcript.status === 'completed' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                ) : transcript.status === 'processing' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Processing
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Error
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              {transcript.status === 'processing' && (
                <button
                  onClick={refreshTranscript}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Refresh Status
                </button>
              )}
              {transcript.status === 'completed' && (
                <TranscriptExportOptions transcript={transcript} transcriptData={transcriptData} />
              )}
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            {transcript.status === 'processing' ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900">Processing your transcript</h3>
                <p className="mt-2 text-gray-500">This may take a few minutes depending on the file length.</p>
                <button
                  onClick={refreshTranscript}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Check Status
                </button>
              </div>
            ) : transcript.status === 'error' ? (
              <div className="text-center py-12">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">Processing Error</h3>
                <p className="mt-2 text-gray-500">There was an error processing your transcript. Please try again.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Transcript Details Component */}
                <TranscriptDetails transcript={transcript} transcriptData={transcriptData} />
                
                {/* Speaker Diarization Component (if available) */}
                {transcriptData && transcriptData.speakers && transcriptData.speakers.length > 0 && (
                  <SpeakerDiarization
                    transcriptId={transcript.transcript_id}
                    speakers={transcriptData.speakers}
                    utterances={transcriptData.utterances || []}
                    onSpeakerLabelChange={handleSpeakerLabelChange}
                  />
                )}
                
                {/* Regular Transcript Text (always shown) */}
                <div className="prose max-w-none">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Full Transcript</h2>
                  
                  {/* Transcription Disclaimer */}
                  <TranscriptionDisclaimer />
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {transcript.transcription_text ? (
                      <p className="whitespace-pre-wrap">{transcript.transcription_text}</p>
                    ) : (
                      <p className="text-gray-500">No transcript text available.</p>
                    )}
                  </div>
                </div>
                
                {/* Sentiment Analysis (if available) */}
                {transcriptData && transcriptData.sentiment && transcriptData.sentiment.overall && (
                  <div className="prose max-w-none">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Sentiment Analysis</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800">
                        Overall sentiment: <span className={`font-medium ${
                          transcriptData.sentiment.overall === 'positive' ? 'text-green-600' :
                          transcriptData.sentiment.overall === 'negative' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {transcriptData.sentiment.overall}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 