import { supabase } from '@/lib/supabase/client';
import { uploadFileDirectly } from './assemblyai-direct';

// Helper function to get AssemblyAI token
export async function getAssemblyToken(): Promise<string> {
  try {
    const response = await fetch('/api/assemblyToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      credentials: 'include', // Include auth cookies
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to get AssemblyAI token: ${response.status}`);
    }
    
    const responseBody = await response.json();
    return responseBody.token;
  } catch (error) {
    console.error('Error getting AssemblyAI token:', error);
    throw error;
  }
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

// Helper function to get audio duration
async function getFileDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    // For audio and video files
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      const element = file.type.startsWith('audio/') 
        ? document.createElement('audio') 
        : document.createElement('video');
      
      element.preload = 'metadata';
      
      element.onloadedmetadata = () => {
        window.URL.revokeObjectURL(element.src);
        resolve(Math.round(element.duration));
      };
      
      element.onerror = () => {
        reject(new Error('Failed to load file metadata'));
      };
      
      element.src = URL.createObjectURL(file);
    } else {
      // Default to an estimate based on file size for unsupported files
      // Rough estimate: 1MB ≈ 1 minute of audio at normal quality
      const sizeMB = file.size / (1024 * 1024);
      const estimatedDuration = Math.round(sizeMB * 60); // in seconds
      resolve(estimatedDuration);
    }
  });
}

// Function to transcribe a file using AssemblyAI
export async function transcribeFile(
  file: File, 
  options?: TranscriptionOptions
): Promise<{ 
  transcriptId: string, 
  status: string 
}> {
  try {
    // Get the current user ID from Supabase
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      throw new Error('User not authenticated. Please log in again.');
    }
    
    // Get the file duration
    const duration = await getFileDuration(file);
    console.log(`File duration determined: ${duration} seconds`);
    
    // Get the AssemblyAI token for direct upload
    const tokenResponse = await fetch('/api/assemblyai-token');
    if (!tokenResponse.ok) {
      throw new Error('Failed to get AssemblyAI token');
    }
    const { token: assemblyToken } = await tokenResponse.json();
    
    // Upload directly to AssemblyAI
    console.log('Uploading file directly to AssemblyAI...');
    const url = await uploadFileDirectly(file, assemblyToken);
    console.log('Direct upload successful:', url);
    
    // Send transcription request with options AND user_id
    const transcribeResponse = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        audio_url: url, // This is now an AssemblyAI URL
        user_id: userId, // Include user ID explicitly
        file_name: file.name, // Pass the filename for the record
        file_size: file.size,
        file_type: file.type,
        duration_seconds: duration, // Include duration for credit calculation
        diarization_options: options?.diarization ? {
          speakers_expected: options.diarization.speakers_expected
        } : undefined,
        custom_vocabulary: options?.customVocabulary || [],
        sentiment_analysis: options?.enableSentiment || true
      }),
      credentials: 'include', // Include credentials for auth cookies
    });
    
    // Handle non-OK responses
    if (!transcribeResponse.ok) {
      let errorMessage = `Transcription failed: Status ${transcribeResponse.status}`;
      
      try {
        const errorData = await transcribeResponse.json();
        
        if (transcribeResponse.status === 401) {
          throw new Error('Authentication required: Your session has expired. Please log in again.');
        }
        
        if (transcribeResponse.status === 403) {
          throw new Error('Insufficient credits. Please purchase more credits to continue.');
        }
        
        errorMessage = `Transcription failed: ${errorData.error || 'Unknown error'}`;
      } catch (jsonError) {
        console.error('Failed to parse error response:', jsonError);
      }
      
      throw new Error(errorMessage);
    }
    
    const result = await transcribeResponse.json();
    return result;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error; // Re-throw to be handled by the component
  }
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

// Function to update a specific utterance in a transcription
export async function updateTranscriptionUtterance(
  transcriptId: string,
  utteranceId: string,
  text: string
): Promise<any> {
  try {
    const response = await fetch(`/api/transcription/${transcriptId}/utterance`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        utterance_id: utteranceId,
        text
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update utterance: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating utterance:', error);
    throw error;
  }
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

// Function to check and update the status of a transcription
export async function checkTranscriptionStatus(transcriptId: string): Promise<{
  isCompleted: boolean;
  text?: string;
  status: string;
}> {
  try {
    // Fetch status directly from AssemblyAI API
    const response = await fetch(`/api/transcription/${transcriptId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get transcription status: ${response.status}`);
    }
    
    const data = await response.json();
    const isCompleted = data.status === 'completed';
    
    // If completed, update local database if needed
    if (isCompleted) {
      // First check if we already have a completed transcription with this transcript_id
      const { data: existingCompleted, error: checkError } = await supabase
        .from('transcriptions')
        .select('id')
        .eq('transcript_id', transcriptId)
        .eq('status', 'completed')
        .limit(1);
        
      if (checkError) {
        console.error('Error checking for existing completed transcription:', checkError);
      } else if (existingCompleted && existingCompleted.length > 0) {
        // We already have a completed transcription with this ID
        console.log('Already have a completed transcription for:', transcriptId);
        
        // Look for processing duplicates that should be deleted
        const { data: processingDuplicates, error: dupError } = await supabase
          .from('transcriptions')
          .select('id')
          .eq('transcript_id', transcriptId)
          .eq('status', 'processing');
          
        if (!dupError && processingDuplicates && processingDuplicates.length > 0) {
          console.log(`Found ${processingDuplicates.length} processing duplicates for completed transcript, cleaning up`);
          
          // Delete the duplicates
          for (const dup of processingDuplicates) {
            await supabase
              .from('transcriptions')
              .delete()
              .eq('id', dup.id);
          }
        }
        
        return {
          isCompleted: true,
          text: data.text,
          status: 'completed'
        };
      }
      
      // Find processing transcriptions to update
      const { data: transcriptions, error: findError } = await supabase
        .from('transcriptions')
        .select('id, status')
        .eq('transcript_id', transcriptId)
        .eq('status', 'processing') // Only get processing transcripts
        .limit(1);
        
      if (findError) {
        console.error('Error finding transcription to update:', findError);
      } else if (transcriptions && transcriptions.length > 0) {
        // Update the transcription status in the database
        const { error: updateError } = await supabase
          .from('transcriptions')
          .update({ 
            status: 'completed',
            transcription_text: data.text || ''
          })
          .eq('id', transcriptions[0].id);
          
        if (updateError) {
          console.error('Error updating transcription status:', updateError);
        } else {
          console.log('Updated transcription status to completed:', transcriptId);
        }
      }
    }
    
    return {
      isCompleted,
      text: data.text,
      status: data.status
    };
  } catch (error) {
    console.error('Error checking transcription status:', error);
    return { isCompleted: false, status: 'error' };
  }
} 