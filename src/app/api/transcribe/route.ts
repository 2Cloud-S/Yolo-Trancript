import { AssemblyAI } from 'assemblyai';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { logCreditUsage } from '@/lib/supabase/admin-client';

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

// Calculate credits needed based on audio duration
function calculateCreditsNeeded(durationInSeconds: number): number {
  return Math.ceil(durationInSeconds / 360); // 1 credit = 6 minutes (360 seconds)
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  try {
    // Get form data from request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Get file duration from request header or calculate it
    const duration = file.size > 0 ? Math.ceil(file.size / (16000 * 2)) : 0; // Rough estimate if not provided
    
    // Check if the user has enough credits
    const creditsNeeded = calculateCreditsNeeded(duration);
    
    const { data: creditData, error: creditError } = await supabase
      .from('user_credit_summary')
      .select('credits_balance')
      .eq('user_id', session.user.id)
      .single();
    
    if (creditError && creditError.code !== 'PGRST116') {
      console.error('Error checking credits:', creditError);
      return NextResponse.json({ error: 'Failed to check credits' }, { status: 500 });
    }
    
    const creditsBalance = creditData?.credits_balance || 0;
    
    if (creditsBalance < creditsNeeded) {
      return NextResponse.json({ 
        error: 'Insufficient credits', 
        creditsNeeded,
        creditsBalance
      }, { status: 403 });
    }
    
    // Create a new transcription record
    const { data: transcription, error } = await supabase
      .from('transcriptions')
      .insert({
        user_id: session.user.id,
        title: file.name,
        status: 'processing',
        duration_seconds: duration,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating transcription:', error);
      return NextResponse.json({ error: 'Failed to create transcription' }, { status: 500 });
    }
    
    // Deduct credits for the transcription
    try {
      await logCreditUsage(
        session.user.id, 
        creditsNeeded, 
        transcription.id,
        `Transcription of ${file.name} (${Math.round(duration / 60)} minutes)`
      );
    } catch (creditError) {
      console.error('Error deducting credits:', creditError);
      // We'll still process the transcription even if credit deduction fails
      // The credits can be reconciled later if needed
    }
    
    // Here you would typically upload the file to storage and start the transcription process
    // For this implementation, we're just returning the transcription ID
    
    return NextResponse.json({ 
      success: true, 
      transcriptionId: transcription.id,
      creditsUsed: creditsNeeded,
    });
    
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 