'use client';

import { useState, useEffect } from 'react';
import { Clock, AlignLeft, Book, Users, BarChart } from 'lucide-react';
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
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Transcript Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* File details */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <AlignLeft className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium mr-2">File:</span>
            <span>{transcript.file_name}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span className="font-medium mr-2">Duration:</span>
            <span>{formatDuration(transcript.duration)}</span>
          </div>
          
          {transcriptData?.speakers && (
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2 text-gray-400" />
              <span className="font-medium mr-2">Speakers:</span>
              <span>{transcriptData.speakers.length}</span>
            </div>
          )}
        </div>
        
        {/* Processing options */}
        <div className="space-y-2">
          {/* Sentiment Analysis */}
          {transcript.metadata?.enableSentiment && (
            <div className="flex items-center text-sm text-gray-600">
              <BarChart className="h-4 w-4 mr-2 text-gray-400" />
              <span className="font-medium mr-2">Sentiment Analysis:</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Enabled
              </span>
            </div>
          )}
          
          {/* Custom Vocabulary */}
          <div className="flex items-start text-sm text-gray-600">
            <Book className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
            <div>
              <span className="font-medium mr-2">Custom Vocabulary:</span>
              {loading ? (
                <span className="text-gray-500">Loading...</span>
              ) : customVocabulary ? (
                <div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {customVocabulary.name}
                  </span>
                  <div className="mt-1 text-xs text-gray-500">
                    {customVocabulary.terms.slice(0, 5).join(', ')}
                    {customVocabulary.terms.length > 5 && ` +${customVocabulary.terms.length - 5} more`}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">None</span>
              )}
            </div>
          </div>
          
          {/* Diarization Options */}
          {transcript.metadata?.diarization_options && (
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2 text-gray-400" />
              <span className="font-medium mr-2">Speaker Detection:</span>
              <span>{transcript.metadata.diarization_options.speakers_expected} expected speakers</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 