'use client';

import { useState } from 'react';
import { TranscriptSpeaker, TranscriptUtterance } from '@/types/transcription';
import { Transcript } from '@/lib/supabase';

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
  
  // Format time in seconds to MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    <p>Duration: ${transcript.duration ? Math.floor(transcript.duration / 60) + ' minutes, ' + Math.floor(transcript.duration % 60) + ' seconds' : 'Unknown'}</p>
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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Export <span className="ml-1">▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={exportAsPlainText}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Plain Text (.txt)
            </button>
            <button
              onClick={exportAsMarkdown}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Markdown (.md)
            </button>
            <button
              onClick={exportAsFormattedDocument}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Formatted HTML (.html)
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 