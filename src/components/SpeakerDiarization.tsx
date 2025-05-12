'use client';

import { useState, useEffect } from 'react';
import { TranscriptSpeaker, TranscriptUtterance } from '@/types/transcription';
import TranscriptionDisclaimer from '@/components/TranscriptionDisclaimer';
import { PencilIcon, CheckIcon, XMarkIcon as XIcon, UserIcon, UsersIcon, ClockIcon } from '@heroicons/react/24/outline';

interface SpeakerDiarizationProps {
  transcriptId: string;
  speakers: TranscriptSpeaker[];
  utterances: TranscriptUtterance[];
  onSpeakerLabelChange?: (speakerId: string, label: string) => Promise<void>;
  onUtteranceChange?: (utteranceId: string, text: string) => Promise<void>;
}

export default function SpeakerDiarization({
  transcriptId,
  speakers = [],
  utterances = [],
  onSpeakerLabelChange,
  onUtteranceChange
}: SpeakerDiarizationProps) {
  const [speakerLabels, setSpeakerLabels] = useState<Record<string, string>>({});
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingUtteranceId, setEditingUtteranceId] = useState<string | null>(null);
  const [editingUtteranceText, setEditingUtteranceText] = useState('');

  // Initialize speaker labels
  useEffect(() => {
    const labels: Record<string, string> = {};
    speakers.forEach(speaker => {
      labels[speaker.id] = speaker.label || `Speaker ${speaker.id.replace('spk_', '')}`;
    });
    setSpeakerLabels(labels);
  }, [speakers]);

  const handleEditStart = (speakerId: string, currentLabel: string) => {
    setEditingSpeakerId(speakerId);
    setNewLabel(currentLabel);
  };

  const handleLabelSave = async (speakerId: string) => {
    if (!newLabel.trim() || !onSpeakerLabelChange) {
      setEditingSpeakerId(null);
      return;
    }

    setIsLoading(true);
    try {
      await onSpeakerLabelChange(speakerId, newLabel.trim());
      // Update local state after successful update
      setSpeakerLabels(prev => ({
        ...prev,
        [speakerId]: newLabel.trim()
      }));
    } catch (error) {
      console.error('Failed to update speaker label:', error);
    } finally {
      setIsLoading(false);
      setEditingSpeakerId(null);
    }
  };

  const handleUtteranceEditStart = (utterance: TranscriptUtterance) => {
    setEditingUtteranceId(utterance.id);
    setEditingUtteranceText(utterance.text);
  };

  const handleUtteranceEditCancel = () => {
    setEditingUtteranceId(null);
    setEditingUtteranceText('');
  };

  const handleUtteranceEditSave = async (utteranceId: string) => {
    if (!editingUtteranceText.trim() || !onUtteranceChange) {
      handleUtteranceEditCancel();
      return;
    }

    setIsLoading(true);
    try {
      await onUtteranceChange(utteranceId, editingUtteranceText.trim());
      // The parent component will refresh the data, so we don't need to update locally
    } catch (error) {
      console.error('Failed to update utterance text:', error);
    } finally {
      setIsLoading(false);
      setEditingUtteranceId(null);
    }
  };

  const getSpeakerColor = (speakerId: string) => {
    // Generate consistent colors based on speaker ID
    const colors = [
      'bg-blue-100 text-blue-800 ring-blue-200',
      'bg-green-100 text-green-800 ring-green-200',
      'bg-purple-100 text-purple-800 ring-purple-200',
      'bg-yellow-100 text-yellow-800 ring-yellow-200',
      'bg-red-100 text-red-800 ring-red-200',
      'bg-indigo-100 text-indigo-800 ring-indigo-200',
      'bg-pink-100 text-pink-800 ring-pink-200',
      'bg-teal-100 text-teal-800 ring-teal-200'
    ];
    
    // Use the last digit of the speaker ID to select a color
    const index = parseInt(speakerId.replace('spk_', '')) % colors.length;
    return colors[index];
  };

  // Format time in seconds to MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (speakers.length === 0) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-md border border-gray-200">
        <UsersIcon className="h-12 w-12 mx-auto text-gray-400" />
        <p className="mt-2 text-gray-500">No speaker information available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <UsersIcon className="h-5 w-5 mr-2 text-indigo-500" />
            Speakers
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {speakers.length} {speakers.length === 1 ? 'speaker' : 'speakers'} detected in the audio
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {speakers.map(speaker => (
            <li key={speaker.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getSpeakerColor(speaker.id)} ring-2`}>
                    {speakerLabels[speaker.id]?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="ml-4">
                    {editingSpeakerId === speaker.id ? (
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Enter speaker name"
                          autoFocus
                        />
                        <button
                          onClick={() => handleLabelSave(speaker.id)}
                          disabled={isLoading}
                          className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                          <CheckIcon className="h-3.5 w-3.5 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSpeakerId(null)}
                          className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                          <XIcon className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </button>
                      </div>
                    ) :
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">{speakerLabels[speaker.id]}</h4>
                        {onSpeakerLabelChange && (
                          <button
                            onClick={() => handleEditStart(speaker.id, speakerLabels[speaker.id])}
                            className="ml-2 text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="Edit speaker name"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    }
                    <div className="text-sm text-gray-500">
                      {speaker.utterances} utterances • {speaker.wordCount} words
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <UserIcon className="h-5 w-5 mr-2 text-indigo-500" />
            Transcript with Speakers
          </h3>
          <TranscriptionDisclaimer compact={true} />
        </div>
        <ul className="divide-y divide-gray-200">
          {utterances.map(utterance => (
            <li key={utterance.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex space-x-3">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getSpeakerColor(utterance.speaker)} ring-2`}>
                  {speakerLabels[utterance.speaker]?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 flex items-center">
                    <span>{speakerLabels[utterance.speaker]}</span> 
                    <span className="font-normal text-gray-500 flex items-center ml-2">
                      <ClockIcon className="h-3.5 w-3.5 mr-1" />
                      {formatTime(utterance.start)} - {formatTime(utterance.end)}
                    </span>
                  </p>
                  
                  {editingUtteranceId === utterance.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={editingUtteranceText}
                        onChange={(e) => setEditingUtteranceText(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        rows={4}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUtteranceEditSave(utterance.id)}
                          disabled={isLoading}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="h-3.5 w-3.5 mr-1" />
                              Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleUtteranceEditCancel}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                          <XIcon className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start mt-1">
                      <p className="text-sm text-gray-700 flex-grow whitespace-pre-wrap">{utterance.text}</p>
                      {onUtteranceChange && (
                        <button
                          onClick={() => handleUtteranceEditStart(utterance)}
                          className="ml-2 text-indigo-600 hover:text-indigo-900 flex-shrink-0 transition-colors"
                          title="Edit this utterance"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 