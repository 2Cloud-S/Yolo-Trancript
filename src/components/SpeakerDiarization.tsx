'use client';

import { useState, useEffect } from 'react';
import { TranscriptSpeaker, TranscriptUtterance } from '@/types/transcription';
import TranscriptionDisclaimer from '@/components/TranscriptionDisclaimer';

interface SpeakerDiarizationProps {
  transcriptId: string;
  speakers: TranscriptSpeaker[];
  utterances: TranscriptUtterance[];
  onSpeakerLabelChange?: (speakerId: string, label: string) => Promise<void>;
}

export default function SpeakerDiarization({
  transcriptId,
  speakers = [],
  utterances = [],
  onSpeakerLabelChange
}: SpeakerDiarizationProps) {
  const [speakerLabels, setSpeakerLabels] = useState<Record<string, string>>({});
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const getSpeakerColor = (speakerId: string) => {
    // Generate consistent colors based on speaker ID
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-indigo-100 text-indigo-800',
      'bg-pink-100 text-pink-800',
      'bg-teal-100 text-teal-800'
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
      <div className="text-center p-4 bg-gray-50 rounded-md">
        <p className="text-gray-500">No speaker information available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Speakers</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {speakers.length} {speakers.length === 1 ? 'speaker' : 'speakers'} detected in the audio
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {speakers.map(speaker => (
            <li key={speaker.id} className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getSpeakerColor(speaker.id)}`}>
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
                          className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSpeakerId(null)}
                          className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">{speakerLabels[speaker.id]}</h4>
                        {onSpeakerLabelChange && (
                          <button
                            onClick={() => handleEditStart(speaker.id, speakerLabels[speaker.id])}
                            className="ml-2 text-indigo-600 hover:text-indigo-900"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
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

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Transcript with Speakers</h3>
          <TranscriptionDisclaimer compact={true} />
        </div>
        <ul className="divide-y divide-gray-200">
          {utterances.map(utterance => (
            <li key={utterance.id} className="px-4 py-4">
              <div className="flex space-x-3">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getSpeakerColor(utterance.speaker)}`}>
                  {speakerLabels[utterance.speaker]?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {speakerLabels[utterance.speaker]} <span className="font-normal text-gray-500">({formatTime(utterance.start)} - {formatTime(utterance.end)})</span>
                  </p>
                  <p className="text-sm text-gray-500">{utterance.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 