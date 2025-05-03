import { AssemblyAI } from 'assemblyai';
import { NextRequest } from 'next/server';

// Define interface for transcription options
interface TranscriptionOptions {
  audio: string;
  language_code: string;
  punctuate: boolean;
  format_text: boolean;
  speaker_labels: boolean;
  speakers_expected?: number;
  word_boost?: string[];
  boost_param?: "low" | "default" | "high";
  sentiment_analysis?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ASSEMBLY_API_KEY;
    
    if (!apiKey) {
      return Response.json({ error: 'API key not found' }, { status: 500 });
    }

    const { 
      audio_url, 
      diarization_options, 
      custom_vocabulary, 
      sentiment_analysis 
    } = await request.json();

    if (!audio_url) {
      return Response.json({ error: 'No audio URL provided' }, { status: 400 });
    }

    const assemblyClient = new AssemblyAI({
      apiKey: apiKey
    });

    // Prepare transcription options
    const transcriptionOptions: TranscriptionOptions = {
      audio: audio_url,
      language_code: 'en',
      punctuate: true,
      format_text: true,
      speaker_labels: true,
    };

    // Add diarization options if provided
    if (diarization_options) {
      transcriptionOptions.speaker_labels = true;
      transcriptionOptions.speakers_expected = diarization_options.speakers_expected;
    }

    // Add custom vocabulary if provided
    if (custom_vocabulary && Array.isArray(custom_vocabulary) && custom_vocabulary.length > 0) {
      transcriptionOptions.word_boost = custom_vocabulary;
      transcriptionOptions.boost_param = "high";
    }

    // Add sentiment analysis if enabled
    if (sentiment_analysis) {
      transcriptionOptions.sentiment_analysis = true;
    }

    // Submit transcription request with all options
    const transcript = await assemblyClient.transcripts.transcribe(transcriptionOptions);

    return Response.json({ 
      transcriptId: transcript.id,
      status: transcript.status
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return Response.json({ error: 'Failed to transcribe file' }, { status: 500 });
  }
} 