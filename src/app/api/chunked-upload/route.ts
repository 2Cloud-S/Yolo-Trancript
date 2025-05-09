import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';

// Initialize AssemblyAI client
const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_API_KEY!
});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function POST(request: NextRequest) {
  console.log('[API/CHUNKED-UPLOAD] Starting chunked upload process');
  
  try {
    // Get the chunk data from the request
    const formData = await request.formData();
    const chunk = formData.get('chunk') as File;
    const chunkIndex = Number(formData.get('chunkIndex'));
    const totalChunks = Number(formData.get('totalChunks'));
    const fileName = formData.get('fileName') as string;
    const fileType = formData.get('fileType') as string;
    const uploadId = formData.get('uploadId') as string;
    
    if (!chunk) {
      console.error('[API/CHUNKED-UPLOAD] No chunk provided');
      return NextResponse.json(
        { error: 'No chunk provided' }, 
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (isNaN(chunkIndex) || isNaN(totalChunks)) {
      console.error('[API/CHUNKED-UPLOAD] Invalid chunk index or total chunks');
      return NextResponse.json(
        { error: 'Invalid chunk metadata' }, 
        { status: 400, headers: corsHeaders }
      );
    }
    
    console.log(`[API/CHUNKED-UPLOAD] Processing chunk ${chunkIndex + 1}/${totalChunks} for ${fileName}`);
    
    // This is the first chunk, start a new upload
    if (chunkIndex === 0) {
      try {
        // Check if chunk is too large (Vercel has a 4.5MB limit for Lambda functions)
        if (chunk.size > 4 * 1024 * 1024) {
          console.error('[API/CHUNKED-UPLOAD] First chunk too large:', chunk.size);
          return NextResponse.json(
            { error: 'Chunk size exceeds Vercel limit. Please use smaller chunks (< 4MB).' },
            { status: 413, headers: corsHeaders }
          );
        }
        
        // Convert to buffer and upload directly to AssemblyAI
        const arrayBuffer = await chunk.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Start a new upload to AssemblyAI
        const uploadUrl = await assemblyai.files.upload(buffer);
        
        console.log(`[API/CHUNKED-UPLOAD] First chunk uploaded to AssemblyAI: ${uploadUrl}`);
        
        return NextResponse.json({
          success: true,
          message: 'First chunk uploaded successfully',
          uploadUrl,
          chunkIndex,
          totalChunks,
          fileName
        }, { headers: corsHeaders });
      } catch (error: any) {
        console.error('[API/CHUNKED-UPLOAD] Error uploading first chunk:', error);
        return NextResponse.json(
          { error: `Failed to upload first chunk: ${error.message || 'Unknown error'}` },
          { status: 500, headers: corsHeaders }
        );
      }
    } 
    // This is the final chunk, we handle it specially
    else if (chunkIndex === totalChunks - 1) {
      console.log(`[API/CHUNKED-UPLOAD] Final chunk received for ${fileName}`);
      
      if (!uploadId) {
        console.error('[API/CHUNKED-UPLOAD] No upload ID provided for final chunk');
        return NextResponse.json(
          { error: 'Missing upload ID for final chunk' },
          { status: 400, headers: corsHeaders }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Final chunk received',
        uploadUrl: uploadId,
        chunkIndex,
        totalChunks,
        fileName,
        complete: true
      }, { headers: corsHeaders });
    } 
    // This is a middle chunk
    else {
      console.log(`[API/CHUNKED-UPLOAD] Middle chunk ${chunkIndex + 1}/${totalChunks} received`);
      
      if (!uploadId) {
        console.error('[API/CHUNKED-UPLOAD] No upload ID provided for middle chunk');
        return NextResponse.json(
          { error: 'Missing upload ID for chunk' },
          { status: 400, headers: corsHeaders }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: `Chunk ${chunkIndex + 1}/${totalChunks} received`,
        uploadUrl: uploadId,
        chunkIndex,
        totalChunks,
        fileName
      }, { headers: corsHeaders });
    }
  } catch (error: any) {
    console.error('[API/CHUNKED-UPLOAD] Unexpected error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message || 'Unknown error'}` },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}

// Configure API route with correct settings for Edge Runtime
export const config = {
  runtime: 'edge',
}; 