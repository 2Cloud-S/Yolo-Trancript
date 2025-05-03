export interface TranscriptSpeaker {
  id: string;
  label?: string; // User-friendly label (e.g., "John", "Speaker 1")
  utterances: number;
  wordCount: number;
  totalDuration?: number; // Total speaking time in seconds
}

export interface TranscriptUtterance {
  id: string;
  speaker: string;
  start: number; // Start time in seconds
  end: number; // End time in seconds
  text: string;
  words?: TranscriptWord[];
  confidence?: number;
}

export interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface TranscriptSummary {
  text: string;
  type: 'paragraph' | 'bullets' | 'gist';
}

export interface EnhancedTranscript {
  id: string;
  text: string;
  utterances: TranscriptUtterance[];
  speakers: TranscriptSpeaker[];
  summary?: TranscriptSummary;
  words?: TranscriptWord[];
  segments?: TranscriptSegment[];
  audio_duration?: number;
  confidence?: number;
  status: 'queued' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface SpeakerDiarizationOptions {
  speakers_expected?: number;
  speaker_labels?: string[]; // Custom labels for speakers
  summary_type?: 'paragraph' | 'bullets' | 'gist';
  summary_model?: 'informative' | 'conversational';
}

export interface Transcript {
  id: string;
  user_id: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  transcript_id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
  updated_at?: string;
  duration?: number;
  transcription_text?: string;
  error_message?: string;
  metadata?: {
    speakerLabels?: Record<string, string>;
    customVocabulary?: string[];
    [key: string]: any;
  };
}

export interface CustomVocabulary {
  id: string;
  user_id: string;
  name: string;
  terms: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
} 