'use client';

import { useState, useEffect } from 'react';
import { Transcript } from '@/lib/supabase';
import { PencilIcon, CheckIcon, XMarkIcon as XIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';

interface EditableTranscriptProps {
  transcript: Transcript;
  onSave: (text: string) => Promise<void>;
}

export default function EditableTranscript({ transcript, onSave }: EditableTranscriptProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(transcript.transcription_text || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update text when transcript changes (e.g. when refreshed from API)
  useEffect(() => {
    setText(transcript.transcription_text || '');
  }, [transcript.transcription_text]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setText(transcript.transcription_text || '');
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!text.trim()) {
      setError('Transcript text cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(text);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving transcript:', err);
      setError('Failed to save transcript. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Format time value
  const formatTime = (seconds: number) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get transcript duration and total words
  const getTranscriptStats = () => {
    const wordCount = transcript.transcription_text?.trim().split(/\s+/).length || 0;
    const duration = transcript.metadata?.duration_seconds || transcript.duration || 0;
    
    return (
      <div className="flex items-center space-x-4 text-sm text-gray-500">
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
          <span>{formatTime(duration)}</span>
        </div>
        <div>·</div>
        <div>{wordCount} words</div>
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="space-y-4 bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="flex justify-between items-center bg-gray-50 p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <PencilIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Edit Transcript
            </h2>
            {getTranscriptStats()}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
            >
              <XIcon className="h-4 w-4 mr-1.5 text-gray-500" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-1.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="relative px-4 py-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
            placeholder="Enter transcript text..."
            spellCheck="true"
          />
          <div className="absolute bottom-6 right-8 px-2 py-1 bg-gray-100 text-xs text-gray-500 rounded-md opacity-80">
            {text.length} characters
          </div>
        </div>
        
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          <p className="italic">All changes will be saved to the database</p>
          <p className="italic">Use Ctrl+Z to undo changes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prose max-w-none bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
      <div className="flex justify-between items-center bg-gray-50 p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-medium text-gray-900 flex items-center m-0">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-500" />
            Full Transcript
          </h2>
          {getTranscriptStats()}
        </div>
        <button
          onClick={handleEdit}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
        >
          <PencilIcon className="mr-1.5 h-4 w-4 text-gray-500" />
          Edit Transcript
        </button>
      </div>
      <div className="p-6 bg-white">
        {transcript.transcription_text ? (
          <div className="whitespace-pre-wrap overflow-auto max-h-[500px] text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-md border border-gray-200 text-sm">
            {transcript.transcription_text}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-md border border-gray-200">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500 italic">No transcript text available.</p>
          </div>
        )}
      </div>
    </div>
  );
} 