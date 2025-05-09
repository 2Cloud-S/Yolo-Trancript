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
  console.log('[API/UPLOAD] Starting file upload process');
  
  try {
    // First try to get the form data
    let file: File | null = null;
    try {
      const formData = await request.formData();
      file = formData.get('file') as File;
      
      if (!file) {
        console.error('[API/UPLOAD] No file provided in form data');
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }
      
      console.log('[API/UPLOAD] File received from form data:', { 
        name: file.name, 
        type: file.type, 
        size: file.size 
      });
    } catch (formError) {
      console.error('[API/UPLOAD] Error parsing form data:', formError);
      return NextResponse.json(
        { error: 'Invalid form data: ' + (formError instanceof Error ? formError.message : 'Unknown error') },
        { status: 400 }
      );
    }
    
    // Get the file as an ArrayBuffer
    let fileBuffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      console.log('[API/UPLOAD] Successfully converted file to buffer, size:', fileBuffer.length);
    } catch (bufferError) {
      console.error('[API/UPLOAD] Error converting file to buffer:', bufferError);
      return NextResponse.json(
        { error: 'Failed to process file: ' + (bufferError instanceof Error ? bufferError.message : 'Unknown error') },
        { status: 500 }
      );
    }
    
    // Upload directly to AssemblyAI
    let uploadUrl: string;
    try {
      uploadUrl = await assemblyai.files.upload(fileBuffer);
      console.log('[API/UPLOAD] File successfully uploaded to AssemblyAI:', uploadUrl);
    } catch (uploadError: any) {
      console.error('[API/UPLOAD] AssemblyAI upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload to transcription service: ' + (uploadError.message || 'Unknown error') },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      url: uploadUrl,
      fileName: file.name,
      success: true
    });
  } catch (error: any) {
    console.error('[API/UPLOAD] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Upload failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Configure API route to handle larger file uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
}; 