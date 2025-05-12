'use client';

import { useState, useEffect } from 'react';
import { Clock, AlignLeft, Book, Users, BarChart, CheckCircle, AlertCircle, File } from 'lucide-react';
import { CustomVocabulary } from '@/types/transcription';
import { getCustomVocabularyById } from '@/lib/supabase';

// Using a more generic type to handle both Transcript types
interface TranscriptDetailsProps {
  transcript: {
    id: string;
    file_name: string;
    duration?: number;
    metadata?: any;
    status: string;
  };
  transcriptData?: any;
}

export default function TranscriptDetails({ transcript, transcriptData }: TranscriptDetailsProps) {
  const [customVocabulary, setCustomVocabulary] = useState<CustomVocabulary | null>(null);
  const [loading, setLoading] = useState(false);

  // Format duration from seconds to minutes:seconds
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Load custom vocabulary details if used
  useEffect(() => {
    async function loadVocabulary() {
      const vocabId = transcript.metadata?.customVocabularyId;
      if (!vocabId) return;
      
      try {
        setLoading(true);
        const vocab = await getCustomVocabularyById(vocabId);
        setCustomVocabulary(vocab);
      } catch (error) {
        console.error('Error loading vocabulary:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadVocabulary();
  }, [transcript]);

  // Get status badge component based on transcript status
  const getStatusBadge = () => {
    const status = transcript.status.toLowerCase();
    
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </span>
      );
    } else if (status === 'processing' || status === 'queued') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1 animate-pulse" />
          {status === 'processing' ? 'Processing' : 'Queued'}
        </span>
      );
    } else if (status === 'error' || status === 'failed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Get file extension from filename
  const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()?.toUpperCase() || '' : '';
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <File className="h-5 w-5 mr-2 text-indigo-500" />
            Transcript Details
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Details about this audio transcription
          </p>
        </div>
        {getStatusBadge()}
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File details */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">File Information</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <div className="flex-shrink-0 h-8 w-8 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center mr-3">
                  <AlignLeft className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">File Name</div>
                  <div className="text-gray-500 flex items-center">
                    {transcript.file_name}
                    {getFileExtension(transcript.file_name) && (
                      <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {getFileExtension(transcript.file_name)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <div className="flex-shrink-0 h-8 w-8 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center mr-3">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Duration</div>
                  <div 
                    className="text-gray-500" 
                    data-duration-placeholder 
                    data-duration-value={transcript.duration || ''}
                  >
                    {formatDuration(transcript.duration)}
                  </div>
                </div>
              </div>
              
              {transcriptData?.speakers && (
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex-shrink-0 h-8 w-8 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center mr-3">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Speakers</div>
                    <div className="text-gray-500">{transcriptData.speakers.length} detected</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Processing options */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Processing Options</h3>
            <div className="space-y-3">
              {/* Sentiment Analysis */}
              <div className="flex items-center text-sm text-gray-600">
                <div className="flex-shrink-0 h-8 w-8 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center mr-3">
                  <BarChart className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Sentiment Analysis</div>
                  <div>
                    {transcript.metadata?.enableSentiment ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Enabled
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Disabled
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Custom Vocabulary */}
              <div className="flex items-start text-sm text-gray-600">
                <div className="flex-shrink-0 h-8 w-8 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center mr-3">
                  <Book className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Custom Vocabulary</div>
                  {loading ? (
                    <div className="text-gray-500 flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </div>
                  ) : customVocabulary ? (
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {customVocabulary.name}
                      </span>
                      {customVocabulary.terms.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500 bg-white p-2 rounded border border-gray-200 max-h-16 overflow-y-auto">
                          {customVocabulary.terms.map((term, i) => (
                            <span key={`term-${i}-${term.substring(0, 10)}`} className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded mr-1 mb-1">
                              {term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      None
                    </span>
                  )}
                </div>
              </div>
              
              {/* Diarization Options */}
              {transcript.metadata?.diarization_options && (
                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex-shrink-0 h-8 w-8 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center mr-3">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Speaker Detection</div>
                    <div className="text-gray-500">
                      {transcript.metadata.diarization_options.speakers_expected} expected speakers
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 