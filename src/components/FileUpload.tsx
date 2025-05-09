'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, Users, Book, MessageSquare, ArrowRight } from 'lucide-react';
import { transcribeFile, TranscriptionOptions, DiarizationOptions, checkTranscriptionStatus } from '@/lib/assemblyai';
import { saveTranscript, getCustomVocabularies, getDefaultVocabulary } from '@/lib/supabase';
import { supabase } from '@/lib/supabase/client';
import Dropdown from './ui/Dropdown';
import { CustomVocabulary } from '@/types/transcription';
import CustomVocabularyManager from './CustomVocabularyManager';
import Link from 'next/link';
import { uploadFileDirectly } from '@/lib/assemblyai-direct';

interface FileUploadProps {
  userId?: string;
  onUploadComplete?: () => void;
}

export default function FileUpload({ userId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const progressInterval = useRef<any>(null);
  
  const [diarizationOptions, setDiarizationOptions] = useState<DiarizationOptions>({
    speakers_expected: 2,
    summary_type: 'paragraph',
    summary_model: 'informative'
  });
  
  // Custom vocabulary state
  const [vocabularies, setVocabularies] = useState<CustomVocabulary[]>([]);
  const [selectedVocabulary, setSelectedVocabulary] = useState<CustomVocabulary | null>(null);
  const [showVocabularyManager, setShowVocabularyManager] = useState(false);
  const [enableSentiment, setEnableSentiment] = useState(true);
  
  // Load custom vocabularies when component mounts
  useEffect(() => {
    if (userId) {
      loadVocabularies();
    }
  }, [userId]);
  
  const loadVocabularies = async () => {
    if (!userId) return;
    
    try {
      // Fetch all vocabularies
      const vocabs = await getCustomVocabularies(userId);
      setVocabularies(vocabs);
      
      // Get default vocabulary if exists
      const defaultVocab = await getDefaultVocabulary(userId);
      if (defaultVocab) {
        setSelectedVocabulary(defaultVocab);
      }
    } catch (error) {
      console.error('Error loading vocabularies:', error);
      // Don't show error to user for this feature
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    console.log('File selected for upload:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100MB limit');
      return;
    }
    
    // Check file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'video/mp4', 'audio/x-m4a', 'audio/mp3'];
    const isValidType = allowedTypes.some(type => file.type.includes(type));
    if (!isValidType) {
      setError('File type not supported. Please upload MP3, WAV, MP4, or M4A files.');
      return;
    }
    
    setError(null);
    setFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac'],
      'video/*': ['.mp4', '.mov', '.avi'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleSpeakerCountChange = (value: string) => {
    setDiarizationOptions({
      ...diarizationOptions,
      speakers_expected: parseInt(value)
    });
  };

  const handleSummaryTypeChange = (value: string) => {
    setDiarizationOptions({
      ...diarizationOptions,
      summary_type: value as 'paragraph' | 'bullets' | 'gist'
    });
  };

  const handleSummaryModelChange = (value: string) => {
    setDiarizationOptions({
      ...diarizationOptions,
      summary_model: value as 'informative' | 'conversational'
    });
  };
  
  // Start progress simulation
  const startProgressSimulation = () => {
    // Reset progress
    setUploadProgress(0);
    
    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    // Set up new interval
    progressInterval.current = setInterval(() => {
      setUploadProgress(prev => {
        // Slow down as we get closer to 90%
        if (prev < 30) return prev + 3;
        if (prev < 60) return prev + 2;
        if (prev < 85) return prev + 0.5;
        if (prev < 90) return prev + 0.2;
        return prev;
      });
    }, 300);
  };
  
  // Stop progress simulation
  const stopProgressSimulation = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };
  
  // Handle the actual upload and transcription
  const handleUpload = async () => {
    if (!file || !userId) {
      setError("No file selected or user not authenticated");
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      startProgressSimulation();
      
      // Comprehensive session check
      try {
        // First verify if we have an active session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          console.error('Session check error:', sessionError);
          // Try to refresh the session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            setError('Your session has expired. Please refresh the page or log in again.');
            stopProgressSimulation();
            setUploading(false);
            return;
          }
        }
        
        // Finally verify with getUser which validates the token
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error(userError?.message || 'User not authenticated');
        }
      } catch (authError) {
        console.error('Authentication verification error:', authError);
        setError('Authentication error. Please log out and log in again.');
        stopProgressSimulation();
        setUploading(false);
        return;
      }
      
      // Check auth status and credits using the API
      const authResponse = await fetch('/api/auth/status');
      
      if (!authResponse.ok) {
        const authData = await authResponse.json();
        
        // Handle specific error codes
        if (authResponse.status === 401) {
          if (authData.code === 'session_expired') {
            setError('Your session has expired. Please log in again.');
          } else {
            setError(authData.error || 'Please log in to transcribe files.');
          }
          stopProgressSimulation();
          setUploading(false);
          return;
        }
        
        if (authResponse.status === 403) {
          setError('Insufficient credits. Please purchase more credits to continue.');
          stopProgressSimulation();
          setUploading(false);
          return;
        }
        
        throw new Error(authData.error || 'Authentication check failed');
      }
      
      const authData = await authResponse.json();
      if (!authData.hasCredits) {
        setError(`Insufficient credits. You have ${authData.credits} credits available. Please purchase more credits to continue.`);
        stopProgressSimulation();
        setUploading(false);
        return;
      }
      
      // Prepare transcription options
      const options: TranscriptionOptions = {
        diarization: {
          speakers_expected: diarizationOptions.speakers_expected,
          summary_type: diarizationOptions.summary_type,
          summary_model: diarizationOptions.summary_model
        },
        enableSentiment
      };
      
      // Add custom vocabulary if selected
      if (selectedVocabulary) {
        options.customVocabulary = selectedVocabulary.terms;
      }
      
      // NEW CODE: Get the AssemblyAI token securely
      const tokenResponse = await fetch('/api/assemblyai-token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get AssemblyAI token');
      }
      const { token: assemblyToken } = await tokenResponse.json();
      
      // NEW CODE: Upload directly to AssemblyAI from the client
      console.log('Uploading file directly to AssemblyAI...');
      const uploadUrl = await uploadFileDirectly(file, assemblyToken);
      console.log('Direct upload successful:', uploadUrl);
      
      // Get file duration (existing code)
      const audio = document.createElement('audio');
      audio.src = URL.createObjectURL(file);
      
      const getDuration = new Promise<number>((resolve) => {
        audio.onloadedmetadata = () => {
          const duration = Math.round(audio.duration);
          URL.revokeObjectURL(audio.src);
          resolve(duration);
        };
      });
      
      // Set a timeout in case metadata loading fails
      const durationTimeout = new Promise<number>((resolve) => {
        setTimeout(() => {
          // Estimate based on file size if metadata load fails
          const sizeMB = file.size / (1024 * 1024);
          const estimatedDuration = Math.round(sizeMB * 60); // Rough estimate: 1MB ≈ 1 minute
          resolve(estimatedDuration);
        }, 5000); // 5 seconds timeout
      });
      
      // Use the first result from either promise
      const duration = await Promise.race([getDuration, durationTimeout]);
      
      // Send transcription request as before
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          audio_url: uploadUrl,
          user_id: userId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          duration_seconds: duration,
          diarization_options: options?.diarization ? {
            speakers_expected: options.diarization.speakers_expected
          } : undefined,
          custom_vocabulary: options?.customVocabulary || [],
          sentiment_analysis: options?.enableSentiment || true
        }),
        credentials: 'include',
      });
      
      if (!transcribeResponse.ok) {
        let errorMessage = `Transcription failed: Status ${transcribeResponse.status}`;
        
        try {
          const errorData = await transcribeResponse.json();
          
          if (transcribeResponse.status === 401) {
            throw new Error('Authentication required: Your session has expired. Please log in again.');
          }
          
          if (transcribeResponse.status === 403) {
            throw new Error('Insufficient credits. Please purchase more credits to continue.');
          }
          
          errorMessage = `Transcription failed: ${errorData.error || 'Unknown error'}`;
        } catch (jsonError) {
          console.error('Failed to parse error response:', jsonError);
        }
        
        throw new Error(errorMessage);
      }
      
      const response = await transcribeResponse.json();
      
      // When upload is successful, schedule status checks
      if (response && response.transcriptId) {
        // Set a few status checks after upload completes
        setTimeout(() => checkAndUpdateStatus(response.transcriptId), 20000); // Check after 20 seconds
        setTimeout(() => checkAndUpdateStatus(response.transcriptId), 60000); // Check after 1 minute
        setTimeout(() => checkAndUpdateStatus(response.transcriptId), 180000); // Check after 3 minutes
      }
      
      // Reset the file input
      setFile(null);
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during upload');
    } finally {
      setUploading(false);
      stopProgressSimulation();
      setUploadProgress(0);
    }
  };

  // Function to check and update transcription status
  const checkAndUpdateStatus = async (transcriptId: string) => {
    try {
      const result = await checkTranscriptionStatus(transcriptId);
      
      if (result.isCompleted && onUploadComplete) {
        onUploadComplete(); // Trigger parent component refresh
      }
    } catch (error) {
      console.error('Error checking transcription status:', error);
    }
  };

  // Speaker count options
  const speakerOptions = [
    { value: 1, label: '1 speaker (monologue)' },
    { value: 2, label: '2 speakers (dialogue)' },
    { value: 3, label: '3 speakers (small group)' },
    { value: 4, label: '4 speakers (group discussion)' },
    { value: 5, label: '5 speakers (meeting)' },
    { value: 6, label: '6+ speakers (conference)' }
  ];

  // Summary type options
  const summaryTypeOptions = [
    { value: 'paragraph', label: 'Paragraph (detailed summary)' },
    { value: 'bullets', label: 'Bullet Points (key points)' },
    { value: 'gist', label: 'Gist (brief overview)' }
  ];

  // Summary model options
  const summaryModelOptions = [
    { value: 'informative', label: 'Informative (factual and objective)' },
    { value: 'conversational', label: 'Conversational (casual and engaging)' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Upload Media</h3>
          {file && !uploading && (
            <button
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Clear file</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
      <div
        {...getRootProps()}
          className={`flex justify-center rounded-lg border-2 border-dashed px-6 py-10 ${
            isDragActive
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400'
          } ${uploading ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="text-center">
            <input {...getInputProps()} />
            {uploading ? (
              <div>
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">Processing your file... {Math.round(uploadProgress)}%</p>
              </div>
            ) : file ? (
              <div>
                <div className="mx-auto h-12 w-12 text-indigo-600">
                  <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-900">{file.name}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
          </div>
        ) : (
          <div>
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
                </div>
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500">
                    <span>Upload a file</span>
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">MP3, WAV, M4A, FLAC, MP4, MOV, or AVI up to 100MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Transcription Options Toggle */}
        <div className="mt-4 flex items-center">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
          >
            <Users className="h-4 w-4 mr-1" />
            {showOptions ? 'Hide advanced options' : 'Show advanced options'}
          </button>
        </div>

        {/* Enhanced Options */}
        {file && showOptions && (
          <div className="mt-4 space-y-4">
            {/* Speaker Diarization Options */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Speaker Detection Options</h4>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Dropdown
                  label="Expected Speakers"
                  value={diarizationOptions.speakers_expected || 2}
                  onChange={handleSpeakerCountChange}
                  options={speakerOptions}
                  disabled={uploading}
                />
                
                <Dropdown
                  label="Summary Type"
                  value={diarizationOptions.summary_type || 'paragraph'}
                  onChange={handleSummaryTypeChange}
                  options={summaryTypeOptions}
                  disabled={uploading}
                />
                
                <Dropdown
                  label="Summary Style"
                  value={diarizationOptions.summary_model || 'informative'}
                  onChange={handleSummaryModelChange}
                  options={summaryModelOptions}
                  disabled={uploading}
                />
              </div>
            </div>
            
            {/* Custom Vocabulary Section */}
            {userId && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <Book className="h-4 w-4 mr-2" />
                    Custom Vocabulary
                  </h4>
                  <Link
                    href="/dashboard/custom-vocabulary"
                    className="text-xs text-indigo-600 hover:text-indigo-500"
                  >
                    Manage vocabularies
                  </Link>
                </div>
                
                <div className="text-sm text-gray-500 mb-3">
                  Add specialized terms to improve transcription accuracy for domain-specific content
                </div>
                
                {vocabularies.length === 0 ? (
                  <div className="bg-blue-50 p-3 rounded-md text-xs text-blue-700 mb-3">
                    <p className="font-medium">No custom vocabularies available</p>
                    <p className="mt-1">
                      Create custom vocabularies to help the transcription engine recognize specialized terms, 
                      industry jargon, or uncommon names for improved accuracy.
                    </p>
                    <Link href="/dashboard/custom-vocabulary" className="mt-2 inline-flex items-center text-blue-800 hover:text-blue-900 font-medium">
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Go to Vocabulary Manager
                    </Link>
                  </div>
                ) : (
                  <Dropdown
                    label="Select Vocabulary"
                    value={selectedVocabulary?.id || ''}
                    onChange={(value) => {
                      const vocab = vocabularies.find(v => v.id === value);
                      setSelectedVocabulary(vocab || null);
                    }}
                    options={[
                      { value: '', label: 'None (use standard vocabulary)' },
                      ...vocabularies.map(vocab => ({
                        value: vocab.id,
                        label: vocab.name + (vocab.is_default ? ' (Default)' : '')
                      }))
                    ]}
                    disabled={uploading}
                  />
                )}
                
                {selectedVocabulary && (
                  <div className="mt-2 bg-indigo-50 p-2 rounded text-xs text-indigo-700">
                    <p className="font-medium">Selected: {selectedVocabulary.name}</p>
                    <p className="mt-1">
                      {selectedVocabulary.terms.slice(0, 3).join(", ")}
                      {selectedVocabulary.terms.length > 3 ? `, +${selectedVocabulary.terms.length - 3} more terms` : ""}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Sentiment Analysis Toggle */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center mb-2">
                <MessageSquare className="h-4 w-4 mr-2 text-gray-700" />
                <h4 className="text-sm font-medium text-gray-900">Sentiment Analysis</h4>
              </div>
              
              <div className="flex items-center">
                <input
                  id="enable-sentiment"
                  type="checkbox"
                  checked={enableSentiment}
                  onChange={(e) => setEnableSentiment(e.target.checked)}
                  disabled={uploading}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="enable-sentiment" className="ml-2 block text-sm text-gray-700">
                  Enable sentiment analysis (detect emotional tone)
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Analyzes the emotional tone of the transcript (positive, negative, or neutral)
              </p>
            </div>
          </div>
        )}
        
        {/* Transcribe Button (only show when file is selected) */}
        {file && !uploading && (
          <div className="mt-4">
            <button
              onClick={handleUpload}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={uploading}
            >
              Transcribe File
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Custom Vocabulary Manager Modal */}
      {showVocabularyManager && userId && (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <CustomVocabularyManager
              userId={userId}
              selectedId={selectedVocabulary?.id}
              onSelect={(vocab) => {
                setSelectedVocabulary(vocab);
                setShowVocabularyManager(false);
              }}
              onClose={() => {
                setShowVocabularyManager(false);
                loadVocabularies(); // Refresh the list of vocabularies
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 