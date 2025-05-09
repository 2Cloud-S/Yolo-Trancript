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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Get the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // Upload directly to AssemblyAI instead of Supabase Storage
    const uploadUrl = await assemblyai.files.upload(fileBuffer);
    
    console.log('File uploaded to AssemblyAI:', uploadUrl);
    
    return NextResponse.json({
      url: uploadUrl,
      fileName: file.name
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
} 