// Helper function to get AssemblyAI token
export async function getAssemblyToken(): Promise<string> {
  const response = await fetch('/api/assemblyToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-store',
  });
  
  const responseBody = await response.json();
  return responseBody.token;
}

// Types for diarization options
export interface DiarizationOptions {
  speakers_expected?: number;
  summary_type?: 'paragraph' | 'bullets' | 'gist';
  summary_model?: 'informative' | 'conversational';
}

// Types for transcription options
export interface TranscriptionOptions {
  diarization?: DiarizationOptions;
  customVocabulary?: string[];
  enableSentiment?: boolean;
}

// Function to transcribe a file using AssemblyAI
export async function transcribeFile(
  file: File, 
  options?: TranscriptionOptions
): Promise<{ 
  transcriptId: string, 
  status: string 
}> {
  // Get presigned URL
  const formData = new FormData();
  formData.append('file', file);
  
  const uploadResponse = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  const { url } = await uploadResponse.json();
  
  // Send transcription request with options
  const transcribeResponse = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      audio_url: url,
      diarization_options: options?.diarization ? {
        speakers_expected: options.diarization.speakers_expected || 2
      } : undefined,
      custom_vocabulary: options?.customVocabulary || [],
      sentiment_analysis: options?.enableSentiment || true
    }),
  });
  
  // Log error response if present
  if (!transcribeResponse.ok) {
    const errorData = await transcribeResponse.json();
    console.error('Transcribe API error:', errorData);
    throw new Error(`Transcription failed: ${errorData.error || 'Unknown error'}`);
  }
  
  return transcribeResponse.json();
}

// Function to get transcription result
export async function getTranscription(transcriptId: string): Promise<any> {
  const response = await fetch(`/api/transcription/${transcriptId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return response.json();
}

// Helper function to process sentiment data
export function processSentimentData(sentimentData: any): {
  overall: string;
  segments: any[];
  summary: string;
} {
  if (!sentimentData || !Array.isArray(sentimentData) || sentimentData.length === 0) {
    return { 
      overall: 'neutral', 
      segments: [],
      summary: 'No sentiment data available'
    };
  }
  
  // Count different sentiment types
  const sentiments = {
    positive: 0,
    negative: 0,
    neutral: 0
  };
  
  sentimentData.forEach(item => {
    const sentiment = item.sentiment.toLowerCase();
    if (sentiment === 'positive') sentiments.positive++;
    else if (sentiment === 'negative') sentiments.negative++;
    else sentiments.neutral++;
  });
  
  // Determine overall sentiment
  let overall = 'neutral';
  if (sentiments.positive > sentiments.negative && sentiments.positive > sentiments.neutral) {
    overall = 'positive';
  } else if (sentiments.negative > sentiments.positive && sentiments.negative > sentiments.neutral) {
    overall = 'negative';
  }
  
  // Calculate percentages
  const total = sentiments.positive + sentiments.negative + sentiments.neutral;
  const positivePercent = Math.round((sentiments.positive / total) * 100);
  const negativePercent = Math.round((sentiments.negative / total) * 100);
  const neutralPercent = Math.round((sentiments.neutral / total) * 100);
  
  // Generate a summary
  const summary = `Overall sentiment is ${overall}. The transcript contains ${positivePercent}% positive, ${negativePercent}% negative, and ${neutralPercent}% neutral segments.`;
  
  return {
    overall,
    segments: sentimentData,
    summary
  };
}

// Function to get speaker information from transcript
export function extractSpeakers(transcript: any): { 
  speakerCount: number,
  speakers: { id: string, utterances: number, wordCount: number }[] 
} {
  if (!transcript || !transcript.utterances) {
    return { speakerCount: 0, speakers: [] };
  }
  
  const speakerMap = new Map();
  
  // Process each utterance
  transcript.utterances.forEach((utterance: any) => {
    const speakerId = utterance.speaker;
    if (!speakerMap.has(speakerId)) {
      speakerMap.set(speakerId, { 
        id: speakerId, 
        utterances: 0,
        wordCount: 0 
      });
    }
    
    const speaker = speakerMap.get(speakerId);
    speaker.utterances += 1;
    speaker.wordCount += utterance.words?.length || 0;
  });
  
  return {
    speakerCount: speakerMap.size,
    speakers: Array.from(speakerMap.values())
  };
} 