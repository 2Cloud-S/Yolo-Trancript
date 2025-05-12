'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getTranscript, updateTranscript, Transcript } from '@/lib/supabase';
import { getTranscription, updateTranscriptionUtterance } from '@/lib/assemblyai';
import SpeakerDiarization from '@/components/SpeakerDiarization';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import TranscriptionDisclaimer from '@/components/TranscriptionDisclaimer';
import TranscriptExportOptions from '@/components/TranscriptExportOptions';
import TranscriptDetails from '@/components/TranscriptDetails';
import EditableTranscript from '@/components/EditableTranscript';
import TimestampedTranscript from '@/components/TimestampedTranscript';
import Script from 'next/script';

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

  // Handle full transcript text updates
  const handleTranscriptTextUpdate = async (text: string): Promise<void> => {
    if (!transcript) return;
    
    try {
      // Update transcript in database
      const updatedTranscript = await updateTranscript(transcript.id, {
        transcription_text: text
      });
      
      // Update local state
      setTranscript(updatedTranscript);
    } catch (error) {
      console.error('Error updating transcript text:', error);
      throw error;
    }
  };

  // Handle individual utterance text updates
  const handleUtteranceUpdate = async (utteranceId: string, text: string): Promise<void> => {
    if (!transcript || !transcriptData) return;
    
    try {
      // First, update the utterance in AssemblyAI if possible
      if (transcript.transcript_id) {
        await updateTranscriptionUtterance(transcript.transcript_id, utteranceId, text);
      }
      
      // Then reload the transcript to get the updated data
      await loadTranscript(transcript.id, user.id);
    } catch (error) {
      console.error('Error updating utterance:', error);
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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{transcript.file_name}</h1>
              <div className="mt-1 flex items-center">
                <span className="mr-2 text-sm text-gray-500">
                  {new Date(transcript.created_at).toLocaleDateString()}
                </span>
                {transcript.status === 'completed' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Completed
                  </span>
                ) : transcript.status === 'processing' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Error
                  </span>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              {transcript.status === 'processing' && (
                <button
                  onClick={refreshTranscript}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
                >
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refresh Status
                </button>
              )}
              {transcript.status === 'completed' && (
                <TranscriptExportOptions transcript={transcript} transcriptData={transcriptData} />
              )}
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
              >
                <svg className="mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
            {transcript.status === 'processing' ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto mb-6"></div>
                <h3 className="text-xl font-medium text-gray-900">Processing your transcript</h3>
                <p className="mt-3 text-gray-500 max-w-md mx-auto">
                  This may take a few minutes depending on the file length.
                  The page will automatically update when processing is complete.
                </p>
                <button
                  onClick={refreshTranscript}
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
                >
                  Check Status
                </button>
              </div>
              </div>
            ) : transcript.status === 'error' ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
              <div className="text-center py-16">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-medium text-gray-900">Processing Error</h3>
                <p className="mt-3 text-gray-500 max-w-md mx-auto">
                  There was an error processing your transcript. Please try again or contact support if the issue persists.
                </p>
                <div className="mt-6 flex justify-center gap-4">
                  <button
                    onClick={refreshTranscript}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
                  >
                    Try Again
                  </button>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
              </div>
            ) : (
            <div className="space-y-6">
                {/* Add Script to optimize duration loading */}
                <Script id="duration-fix" strategy="afterInteractive">
                  {`
                    // Helper function to ensure duration is properly initialized
                    function ensureDurationValue() {
                      try {
                        document.querySelectorAll('[data-duration-placeholder]').forEach(el => {
                          // Find the actual duration value
                          const durationValue = el.getAttribute('data-duration-value');
                          if (durationValue && el.textContent === '--:--') {
                            // Format properly with padded zeros
                            const duration = Number(durationValue);
                            if (!isNaN(duration)) {
                              const minutes = Math.floor(duration / 60);
                              const seconds = Math.floor(duration % 60);
                              el.textContent = minutes.toString().padStart(2, '0') + ':' + 
                                               seconds.toString().padStart(2, '0');
                            }
                          }
                        });
                      } catch (error) {
                        // Silently handle errors to prevent console warnings
                        console.debug('Duration format script error:', error);
                      }
                    }

                    // Try to get duration from audio/video elements if available
                    function tryLoadMediaDuration() {
                      try {
                        const mediaEl = document.querySelector('audio[data-transcript-audio], video[data-transcript-audio]');
                        if (mediaEl) {
                          mediaEl.addEventListener('loadedmetadata', function() {
                            const duration = mediaEl.duration;
                            if (duration && !isNaN(duration)) {
                              document.querySelectorAll('[data-duration-placeholder]').forEach(el => {
                                // Only update if the current value is a placeholder
                                if (el.textContent === '--:--') {
                                  const minutes = Math.floor(duration / 60);
                                  const seconds = Math.floor(duration % 60);
                                  el.textContent = minutes.toString().padStart(2, '0') + ':' + 
                                                   seconds.toString().padStart(2, '0');
                                  
                                  // Also update the data attribute for other components
                                  el.setAttribute('data-duration-value', duration.toString());
                                }
                              });
                            }
                          });
                        }
                      } catch (error) {
                        console.debug('Media duration detection error:', error);
                      }
                    }
                    
                    // Run on load and after a short delay to catch race conditions
                    ensureDurationValue();
                    setTimeout(ensureDurationValue, 500);
                    
                    // Also try to get duration from media elements
                    tryLoadMediaDuration();
                    document.addEventListener('DOMContentLoaded', tryLoadMediaDuration);
                  `}
                </Script>
            
                {/* Transcript Details Component */}
                <TranscriptDetails transcript={transcript} transcriptData={transcriptData} />
              
                {/* Editable Transcript with TranscriptionDisclaimer */}
                <div className="space-y-4">
                  <TranscriptionDisclaimer />
                  
                  {/* Timestamped Transcript Component */}
                  {transcriptData && transcriptData.utterances && transcriptData.utterances.length > 0 && (
                    <TimestampedTranscript
                      transcriptText={transcript.transcription_text || ''}
                      utterances={transcriptData.utterances}
                      speakers={transcriptData.speakers || []}
                      duration={transcript.duration}
                    />
                  )}
                  
                  {/* Editable Transcript */}
                  <EditableTranscript
                    transcript={transcript}
                    onSave={handleTranscriptTextUpdate}
                  />
                </div>
                
                {/* Speaker Diarization Component (if available) */}
                {transcriptData && transcriptData.speakers && transcriptData.speakers.length > 0 && (
                  <SpeakerDiarization
                    transcriptId={transcript.transcript_id}
                    speakers={transcriptData.speakers}
                    utterances={transcriptData.utterances || []}
                    onSpeakerLabelChange={handleSpeakerLabelChange}
                    onUtteranceChange={handleUtteranceUpdate}
                  />
                )}
                
                {/* Sentiment Analysis (if available) */}
                {transcriptData && transcriptData.sentiment && transcriptData.sentiment.overall && (
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900 flex items-center">
                        <svg className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Sentiment Analysis
                      </h2>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center">
                        <div className="mr-4 flex-shrink-0">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                            transcriptData.sentiment.overall === 'positive' ? 'bg-green-100 text-green-700' :
                            transcriptData.sentiment.overall === 'negative' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {transcriptData.sentiment.overall === 'positive' ? (
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : transcriptData.sentiment.overall === 'negative' ? (
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Overall Sentiment</h3>
                          <p className={`text-lg font-semibold capitalize ${
                            transcriptData.sentiment.overall === 'positive' ? 'text-green-600' :
                            transcriptData.sentiment.overall === 'negative' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {transcriptData.sentiment.overall}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </main>
    </div>
  );
} 