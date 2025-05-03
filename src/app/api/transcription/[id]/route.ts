import { AssemblyAI } from 'assemblyai';
import { NextRequest } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { processSentimentData } from '@/lib/assemblyai';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = process.env.ASSEMBLY_API_KEY;
    
    if (!apiKey) {
      return Response.json({ error: 'API key not found' }, { status: 500 });
    }

    const resolvedParams = await params;
    const transcriptId = resolvedParams.id;

    if (!transcriptId) {
      return Response.json({ error: 'No transcript ID provided' }, { status: 400 });
    }

    const assemblyClient = new AssemblyAI({
      apiKey: apiKey
    });

    // Get basic transcription result
    const transcript = await assemblyClient.transcripts.get(transcriptId);
    console.log('Assembly transcript response:', transcript);

    // Initialize response with available data
    const enhancedResponse: {
      [key: string]: any;
      speakers: any[];
      utterances: any[];
      entities: any[];
      sentiment: {
        overall: string;
        segments: any[];
        summary: string;
      }
    } = {
      ...transcript,
      speakers: [],
      utterances: [],
      entities: [],
      sentiment: {
        overall: 'neutral',
        segments: [],
        summary: 'No sentiment data available'
      }
    };

    // Process sentiment analysis data if available
    if (transcript.sentiment_analysis_results) {
      const sentimentData = processSentimentData(transcript.sentiment_analysis_results);
      enhancedResponse.sentiment = sentimentData;
    }

    // Try to manually process any speaker information from the transcript
    if (transcript.status === 'completed' && transcript.words) {
      try {
        const utterances = extractUtterancesFromWords(transcript.words);
        if (utterances.length > 0) {
          enhancedResponse.utterances = utterances;
          const { speakers } = processUtterancesForSpeakers(utterances);
          enhancedResponse.speakers = speakers;
        }
      } catch (processingError) {
        console.error('Failed to process utterance data:', processingError);
      }
    }

    // Update the transcript metadata in Supabase
    if (transcript.status === 'completed') {
      try {
        const supabase = createServerComponentClient<Database>({ cookies });
        
        // Find the transcription record
        const { data: transcriptionData } = await supabase
          .from('transcriptions')
          .select('id, metadata')
          .eq('transcript_id', transcriptId)
          .single();
        
        if (transcriptionData) {
          // Update metadata with available information
          await supabase
            .from('transcriptions')
            .update({
              transcription_text: transcript.text,
              status: transcript.status,
              duration: transcript.audio_duration,
              metadata: {
                ...transcriptionData.metadata,
                speakers: enhancedResponse.speakers,
                utterances_count: enhancedResponse.utterances.length,
                sentiment: enhancedResponse.sentiment.overall,
                sentiment_summary: enhancedResponse.sentiment.summary
              }
            })
            .eq('id', transcriptionData.id);
        }
      } catch (dbError) {
        console.error('Error updating transcript metadata:', dbError);
        // Continue with the response even if the DB update fails
      }
    }

    return Response.json(enhancedResponse);
  } catch (error) {
    console.error('Transcription error:', error);
    return Response.json({ 
      error: 'Failed to get transcription',
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

// Helper function to extract utterances from words
function extractUtterancesFromWords(words: any[]): any[] {
  if (!words || words.length === 0) return [];
  
  const utterances: any[] = [];
  let currentUtterance: any = null;
  let utteranceId = 1;
  
  words.forEach((word, index) => {
    if (!word.speaker) return;
    
    // If this is a new speaker or the first word
    if (!currentUtterance || currentUtterance.speaker !== word.speaker) {
      // Save the previous utterance if it exists
      if (currentUtterance) {
        utterances.push(currentUtterance);
      }
      
      // Start a new utterance
      currentUtterance = {
        id: `utterance_${utteranceId++}`,
        speaker: word.speaker,
        start: word.start,
        end: word.end,
        text: word.text,
        words: [word]
      };
    } else {
      // Continue the current utterance
      currentUtterance.text += ' ' + word.text;
      currentUtterance.end = word.end;
      currentUtterance.words.push(word);
    }
  });
  
  // Add the last utterance
  if (currentUtterance) {
    utterances.push(currentUtterance);
  }
  
  return utterances;
}

// Helper function to process utterances for speaker information
function processUtterancesForSpeakers(utterances: any[]) {
  const speakerMap = new Map();
  
  utterances.forEach((utterance: any) => {
    if (!utterance.speaker) return;
    
    if (!speakerMap.has(utterance.speaker)) {
      speakerMap.set(utterance.speaker, {
        id: utterance.speaker,
        utterances: 0,
        wordCount: 0,
        totalDuration: 0
      });
    }
    
    const speaker = speakerMap.get(utterance.speaker);
    speaker.utterances += 1;
    speaker.wordCount += utterance.words?.length || 0;
    speaker.totalDuration += (utterance.end - utterance.start);
  });
  
  return {
    speakers: Array.from(speakerMap.values())
  };
} 