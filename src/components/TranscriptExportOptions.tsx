'use client';

import { useState, useRef, useEffect } from 'react';
import { TranscriptSpeaker, TranscriptUtterance } from '@/types/transcription';
import { Transcript } from '@/lib/supabase';
import { downloadTimestampedJSON, downloadTimestampedText } from './TimestampedTranscript';
import { 
  ArrowDownTrayIcon, 
  ChevronDownIcon, 
  DocumentTextIcon, 
  DocumentIcon, 
  CodeBracketIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface TranscriptExportOptionsProps {
  transcript: Transcript;
  transcriptData?: {
    speakers?: TranscriptSpeaker[];
    utterances?: TranscriptUtterance[];
  };
}

export default function TranscriptExportOptions({ 
  transcript, 
  transcriptData 
}: TranscriptExportOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && 
        buttonRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    
    // Add the event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Format time in seconds to MM:SS format (simple)
  const formatTime = (seconds: number) => {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format time with millisecond precision for timestamped exports
  const formatTimeWithMs = (seconds: number) => {
    if (!seconds && seconds !== 0) return '--:--:---';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // Export as plain text
  const exportAsPlainText = () => {
    const text = transcript.transcription_text || '';
    downloadFile(text, `${transcript.file_name.replace(/\.[^/.]+$/, '')}_transcript.txt`, 'text/plain');
  };

  // Export as markdown
  const exportAsMarkdown = () => {
    let markdown = `# Transcript: ${transcript.file_name}\n\n`;
    markdown += `Date: ${new Date(transcript.created_at).toLocaleDateString()}\n\n`;
    
    if (transcript.transcription_text) {
      markdown += `## Full Transcript\n\n${transcript.transcription_text}\n\n`;
    }
    
    // Add speaker information if available
    if (transcriptData?.speakers && transcriptData.speakers.length > 0) {
      markdown += `## Speakers\n\n`;
      transcriptData.speakers.forEach(speaker => {
        markdown += `- ${speaker.label || `Speaker ${speaker.id.replace('spk_', '')}`}: ${speaker.utterances} utterances, ${speaker.wordCount} words\n`;
      });
      markdown += '\n';
    }
    
    downloadFile(markdown, `${transcript.file_name.replace(/\.[^/.]+$/, '')}_transcript.md`, 'text/markdown');
  };

  // Export as formatted document with timestamps and speakers
  const exportAsFormattedDocument = () => {
    if (!transcriptData?.utterances || transcriptData.utterances.length === 0) {
      // If no utterances data, fallback to plain text export
      exportAsPlainText();
      return;
    }

    const speakerLabels: Record<string, string> = {};
    if (transcriptData.speakers) {
      transcriptData.speakers.forEach(speaker => {
        speakerLabels[speaker.id] = speaker.label || `Speaker ${speaker.id.replace('spk_', '')}`;
      });
    }

    let content = `<!DOCTYPE html>
<html>
<head>
  <title>Transcript: ${transcript.file_name}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .meta { color: #666; margin-bottom: 20px; }
    .utterance { margin-bottom: 15px; }
    .speaker { font-weight: bold; }
    .timestamp { color: #777; font-size: 0.85em; }
    .text { margin-top: 5px; }
  </style>
</head>
<body>
  <h1>Transcript: ${transcript.file_name}</h1>
  <div class="meta">
    <p>Date: ${new Date(transcript.created_at).toLocaleDateString()}</p>
    <p>Duration: <span 
      data-duration-placeholder 
      data-duration-value="${transcript.duration || ''}"
    >${transcript.duration ? Math.floor(transcript.duration / 60) + ' minutes, ' + Math.floor(transcript.duration % 60) + ' seconds' : 'Unknown'}</span></p>
  </div>
  <div class="transcript">`;

    transcriptData.utterances.forEach(utterance => {
      const speakerName = speakerLabels[utterance.speaker] || `Speaker ${utterance.speaker.replace('spk_', '')}`;
      content += `
    <div class="utterance">
      <div class="speaker">${speakerName} <span class="timestamp">(${formatTime(utterance.start)} - ${formatTime(utterance.end)})</span></div>
      <div class="text">${utterance.text}</div>
    </div>`;
    });

    content += `
  </div>
</body>
</html>`;

    downloadFile(content, `${transcript.file_name.replace(/\.[^/.]+$/, '')}_transcript.html`, 'text/html');
  };
  
  // Timestamped exports
  const exportAsTimestampedJSON = () => {
    if (!transcriptData?.utterances || !transcriptData.speakers) {
      return;
    }
    
    // Create formatted transcript with timestamps and speaker labels
    const formattedTranscript = transcriptData.utterances.map(utterance => ({
      speaker: transcriptData.speakers?.find(s => s.id === utterance.speaker)?.label || 
        `Speaker ${utterance.speaker.replace('spk_', '')}`,
      speaker_id: utterance.speaker,
      start: utterance.start,
      start_formatted: formatTime(utterance.start),
      start_formatted_ms: formatTimeWithMs(utterance.start),
      end: utterance.end,
      end_formatted: formatTime(utterance.end),
      end_formatted_ms: formatTimeWithMs(utterance.end),
      text: utterance.text,
      // Include raw timestamp data for maximum precision
      raw_start_seconds: utterance.start,
      raw_end_seconds: utterance.end
    }));
    
    // Create a JSON object with transcript metadata
    const exportData = {
      transcript_id: transcript.transcript_id,
      file_name: transcript.file_name,
      created_at: transcript.created_at,
      total_duration: transcript.duration,
      total_duration_formatted: formatTime(transcript.duration || 0),
      total_duration_formatted_ms: formatTimeWithMs(transcript.duration || 0),
      total_segments: transcriptData.utterances.length,
      timestamp_precision: "milliseconds",
      speakers: transcriptData.speakers.map(speaker => ({
        id: speaker.id,
        label: speaker.label || `Speaker ${speaker.id.replace('spk_', '')}`,
        utterances: speaker.utterances,
        word_count: speaker.wordCount
      })),
      transcript: formattedTranscript
    };
    
    // Use the helper function from TimestampedTranscript
    downloadTimestampedJSON(exportData);
    setIsOpen(false);
  };
  
  const exportAsTimestampedText = () => {
    if (!transcriptData?.utterances || !transcriptData.speakers) {
      return;
    }
    
    // Create a text version with timestamps
    let textContent = `# Timestamped Transcript: ${transcript.file_name}\n\n`;
    textContent += `Date: ${new Date(transcript.created_at).toLocaleDateString()}\n`;
    textContent += `Total Duration: ${formatTimeWithMs(transcript.duration || 0)}\n`;
    textContent += `Total Segments: ${transcriptData.utterances.length}\n\n`;
    
    // Add speakers list
    textContent += '## Speakers\n';
    transcriptData.speakers.forEach(speaker => {
      textContent += `- ${speaker.label || `Speaker ${speaker.id.replace('spk_', '')}`} (${speaker.utterances} utterances, ${speaker.wordCount} words)\n`;
    });
    
    textContent += '\n## Transcript\n\n';
    
    // Add each utterance with timestamp
    transcriptData.utterances.forEach(utterance => {
      const speakerName = transcriptData.speakers?.find(s => s.id === utterance.speaker)?.label || 
        `Speaker ${utterance.speaker.replace('spk_', '')}`;
      textContent += `[${formatTimeWithMs(utterance.start)} - ${formatTimeWithMs(utterance.end)}] ${speakerName}: ${utterance.text}\n\n`;
    });
    
    // Use the helper function from TimestampedTranscript
    downloadTimestampedText(textContent);
    setIsOpen(false);
  };
  
  // Helper function to download file
  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Close dropdown after export
    setIsOpen(false);
  };

  // Count available export formats
  const countExportFormats = () => {
    let count = 3; // Basic formats are always available
    
    // Add timestamp formats if data is available
    if (transcriptData?.utterances && transcriptData.speakers) {
      count += 2; // JSON and Text with timestamps only
    }
    
    return count;
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 shadow-sm transition-all duration-150 ease-in-out relative"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <ArrowDownTrayIcon className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
        <span>Export</span>
        <ChevronDownIcon className={`ml-1.5 h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-800">
          {countExportFormats()}
        </span>
      </button>
      
      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute right-0 mt-2 w-64 rounded-md shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-10 transform origin-top-right transition-all duration-150 overflow-hidden animate-fadeIn"
          role="menu"
        >
          <div className="py-1" role="menu" aria-orientation="vertical">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200 bg-gray-50">
              Basic Formats
            </div>
            <button
              onClick={exportAsPlainText}
              className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50 flex items-center group"
              role="menuitem"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              Plain Text (.txt)
            </button>
            <button
              onClick={exportAsMarkdown}
              className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50 flex items-center group"
              role="menuitem"
            >
              <DocumentIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              Markdown (.md)
            </button>
            <button
              onClick={exportAsFormattedDocument}
              className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50 flex items-center group"
              role="menuitem"
            >
              <CodeBracketIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              Formatted HTML (.html)
            </button>
            
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-t border-gray-200 mt-1 bg-gray-50">
              With Timestamps
            </div>
            <button
              onClick={exportAsTimestampedJSON}
              className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50 flex items-center group"
              role="menuitem"
              disabled={!transcriptData?.utterances || !transcriptData.speakers}
            >
              <CodeBracketIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              JSON with Timestamps
            </button>
            <button
              onClick={exportAsTimestampedText}
              className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50 flex items-center group"
              role="menuitem"
              disabled={!transcriptData?.utterances || !transcriptData.speakers}
            >
              <ClockIcon className="h-4 w-4 mr-2 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              Text with Timestamps
            </button>
          </div>
        </div>
      )}
      
      {/* Add animation keyframes for dropdown */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
} 