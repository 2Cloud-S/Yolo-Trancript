'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, Users, Book, MessageSquare, ArrowRight, Link as LinkIcon, FileUp } from 'lucide-react';
import { transcribeFile, TranscriptionOptions, DiarizationOptions, checkTranscriptionStatus } from '@/lib/assemblyai';
import { saveTranscript, getCustomVocabularies, getDefaultVocabulary } from '@/lib/supabase';
import { supabase } from '@/lib/supabase/client';
import Dropdown from './ui/Dropdown';
import { CustomVocabulary } from '@/types/transcription';
import CustomVocabularyManager from './CustomVocabularyManager';
import Link from 'next/link';
import { uploadFileDirectly } from '@/lib/assemblyai-direct';
import { trackUpload, trackTranscriptionStart } from '@/lib/analytics';

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
  
  // URL transcription state
  const [urlMode, setUrlMode] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  
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
  
  // Toggle between URL and file upload modes
  const toggleMode = (mode: boolean) => {
    setUrlMode(mode);
    setError(null);
    setUrlError(null);
    setFile(null);
    setMediaUrl('');
  };

  // URL validation function
  const validateUrl = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      
      // Check for http or https protocol
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        setUrlError('URL must use HTTP or HTTPS protocol');
        return false;
      }
      
      // Check file extension for common audio/video formats
      const validExtensions = ['.mp3', '.wav', '.mp4', '.m4a', '.avi', '.flac', '.ogg', '.webm'];
      const hasValidExtension = validExtensions.some(ext => 
        parsedUrl.pathname.toLowerCase().endsWith(ext)
      );
      
      if (!hasValidExtension) {
        setUrlError('URL must point to a supported audio/video file');
        return false;
      }
      
      setUrlError(null);
      return true;
    } catch (e) {
      setUrlError('Invalid URL format');
      return false;
    }
  };
  
  // Handle direct URL transcription
  const handleUrlTranscription = async () => {
    if (!mediaUrl || !userId) {
      setUrlError("Please enter a valid media URL");
      return;
    }
    
    if (!validateUrl(mediaUrl)) {
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      startProgressSimulation();
      
      // Authentication checks (same as file upload)
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData.session) {
            setUrlError('Your session has expired. Please refresh the page or log in again.');
            stopProgressSimulation();
            setUploading(false);
            return;
          }
        }
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error(userError?.message || 'User not authenticated');
        }
      } catch (authError) {
        console.error('Authentication verification error:', authError);
        setUrlError('Authentication error. Please log out and log in again.');
        stopProgressSimulation();
        setUploading(false);
        return;
      }
      
      // Prepare options for transcription
      const options: TranscriptionOptions = {
        diarization: diarizationOptions,
        enableSentiment: enableSentiment
      };
      
      if (selectedVocabulary) {
        options.customVocabulary = selectedVocabulary.terms;
      }
      
      // Send request to process URL
      const response = await fetch('/api/transcribe-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: mediaUrl,
          user_id: userId,
          diarization_options: options?.diarization,
          custom_vocabulary: options?.customVocabulary || [],
          sentiment_analysis: options?.enableSentiment || true
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errorMessage = `Transcription failed: Status ${response.status}`;
        
        try {
          const errorData = await response.json();
          
          if (response.status === 401) {
            throw new Error('Authentication required: Your session has expired. Please log in again.');
          }
          
          if (response.status === 403) {
            throw new Error('Insufficient credits. Please purchase more credits to continue.');
          }
          
          errorMessage = `Transcription failed: ${errorData.error || 'Unknown error'}`;
        } catch (jsonError) {
          console.error('Failed to parse error response:', jsonError);
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // When transcription is initiated successfully
      if (result && result.transcriptionId) {
        // Set up status checks
        setTimeout(() => checkAndUpdateStatus(result.transcriptionId), 20000);
        setTimeout(() => checkAndUpdateStatus(result.transcriptionId), 60000);
        setTimeout(() => checkAndUpdateStatus(result.transcriptionId), 180000);
      }
      
      // Reset form
      setMediaUrl('');
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete();
      }
      
    } catch (err: any) {
      console.error('Error processing URL:', err);
      setUrlError(err instanceof Error ? err.message : 'An error occurred during URL processing');
    } finally {
      setUploading(false);
      stopProgressSimulation();
      setUploadProgress(0);
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
    // Automatically open advanced options when a file is selected
    setShowOptions(true);
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
      
      // Track file upload
      trackUpload(file.type, file.size);
      
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

      // When transcription starts
      if (response && response.transcriptId) {
        // Track transcription start
        trackTranscriptionStart(duration || 0);
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

  // Add render method for URL input
  const renderUrlInput = () => {
  return (
      <div className="bg-white rounded-lg border p-4 mb-4">
        <h3 className="font-medium mb-2">Transcribe from URL</h3>
        <p className="text-sm text-gray-500 mb-4">
          Enter the direct URL to an audio or video file (.mp3, .wav, .mp4, etc.)
        </p>
        
        {urlError && (
          <div className="text-red-500 mb-4 flex items-center text-sm">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{urlError}</span>
          </div>
        )}
        
        <div className="mb-4">
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://example.com/audio-file.mp3"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={uploading}
          />
        </div>
        
        {/* URL Submit button */}
            <button
          onClick={handleUrlTranscription}
          disabled={uploading || !mediaUrl}
          className={`w-full py-2 px-4 rounded font-medium ${
            uploading || !mediaUrl
              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {uploading ? (
            <>
              <span className="mr-2">Processing URL...</span>
              <span>{uploadProgress.toFixed(0)}%</span>
            </>
          ) : (
            'Start Transcription'
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Upload Mode Toggle */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-md shadow-sm bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => toggleMode(false)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              !urlMode 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileUp className="inline-block mr-1 h-4 w-4" />
            File Upload
          </button>
          <button
            type="button"
            onClick={() => toggleMode(true)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              urlMode 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LinkIcon className="inline-block mr-1 h-4 w-4" />
            URL
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="text-red-500 mb-4 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Main content based on selected mode */}
      {urlMode ? (
        renderUrlInput()
      ) : (
        <>
          {/* File Upload Dropzone (existing code) */}
      <div
        {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <input {...getInputProps()} />
            
            {file ? (
              <div className="py-4">
                <Upload className="mx-auto h-12 w-12 text-blue-500 mb-2" />
                <p className="text-sm text-gray-600 mb-1">Selected file:</p>
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
          </div>
        ) : (
              <div className="py-4">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-1">
                  Drag & drop your audio file
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse (mp3, wav, m4a, mp4)
                </p>
              </div>
            )}
          </div>
          
          {/* File upload buttons */}
          {file && (
            <div className="flex space-x-4 mt-4">
              <button
                type="button"
                onClick={() => setFile(null)}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className={`flex-1 py-2 px-4 rounded font-medium ${
                  uploading
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {uploading ? (
                  <>
                    <span className="mr-2">Uploading...</span>
                    <span>{uploadProgress.toFixed(0)}%</span>
                  </>
                ) : (
                  'Start Transcription'
                )}
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Progress bar (show for both modes) */}
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {uploadProgress < 100 ? 'Processing...' : 'Completing transcription...'}
          </p>
        </div>
      )}

      {/* Show/Hide advanced options button - shown for both modes */}
      <div className="mt-4 mb-2">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
          {showOptions ? 'Hide' : 'Show'} advanced options
          <ArrowRight className={`h-3 w-3 ml-1 transition-transform ${showOptions ? 'rotate-90' : ''}`} />
          </button>
        </div>

      {/* Advanced options panel - shared between both modes */}
      {showOptions && (
        <div className="border rounded p-4 mb-4 bg-gray-50">
          {/* Speaker detection settings */}
          <div className="mb-4">
            <h4 className="font-medium mb-2 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Speaker Detection
            </h4>
            <label className="block text-sm text-gray-500 mb-1">Number of speakers:</label>
                <Dropdown
              label="Number of speakers"
              options={[
                { value: '2', label: '2 speakers (default)' },
                { value: '3', label: '3 speakers' },
                { value: '4', label: '4 speakers' },
                { value: '5', label: '5 speakers' },
                { value: '6', label: '6+ speakers' }
              ]}
              value={diarizationOptions.speakers_expected?.toString() || '2'}
                  onChange={handleSpeakerCountChange}
            />
          </div>
          
          {/* Custom vocabulary section */}
          <div className="mb-4">
            <h4 className="font-medium mb-2 flex items-center">
              <Book className="h-4 w-4 mr-1" />
              Custom Vocabulary
            </h4>
            {vocabularies.length > 0 ? (
              <>
                <label className="block text-sm text-gray-500 mb-1">Select vocabulary:</label>
                <Dropdown
                  label="Select vocabulary"
                  options={[
                    { value: '', label: 'None (use default)' },
                    ...vocabularies.map(vocab => ({
                      value: vocab.id,
                      label: vocab.name
                    }))
                  ]}
                  value={selectedVocabulary?.id || ''}
                  onChange={(value) => {
                    const selected = vocabularies.find(v => v.id === value);
                    setSelectedVocabulary(selected || null);
                  }}
                />
                <div className="mt-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setShowVocabularyManager(true)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Manage vocabularies
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                No custom vocabularies available.{' '}
                <button
                  type="button"
                  onClick={() => setShowVocabularyManager(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Create one
                </button>
              </p>
            )}
              </div>
              
          {/* Sentiment analysis toggle */}
          <div>
            <h4 className="font-medium mb-2 flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              Sentiment Analysis
            </h4>
            <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={enableSentiment}
                  onChange={(e) => setEnableSentiment(e.target.checked)}
                className="mr-2"
                />
              <span className="text-sm text-gray-700">Enable sentiment analysis</span>
                </label>
          </div>
          </div>
        )}

      {showVocabularyManager && userId && (
            <CustomVocabularyManager
              userId={userId}
              onClose={() => {
                setShowVocabularyManager(false);
            loadVocabularies();
          }}
        />
      )}
      
      {/* Help link at the bottom */}
      <div className="text-center mt-4 text-sm text-gray-500">
        <Link href="/faq#transcription" className="text-blue-600 hover:text-blue-800">
          Learn more about transcription options
        </Link>
        </div>
    </div>
  );
} 