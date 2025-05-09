import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AssemblyAI } from 'assemblyai';
import { useTrialCredit } from '@/lib/credits';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

// Initialize AssemblyAI client
const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_API_KEY!
});

// Create a Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// Function to check transcription status and update database
async function checkTranscriptionStatus(transcriptId: string, dbRecordId: string) {
  try {
    // Get current status from database first
    const { data: transcriptionRecord, error: dbError } = await supabaseAdmin
      .from('transcriptions')
      .select('status, metadata')
      .eq('id', dbRecordId)
      .single();
    
    // If already completed or error fetching, stop checking
    if (dbError || !transcriptionRecord || transcriptionRecord.status === 'completed') {
      return;
    }
    
    // Check status with AssemblyAI
    const transcript = await assemblyai.transcripts.get(transcriptId);
    
    // If status is now completed, update in database
    if (transcript.status === 'completed') {
      await supabaseAdmin
        .from('transcriptions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          transcription_text: transcript.text || '',
          duration: transcript.audio_duration || 0,
          metadata: {
            ...(transcriptionRecord.metadata || {}),
            utterances: transcript.utterances?.length || 0,
            words: transcript.words?.length || 0,
            speakers: transcript.utterances 
              ? [...new Set(transcript.utterances.map(u => u.speaker))].length 
              : 0
          }
        })
        .eq('id', dbRecordId);
      
      console.log(`Updated transcription status to completed for ${transcriptId}`);
    }
  } catch (error) {
    console.error(`Error checking transcript status for ${transcriptId}:`, error);
  }
}

export async function POST(req: Request) {
  try {
    console.log("Initializing Supabase client from server library");
    
    // Create a proper server-side client
    const supabase = await createServerSupabase();
    
    console.log("Supabase client initialized successfully");
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Authentication failed:", userError);
      return NextResponse.json({ error: 'Unauthorized: ' + (userError?.message || 'No authenticated user') }, { status: 401 });
    }
    
    const userId = user.id;
    console.log(`Authenticated user: ${userId}`);

    // Check if user can use trial credits
    const canUseTrial = await useTrialCredit(userId);
    if (!canUseTrial) {
      // Check regular credits if trial is not available
      const { data: credits, error: creditError } = await supabaseAdmin
        .from('user_credits')
        .select('credits_balance')
        .eq('user_id', userId)
        .single();

      if (creditError || !credits || credits.credits_balance <= 0) {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }

    // Parse the request JSON
    const requestData = await req.json();
    const { 
      audio_url, 
      diarization_options, 
      custom_vocabulary, 
      sentiment_analysis, 
      file_name,
      file_size,
      file_type,
      duration_seconds
    } = requestData;
    
    if (!audio_url) {
      return NextResponse.json({ error: 'Missing audio URL' }, { status: 400 });
    }
    
    if (!duration_seconds || isNaN(Number(duration_seconds))) {
      return NextResponse.json({ error: 'Missing or invalid duration' }, { status: 400 });
    }
    
    // Calculate credits needed based on duration
    const creditsNeeded = calculateCreditsNeeded(Number(duration_seconds));
    
    // Verify user has credits directly with the admin client
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
      audio: audio_url, // Use the AssemblyAI upload URL directly
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
    
    // Start the transcription using the AssemblyAI URL directly
    const transcript = await assemblyai.transcripts.transcribe(transcriptOptions);
    
    // Create a record in the database, but don't store the actual file
    const { data: transcription, error: dbError } = await supabaseAdmin
      .from('transcriptions')
      .insert({
        user_id: userId,
        transcript_id: transcript.id,
        status: 'processing',
        file_name: file_name || `transcript_${transcript.id}.json`,
        file_size: file_size || 0,
        file_type: file_type || 'audio/mpeg',
        metadata: {
          diarization_options,
          custom_vocabulary,
          sentiment_analysis,
          duration_seconds,
          credits_used: creditsNeeded,
          direct_upload: true // Flag to indicate this was a direct upload
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
    
    // Update credits (only if not using trial credits)
    if (!canUseTrial) {
      const { error: creditUpdateError } = await supabaseAdmin
        .from('user_credits')
        .update({
          credits_balance: credits.credits_balance - 1
        })
        .eq('user_id', userId);

      if (creditUpdateError) {
        console.error('Error updating credits:', creditUpdateError);
        return NextResponse.json(
          { error: 'Error updating credits' },
          { status: 500 }
        );
      }
    }
    
    // Schedule background checks for this transcription
    scheduleTranscriptionStatusCheck(transcript.id, transcription.id);
    
    // Return success response
    return NextResponse.json({
      transcriptId: transcript.id,
      status: 'processing',
      creditsUsed: creditsNeeded
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Transcription failed' },
      { status: 500 }
    );
  }
} 