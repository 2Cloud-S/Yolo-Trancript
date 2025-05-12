'use client';

import { useState } from 'react';
import { AlertCircle, X, Info, CheckSquare } from 'lucide-react';

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
      <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs mt-1">
        <Info className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
        <span>
          AI-generated transcription may contain errors. Please verify important information.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm mb-6 overflow-hidden">
      <div className="bg-indigo-100 px-4 py-2 border-b border-indigo-200 flex justify-between items-center">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-sm font-medium text-indigo-800">About Automated Transcription</h3>
        </div>
        <button 
          onClick={() => setDismissed(true)}
          className="text-indigo-500 hover:text-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded-full p-1"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="text-sm text-indigo-700 leading-relaxed">
          <p>
            This transcript was generated using AI speech recognition technology. While we strive for accuracy, 
            automated transcriptions may contain errors, especially with:
          </p>
          
          <ul className="mt-2 space-y-1">
            {[
              'Technical terminology or industry-specific jargon',
              'Names, locations, or uncommon words',
              'Sections with background noise or multiple speakers',
              'Heavy accents or unclear pronunciation'
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-3 bg-white p-3 rounded border border-indigo-200 flex items-start gap-2">
            <CheckSquare className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700">
              Please verify any critical information before making important decisions based on this transcript. 
              You can edit the transcript text to correct any errors you find.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 