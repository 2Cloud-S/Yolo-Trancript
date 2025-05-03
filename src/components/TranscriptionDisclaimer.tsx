'use client';

import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface TranscriptionDisclaimerProps {
  compact?: boolean;
}

export default function TranscriptionDisclaimer({ compact = false }: TranscriptionDisclaimerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  if (compact) {
    return (
      <div className="text-xs text-gray-500 italic mb-2 flex items-start gap-1">
        <AlertCircle className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
        <span>
          AI-generated transcription may contain errors. Please verify important information.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex justify-between items-start">
            <p className="text-sm text-blue-700 font-medium">About Automated Transcription</p>
            <button 
              onClick={() => setDismissed(true)}
              className="ml-4 text-blue-400 hover:text-blue-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-1 text-sm text-blue-600">
            <p>
              This transcript was generated using AI speech recognition technology. While we strive for accuracy, 
              automated transcriptions may contain errors, especially with:
            </p>
            <ul className="list-disc ml-5 mt-1">
              <li>Technical terminology or industry-specific jargon</li>
              <li>Names, locations, or uncommon words</li>
              <li>Sections with background noise or multiple speakers</li>
              <li>Heavy accents or unclear pronunciation</li>
            </ul>
            <p className="mt-1">
              Please verify any critical information before making important decisions based on this transcript.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 