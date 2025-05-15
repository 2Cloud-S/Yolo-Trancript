import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AssemblyAI } from 'assemblyai';

// Create a Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize AssemblyAI client
const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_API_KEY!
});

// Calculate credits needed based on audio duration (in seconds)
function calculateCreditsNeeded(durationInSeconds: number): number {
  // 1 credit = 6 minutes (360 seconds) of audio
  const creditsNeeded = Math.ceil(durationInSeconds / 360);
  
  // Minimum 1 credit
  return Math.max(1, creditsNeeded);
}

// Check transcription status and update database when completed
async function scheduleTranscriptionStatusCheck(transcriptId: string, dbRecordId: string) {
  try {
    // Quick initial check: Check almost immediately at 2 seconds
    setTimeout(async () => {
      await checkTranscriptionStatus(transcriptId, dbRecordId);
    }, 2000);
    
    // First check: Wait 20 seconds before first status check
    setTimeout(async () => {
      await checkTranscriptionStatus(transcriptId, dbRecordId);
    }, 20000);
    
    // Second check: If not completed after 1 minute, check again
    setTimeout(async () => {
      await checkTranscriptionStatus(transcriptId, dbRecordId);
    }, 60000);
    
    // Third check: If still not completed after 3 minutes, check again
    setTimeout(async () => {
      await checkTranscriptionStatus(transcriptId, dbRecordId);
    }, 180000);
    
    console.log(`Scheduled status checks for transcript: ${transcriptId}`);
  } catch (error) {
    console.error(`Error scheduling checks for ${transcriptId}:`, error);
  }
}

// Helper function to check transcription status
async function checkTranscriptionStatus(transcriptId: string, dbRecordId: string) {
  try {
    console.log(`Checking status of transcript: ${transcriptId}`);
    
    // Get the transcript from AssemblyAI
    const transcript = await assemblyai.transcripts.get(transcriptId);
    
    if (!transcript) {
      console.error(`Transcript not found: ${transcriptId}`);
      return;
    }
    
    console.log(`Transcript ${transcriptId} status: ${transcript.status}`);
    
    // If the transcript is completed, update the database record
    if (transcript.status === 'completed') {
      // Update the transcription record in the database
      const { error } = await supabaseAdmin
        .from('transcriptions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          transcription_text: transcript.text || '',
          duration: transcript.audio_duration || 0,
          metadata: {
            utterances: transcript.utterances?.length || 0,
            words: transcript.words?.length || 0,
            speakers: transcript.utterances 
              ? [...new Set(transcript.utterances.map(u => u.speaker))].length 
              : 0
          }
        })
        .eq('id', dbRecordId);
      
      if (error) {
        console.error(`Error updating transcription record ${dbRecordId}:`, error);
      } else {
        console.log(`Updated transcription record ${dbRecordId} to completed status`);
      }
    }
  } catch (error) {
    console.error(`Error checking status for transcript ${transcriptId}:`, error);
  }
}

export async function POST(req: Request) {
  try {
    // Parse request body
    const requestData = await req.json();
    const { 
      url, 
      user_id: userId,
      diarization_options, 
      custom_vocabulary, 
      sentiment_analysis 
    } = requestData;
    
    if (!url) {
      return NextResponse.json({ error: 'Missing media URL' }, { status: 400 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Verify the user exists in the database
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (userError || !user) {
      console.error('User verification error:', userError);
      return NextResponse.json(
        { error: 'User not found or unauthorized' },
        { status: 401 }
      );
    }
    
    // Estimate duration based on file type or use default
    // Note: For URL transcription, we'll use a default estimated duration initially
    // This will be updated with the actual duration once AssemblyAI processes the file
    const estimated_duration = 300; // 5 minutes default
    
    // Calculate credits needed based on estimated duration
    const creditsNeeded = calculateCreditsNeeded(estimated_duration);
    
    // Verify user has credits
    const { data: credits, error: creditsError } = await supabaseAdmin
      .from('user_credits')
      .select('credits_balance')
      .eq('user_id', userId)
      .single();
    
    if (creditsError) {
      console.error('Failed to fetch user credits:', creditsError);
      return NextResponse.json(
        { error: 'Error checking user credits' },
        { status: 500 }
      );
    }
    
    if (!credits || credits.credits_balance < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${creditsNeeded} credits for this transcription.` },
        { status: 403 }
      );
    }
    
    // Create the transcription options
    const transcriptOptions: any = {
      audio: url, // Use the provided URL directly
      speaker_labels: Boolean(diarization_options),
    };
    
    // Add optional parameters if provided
    if (diarization_options?.speakers_expected) {
      transcriptOptions.speakers_expected = diarization_options.speakers_expected;
    }
    
    if (custom_vocabulary && custom_vocabulary.length > 0) {
      transcriptOptions.word_boost = custom_vocabulary;
    }
    
    if (sentiment_analysis) {
      transcriptOptions.sentiment_analysis = true;
    }
    
    // Start the transcription
    const transcript = await assemblyai.transcripts.transcribe(transcriptOptions);
    
    // Extract filename from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1] || `url_transcript_${transcript.id}`;
    
    // Create a record in the database
    const { data: transcription, error: dbError } = await supabaseAdmin
      .from('transcriptions')
      .insert({
        user_id: userId,
        transcript_id: transcript.id,
        status: 'processing',
        file_name: fileName,
        file_size: 0, // Unknown for URL
        file_type: 'url', // Mark as URL source
        duration: estimated_duration, // Estimated duration
        metadata: {
          source_url: url,
          diarization_options,
          custom_vocabulary,
          sentiment_analysis,
          duration_seconds: estimated_duration,
          credits_used: creditsNeeded,
          direct_upload: false,
          url_transcription: true
        }
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Failed to create transcription record:', dbError);
      return NextResponse.json(
        { error: 'Failed to create transcription record' },
        { status: 500 }
      );
    }
    
    // Update credits
    const { error: creditUpdateError } = await supabaseAdmin
      .from('user_credits')
      .update({
        credits_balance: credits.credits_balance - creditsNeeded
      })
      .eq('user_id', userId);

    if (creditUpdateError) {
      console.error('Error updating credits:', creditUpdateError);
      return NextResponse.json(
        { error: 'Error updating credits' },
        { status: 500 }
      );
    }
    
    // Schedule background checks for this transcription
    scheduleTranscriptionStatusCheck(transcript.id, transcription.id);
    
    // Return success response
    return NextResponse.json({
      transcriptionId: transcript.id,
      status: 'processing',
      creditsUsed: creditsNeeded
    });
  } catch (error: any) {
    console.error('URL transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 