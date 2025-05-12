import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AssemblyAI } from 'assemblyai';

// Simplify the handler to avoid type issues with dynamic segments
export async function PUT(request: Request) {
  try {
    // Extract the ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const transcriptId = pathParts[pathParts.length - 2]; // Get the ID from the path
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { utterance_id, text } = body;
    
    if (!utterance_id || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get transcript from database to verify ownership
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('transcript_id', transcriptId)
      .single();
    
    if (transcriptError || !transcript) {
      return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (transcript.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get AssemblyAI API key from environment
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AssemblyAI API key not configured' }, { status: 500 });
    }
    
    // Initialize AssemblyAI client
    const assemblyai = new AssemblyAI({ apiKey });
    
    // Store the update in metadata as we don't have direct access to AssemblyAI's utterances
    const updatedMetadata = {
      ...transcript.metadata,
      utteranceEdits: {
        ...(transcript.metadata?.utteranceEdits || {}),
        [utterance_id]: {
          originalText: '', // We don't have the original, but we could store it if needed
          updatedText: text,
          updatedAt: new Date().toISOString()
        }
      }
    };
    
    // Update the metadata in the database
    const { data: updatedTranscript, error: updateError } = await supabase
      .from('transcriptions')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', transcript.id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update transcript' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Utterance updated successfully',
      transcript: updatedTranscript
    });
  } catch (error) {
    console.error('Error updating utterance:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 