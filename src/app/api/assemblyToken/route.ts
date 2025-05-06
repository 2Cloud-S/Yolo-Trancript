import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for admin access
// This bypasses regular auth and uses direct database access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // Get AssemblyAI API key from environment
    const assemblyToken = process.env.ASSEMBLY_API_KEY;
    
    if (!assemblyToken) {
      console.error('AssemblyAI API key not configured');
      return NextResponse.json(
        { error: 'Transcription service not configured' },
        { status: 500 }
      );
    }
    
    // Return the token
    return NextResponse.json({ token: assemblyToken });
  } catch (error) {
    console.error('Error retrieving AssemblyAI token:', error);
    return NextResponse.json(
      { error: 'Failed to get transcription service token' },
      { status: 500 }
    );
  }
} 