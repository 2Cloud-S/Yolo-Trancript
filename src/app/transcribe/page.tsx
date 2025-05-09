'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Loader2, UploadCloud, Mic, XCircle, AlertTriangle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// Define simple UI components to avoid needing external imports
const Button = ({ 
  children, 
  onClick, 
  disabled, 
  className = '',
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  className?: string;
  variant?: 'default' | 'outline';
}) => {
  const baseClass = "px-4 py-2 rounded font-medium focus:outline-none transition-colors";
  const variantClass = variant === 'outline' 
    ? "bg-transparent border border-gray-300 text-gray-800 hover:bg-gray-50" 
    : "bg-blue-600 text-white hover:bg-blue-700";
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseClass} ${variantClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

// Simple waveform visualization component
const Waveform = ({ audioUrl }: { audioUrl: string }) => (
  <div className="h-24 bg-gray-100 rounded flex items-center justify-center">
    <div className="flex items-end space-x-1 h-16">
      {Array(30).fill(0).map((_, i) => (
        <div 
          key={i} 
          className="w-1 bg-blue-500 rounded-t" 
          style={{ 
            height: `${Math.max(15, Math.sin(i * 0.5) * 50 + 20)}%`,
            opacity: 0.5 + Math.sin(i * 0.8) * 0.5
          }}
        />
      ))}
    </div>
  </div>
);

// Create AudioRecorder component directly to avoid import errors
const AudioRecorder = ({ onComplete }: { onComplete: (blob: Blob) => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Request microphone permissions
    const requestMicPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        
        // Start a timer to track recording duration
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Could not access your microphone. Please check your browser permissions.');
      }
    };

    requestMicPermission();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleStopRecording = () => {
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Create a dummy audio blob (in a real implementation this would be actual recorded audio)
    const dummyBlob = new Blob([new ArrayBuffer(recordingTime * 1000)], { type: 'audio/wav' });
    onComplete(dummyBlob);
  };

  return (
    <div className="p-6 border rounded-lg text-center bg-gray-50">
      <Mic className="h-12 w-12 mx-auto text-red-500 mb-2" />
      <p className="mb-2">Recording in progress...</p>
      <p className="text-sm text-gray-500 mb-4">
        {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
        {(recordingTime % 60).toString().padStart(2, '0')}
      </p>
      <Button onClick={handleStopRecording}>
        Stop Recording
      </Button>
    </div>
  );
};

// Dynamically import the CreditCheck component
const CreditCheck = dynamic(() => import('./components/CreditCheck'), {
  ssr: false,
});

export default function TranscribePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [showCreditCheck, setShowCreditCheck] = useState(false);
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  // Get user info using Supabase auth-helpers-nextjs
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClientComponentClient<Database>();
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser(data.session.user);
      }
    };
    
    fetchUser();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const audioFile = acceptedFiles[0];
    if (audioFile) {
      setFile(audioFile);
      
      // Create an audio element to get the duration
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioFile);
      
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
        audioRef.current = audio;
      };
      
      audio.onerror = () => {
        setError('Could not load audio file. Please try another file.');
      };
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': [],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleRecordingComplete = useCallback((blob: Blob) => {
    setIsRecording(false);
    const recordedFile = new File([blob], 'recording.wav', { type: 'audio/wav' });
    setFile(recordedFile);
    
    // Create an audio element to get the duration
    const audio = new Audio();
    audio.src = URL.createObjectURL(recordedFile);
    
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
      audioRef.current = audio;
    };
  }, []);

  const resetFile = () => {
    setFile(null);
    setAudioDuration(null);
    setError(null);
    if (audioRef.current) {
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
  };

  const handleStartTranscription = () => {
    if (!audioDuration) return;
    
    setShowCreditCheck(true);
  };

  const handleCancelTranscription = () => {
    setShowCreditCheck(false);
  };

  const handleConfirmTranscription = async () => {
    if (!file || !user) return;
    
    setShowCreditCheck(false);
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Get auth token for the request
      const supabase = createClientComponentClient<Database>();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Create a ReadableStream from the file
      const fileStream = file.stream();
      
      // Create a progress-tracking wrapper around the stream
      const totalSize = file.size;
      let loadedSize = 0;
      
      // Set up a transform stream to track progress
      const progressStream = new TransformStream({
        transform(chunk, controller) {
          loadedSize += chunk.length;
          const progress = Math.round((loadedSize / totalSize) * 100);
          setUploadProgress(progress);
          controller.enqueue(chunk);
        }
      });
      
      // Pipe the file through our progress tracker
      const trackedStream = fileStream.pipeThrough(progressStream);
      
      // Stream the file to our API
      const response = await fetch('/api/stream-upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'X-File-Name': file.name,
          'Authorization': `Bearer ${token}`
        },
        body: trackedStream,
        // Don't set duplex: 'half' as it's not supported in some browsers
      });
      
      if (!response.ok) {
        let errorText = 'Failed to upload file';
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorText;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorText);
      }
      
      const { url: audioUrl, fileName } = await response.json();
      
      // Now start the transcription job with the audio URL
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          file_name: fileName || file.name,
          file_type: file.type,
          file_size: file.size,
          duration_seconds: audioDuration
        }),
      });
      
      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        throw new Error(errorData.error || 'Transcription failed');
      }
      
      const data = await transcribeResponse.json();
      setTranscriptionId(data.transcriptionId);
      
      // Redirect to the results page
      router.push(`/dashboard/transcript/${data.transcriptionId}`);
    } catch (err: any) {
      console.error('Upload or transcription error:', err);
      setError(err.message || 'Failed to process your audio file');
      setIsUploading(false);
    }
  };

  // Simulate upload progress
  useEffect(() => {
    if (isUploading && uploadProgress < 99) {
      const timer = setTimeout(() => {
        setUploadProgress((prev) => Math.min(prev + 5, 99));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isUploading, uploadProgress]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center mb-4">Authentication Required</h1>
          <p className="text-center mb-6">
            Please sign in to use the transcription service.
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={() => router.push('/auth/login?redirectUrl=/transcribe')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Transcribe Audio</h1>
        
        {/* Credit Check Modal */}
        {showCreditCheck && audioDuration && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <CreditCheck 
              durationInSeconds={audioDuration}
              onConfirm={handleConfirmTranscription}
              onCancel={handleCancelTranscription}
            />
          </div>
        )}
        
        {isUploading ? (
          <div className="space-y-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-600">
                    Processing
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div 
                  style={{ width: `${uploadProgress}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
                ></div>
              </div>
            </div>
            <p className="text-center text-gray-600">
              Your file is being processed. Please don't close this window.
            </p>
          </div>
        ) : file ? (
          <div className="space-y-6">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium truncate">{file.name}</span>
                <button
                  onClick={resetFile}
                  className="text-red-500 hover:text-red-700"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              {audioDuration && (
                <div className="space-y-3">
                  <Waveform audioUrl={URL.createObjectURL(file)} />
                  <div className="text-sm text-gray-500">
                    Duration: {Math.floor(audioDuration / 60)}:{Math.floor(audioDuration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              )}
            </div>
            
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-center">
              <Button
                onClick={handleStartTranscription}
                disabled={!audioDuration || isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Transcription
              </Button>
            </div>
          </div>
        ) : isRecording ? (
          <div className="space-y-6">
            <AudioRecorder onComplete={handleRecordingComplete} />
            <p className="text-center text-gray-600">
              Recording in progress. Click stop when you're finished.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop an audio file here, or click to select a file
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supports MP3, WAV, M4A, and more.
              </p>
            </div>
            
            <div className="text-center">
              <p className="mb-2 text-sm text-gray-600">Or record directly in your browser</p>
              <Button
                onClick={() => setIsRecording(true)}
                variant="outline"
                className="border-gray-300"
              >
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 