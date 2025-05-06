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

export async function GET(request: Request, { params }: any) {
  try {
    const transcriptId = params.id;

    if (!transcriptId) {
      return NextResponse.json(
        { error: 'Missing transcript ID' },
        { status: 400 }
      );
    }
    
    // Get the transcript directly from AssemblyAI
    const transcript = await assemblyai.transcripts.get(transcriptId);
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }
    
    // Find the transcription record in our database to get the user ID
    // Fix: Use .limit(1) to only get one row even if multiple exist
    const { data: transcriptionData, error: dbError } = await supabaseAdmin
      .from('transcriptions')
      .select('id, user_id, metadata, file_name')
      .eq('transcript_id', transcriptId)
      .order('created_at', { ascending: false }) // Get the most recent one first
      .limit(1);
    
    // Get just the first record if any were found
    const transcription = transcriptionData && transcriptionData.length > 0 
      ? transcriptionData[0] 
      : null;
    
    if (dbError) {
      console.error('Database error:', dbError);
      // Continue with the transcript data even if we can't find our record
    }
    
    // Check for duplicate transcriptions
    if (transcription) {
      // Look for other transcriptions with the same file name and user ID
      const { data: possibleDuplicates, error: dupError } = await supabaseAdmin
        .from('transcriptions')
        .select('id, transcript_id')
        .eq('user_id', transcription.user_id)
        .eq('file_name', transcription.file_name)
        .neq('id', transcription.id) // Exclude the current one
        .eq('status', 'processing') // Only look for processing status duplicates
        .order('created_at', { ascending: false });
      
      if (dupError) {
        console.error('Error checking for duplicates:', dupError);
      } else if (possibleDuplicates && possibleDuplicates.length > 0) {
        // Duplicates found - delete them
        console.log(`Found ${possibleDuplicates.length} duplicate transcriptions for ${transcriptId}. Cleaning up...`);
        
        // Delete all duplicate transcriptions except the current one
        for (const dup of possibleDuplicates) {
          await supabaseAdmin
            .from('transcriptions')
            .delete()
            .eq('id', dup.id);
          
          console.log(`Deleted duplicate transcription: ${dup.id}`);
        }
      }
    }
    
    // Update the transcription status in our database if it's completed
    if (transcription && transcript.status === 'completed') {
      try {
        // Update the transcription record with completed status and data
        await supabaseAdmin
            .from('transcriptions')
            .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            transcription_text: transcript.text || '',
            duration: transcript.audio_duration || 0,
              metadata: {
              ...transcription.metadata,
              direct_upload: true, // Indicate this was a direct upload to AssemblyAI
              utterances: transcript.utterances?.length || 0,
              words: transcript.words?.length || 0,
              speakers: transcript.utterances 
                ? [...new Set(transcript.utterances.map(u => u.speaker))].length 
                : 0
            }
          })
          .eq('transcript_id', transcriptId);
          
        console.log(`Updated transcription record for ${transcriptId} to completed status`);
      } catch (updateError) {
        console.error('Failed to update transcription status:', updateError);
        // Continue processing - don't fail the request
      }
    }
    
    // Process sentiment analysis if available
    let sentimentAnalysis = null;
    if (transcript.sentiment_analysis_results) {
      sentimentAnalysis = transcript.sentiment_analysis_results;
    }
    
    // Return the transcript data
    return NextResponse.json({
      id: transcript.id,
      status: transcript.status,
      text: transcript.text,
      confidence: transcript.confidence,
      audio_duration: transcript.audio_duration,
      utterances: transcript.utterances,
      words: transcript.words,
      summary: transcript.summary,
      sentiment_analysis_results: sentimentAnalysis,
      error: transcript.error
    });
  } catch (error: any) {
    console.error('Error retrieving transcript:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve transcript' },
      { status: 500 }
    );
  }
} 