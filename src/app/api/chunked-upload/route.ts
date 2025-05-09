import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';

// Initialize AssemblyAI client
const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_API_KEY!
});

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
      return NextResponse.json({ error: 'No chunk provided' }, { status: 400 });
    }
    
    console.log(`[API/CHUNKED-UPLOAD] Processing chunk ${chunkIndex + 1}/${totalChunks} for ${fileName}`);
    
    // This is the first chunk, start a new upload
    if (chunkIndex === 0) {
      try {
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
        });
      } catch (error: any) {
        console.error('[API/CHUNKED-UPLOAD] Error uploading first chunk:', error);
        return NextResponse.json(
          { error: `Failed to upload first chunk: ${error.message || 'Unknown error'}` },
          { status: 500 }
        );
      }
    } 
    // This is the final chunk, we handle it specially
    else if (chunkIndex === totalChunks - 1) {
      console.log(`[API/CHUNKED-UPLOAD] Final chunk received for ${fileName}`);
      
      return NextResponse.json({
        success: true,
        message: 'Final chunk received',
        uploadUrl: uploadId,
        chunkIndex,
        totalChunks,
        fileName,
        complete: true
      });
    } 
    // This is a middle chunk
    else {
      console.log(`[API/CHUNKED-UPLOAD] Middle chunk ${chunkIndex + 1}/${totalChunks} received`);
      
      return NextResponse.json({
        success: true,
        message: `Chunk ${chunkIndex + 1}/${totalChunks} received`,
        uploadUrl: uploadId,
        chunkIndex,
        totalChunks,
        fileName
      });
    }
  } catch (error: any) {
    console.error('[API/CHUNKED-UPLOAD] Unexpected error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// Configure API route with increased limits
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
};

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
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