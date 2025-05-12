'use client';

import { useState, useEffect, useRef } from 'react';
import { DocumentTextIcon, ClockIcon, AdjustmentsHorizontalIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { TranscriptUtterance, TranscriptSpeaker } from '@/types/transcription';

interface TimestampedTranscriptProps {
  transcriptText: string;
  utterances: TranscriptUtterance[];
  speakers: TranscriptSpeaker[];
  duration?: number;
  onExportJSON?: (data: any) => void;
  onExportText?: (data: string) => void;
}

type TimestampDisplay = 'inline' | 'header' | 'hover';

export default function TimestampedTranscript({
  transcriptText,
  utterances,
  speakers,
  duration,
  onExportJSON,
  onExportText
}: TimestampedTranscriptProps) {
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [timestampDisplay, setTimestampDisplay] = useState<TimestampDisplay>('header');
  const [showSettings, setShowSettings] = useState(false);
  const [showMilliseconds, setShowMilliseconds] = useState(false);
  
  // Format time value with appropriate precision
  const formatTime = (seconds: number) => {
    // Special case for missing or zero duration
    if (!seconds && seconds !== 0) return '--:--';
    if (seconds <= 0) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    if (showMilliseconds) {
      const ms = Math.floor((seconds % 1) * 1000);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get speaker label
  const getSpeakerLabel = (speakerId: string) => {
    const speaker = speakers.find(s => s.id === speakerId);
    return speaker?.label || `Speaker ${speakerId.replace('spk_', '')}`;
  };
  
  // Generate transcript stats
  const getTranscriptStats = () => {
    const wordCount = transcriptText?.trim().split(/\s+/).length || 0;
    
    return (
      <div className="flex items-center space-x-4 text-sm text-gray-500">
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
          <span 
            data-duration-placeholder 
            data-duration-value={duration || ''}
          >
            {formatTime(duration || 0)}
          </span>
        </div>
        <div>·</div>
        <div>{wordCount} words</div>
        <div>·</div>
        <div>{utterances.length} segments</div>
      </div>
    );
  };
  
  // Toggle timestamps visibility
  const toggleTimestamps = () => {
    setShowTimestamps(!showTimestamps);
  };
  
  // Toggle settings panel
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  // Change timestamp display style
  const changeTimestampDisplay = (display: TimestampDisplay) => {
    setTimestampDisplay(display);
  };
  
  // Create JSON data for export
  const createExportData = () => {
    // Create a formatted transcript with timestamps and speaker labels
    const formattedTranscript = utterances.map(utterance => ({
      speaker: getSpeakerLabel(utterance.speaker),
      speaker_id: utterance.speaker,
      start: utterance.start,
      start_formatted: formatTime(utterance.start),
      end: utterance.end,
      end_formatted: formatTime(utterance.end),
      text: utterance.text,
      // Include raw timestamp data for maximum precision
      raw_start_seconds: utterance.start,
      raw_end_seconds: utterance.end
    }));
    
    // Create a JSON object with transcript metadata
    const exportData = {
      total_duration: duration,
      total_duration_formatted: formatTime(duration || 0),
      total_segments: utterances.length,
      timestamp_precision: showMilliseconds ? "milliseconds" : "seconds",
      speakers: speakers.map(speaker => ({
        id: speaker.id,
        label: speaker.label || `Speaker ${speaker.id.replace('spk_', '')}`,
        utterances: speaker.utterances,
        word_count: speaker.wordCount
      })),
      transcript: formattedTranscript
    };
    
    return exportData;
  };
  
  // Create plain text content for export
  const createPlainTextContent = () => {
    // Create a text version with timestamps
    let textContent = '# Timestamped Transcript\n\n';
    textContent += `Total Duration: ${formatTime(duration || 0)}\n`;
    textContent += `Total Segments: ${utterances.length}\n\n`;
    
    // Add speakers list
    textContent += '## Speakers\n';
    speakers.forEach(speaker => {
      textContent += `- ${getSpeakerLabel(speaker.id)} (${speaker.utterances} utterances, ${speaker.wordCount} words)\n`;
    });
    
    textContent += '\n## Transcript\n\n';
    
    // Add each utterance with timestamp
    utterances.forEach(utterance => {
      textContent += `[${formatTime(utterance.start)} - ${formatTime(utterance.end)}] ${getSpeakerLabel(utterance.speaker)}: ${utterance.text}\n\n`;
    });
    
    return textContent;
  };
  
  // Expose download methods through useEffect
  useEffect(() => {
    // Make export functions available to parent via props
    if (onExportJSON) {
      onExportJSON(createExportData());
    }
    
    if (onExportText) {
      onExportText(createPlainTextContent());
    }
  }, [utterances, speakers, duration, showMilliseconds]);
  
  // If no transcript text available
  if (!transcriptText || utterances.length === 0) {
    return (
      <div className="prose max-w-none bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="flex justify-between items-center bg-gray-50 p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-medium text-gray-900 flex items-center m-0">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Timestamped Transcript
            </h2>
          </div>
        </div>
        <div className="p-6 bg-white">
          <div className="text-center py-12 bg-gray-50 rounded-md border border-gray-200">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500 italic">No transcript text available.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="prose max-w-none bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
      <div className="flex justify-between items-center bg-gray-50 p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-medium text-gray-900 flex items-center m-0 relative group">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-500" />
            Timestamped Transcript
            <span className="ml-1.5 text-xs text-gray-500 cursor-help group-hover:text-indigo-500">(?)</span>
            <div className="absolute left-0 -bottom-12 hidden group-hover:block bg-white text-xs py-1.5 px-2.5 rounded shadow-md text-gray-700 w-64 z-10 border border-gray-200">
              Timestamps are derived from AssemblyAI's API with precision up to milliseconds. Toggle precision in settings.
            </div>
          </h2>
          {getTranscriptStats()}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleTimestamps}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
          >
            <ClockIcon className="mr-1.5 h-4 w-4 text-gray-500" />
            {showTimestamps ? 'Hide Timestamps' : 'Show Timestamps'}
          </button>
          <button
            onClick={toggleSettings}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
          >
            <AdjustmentsHorizontalIcon className="mr-1.5 h-4 w-4 text-gray-500" />
            Display Settings
          </button>
        </div>
      </div>
      
      {showSettings && (
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Timestamp Display Options</h3>
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-indigo-600"
                  checked={timestampDisplay === 'header'}
                  onChange={() => changeTimestampDisplay('header')}
                />
                <span className="ml-2 text-sm text-gray-700">Header (Default)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-indigo-600"
                  checked={timestampDisplay === 'inline'}
                  onChange={() => changeTimestampDisplay('inline')}
                />
                <span className="ml-2 text-sm text-gray-700">Inline</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-indigo-600"
                  checked={timestampDisplay === 'hover'}
                  onChange={() => changeTimestampDisplay('hover')}
                />
                <span className="ml-2 text-sm text-gray-700">Hover</span>
              </label>
            </div>
            <div className="mt-2 flex items-center">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-indigo-600"
                  checked={showMilliseconds}
                  onChange={() => setShowMilliseconds(!showMilliseconds)}
                />
                <span className="ml-2 text-sm text-gray-700">Show millisecond precision</span>
              </label>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-6 bg-white">
        <div className="overflow-auto max-h-[500px]">
          {utterances.map((utterance, index) => (
            <div key={utterance.id || `utterance-${index}`} className="mb-4">
              {/* Header Timestamps */}
              {showTimestamps && timestampDisplay === 'header' && (
                <div className="flex items-center mb-1 text-sm text-gray-500">
                  <span className="font-medium text-indigo-600">{getSpeakerLabel(utterance.speaker)}</span>
                  <span className="mx-2">•</span>
                  <div className="flex items-center">
                    <ClockIcon className="h-3.5 w-3.5 mr-1" />
                    <span className="font-mono tabular-nums">{formatTime(utterance.start)}</span>
                    <span className="mx-1">-</span>
                    <span className="font-mono tabular-nums">{formatTime(utterance.end)}</span>
                  </div>
                </div>
              )}
              
              {/* For Hover Timestamps */}
              <div 
                className={`text-gray-800 leading-relaxed ${
                  showTimestamps && timestampDisplay === 'hover' ? 'relative group' : ''
                }`}
              >
                {/* Inline Timestamps */}
                {showTimestamps && timestampDisplay === 'inline' && (
                  <span className="inline-flex items-center mr-2 text-xs text-gray-500 font-mono tabular-nums">
                    [{formatTime(utterance.start)}] 
                  </span>
                )}
                
                <span className={`${getSpeakerLabel(utterance.speaker) && 
                  (timestampDisplay !== 'header' || !showTimestamps) ? 
                  'font-medium text-indigo-600 mr-2' : 'hidden'}`}>
                  {getSpeakerLabel(utterance.speaker)}:
                </span>
                
                <span>{utterance.text}</span>
                
                {/* Hover Timestamps Tooltip */}
                {showTimestamps && timestampDisplay === 'hover' && (
                  <div className="absolute left-0 -top-8 hidden group-hover:block bg-gray-800 text-white text-xs py-1.5 px-2.5 rounded shadow-lg whitespace-nowrap z-10">
                    <div className="flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1.5" />
                      <span className="font-mono tabular-nums">{formatTime(utterance.start)}</span>
                      <span className="mx-1">-</span>
                      <span className="font-mono tabular-nums">{formatTime(utterance.end)}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {index < utterances.length - 1 && (
                <hr className="my-3 border-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export helper functions that can be imported directly
export const downloadTimestampedJSON = (exportData: any) => {
  // Convert to JSON string
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  // Create download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'timestamped-transcript.json';
  
  // Append to body, click and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadTimestampedText = (textContent: string) => {
  // Create blob and download
  const blob = new Blob([textContent], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'timestamped-transcript.txt';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}; 