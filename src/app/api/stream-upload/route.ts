import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AssemblyAI } from 'assemblyai';

// Initialize AssemblyAI client
const assemblyai = new AssemblyAI({
  apiKey: process.env.ASSEMBLY_API_KEY!
});

// Create a Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  console.log('[STREAM-UPLOAD] Request received, headers:', {
    contentType: request.headers.get('content-type'),
    fileName: request.headers.get('x-file-name'),
    hasAuth: !!request.headers.get('authorization'),
    method: request.method,
    url: request.url
  });

  try {
    // Extract the authorization header for authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[STREAM-UPLOAD] Authentication error: Missing or invalid authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    
    // Use the token to authenticate the user
    const token = authHeader.split(' ')[1];
    console.log('[STREAM-UPLOAD] Attempting to authenticate user with token (length):', token.length);
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[STREAM-UPLOAD] Authentication failed:', userError);
      return NextResponse.json({ error: 'Unauthorized: ' + (userError?.message || 'Invalid token') }, { status: 401 });
    }
    
    console.log('[STREAM-UPLOAD] User authenticated successfully:', user.id);

    // Get file from request body stream
    if (!request.body) {
      console.error('[STREAM-UPLOAD] Request body is empty or undefined');
      return NextResponse.json({ error: 'No file data received' }, { status: 400 });
    }

    // Create readable stream from request body
    const fileStream = request.body;
    const contentType = request.headers.get('content-type') || 'audio/mpeg';
    const fileName = request.headers.get('x-file-name') || 'unknown.mp3';
    
    console.log(`[STREAM-UPLOAD] Starting stream upload for file: ${fileName}, content-type: ${contentType}`);

    // Stream directly to AssemblyAI
    try {
      console.log('[STREAM-UPLOAD] Attempting to upload stream to AssemblyAI');
      
      // Upload the file stream directly to AssemblyAI
      const uploadResult = await assemblyai.files.upload(fileStream);
      
      console.log('[STREAM-UPLOAD] File successfully streamed to AssemblyAI:', uploadResult);
      
      return NextResponse.json({
        url: uploadResult,
        fileName: fileName,
        userId: user.id,
        success: true
      });
    } catch (streamError: any) {
      console.error('[STREAM-UPLOAD] Stream upload error details:', {
        message: streamError.message,
        name: streamError.name,
        stack: streamError.stack,
        cause: streamError.cause
      });
      
      return NextResponse.json(
        { error: `Stream upload failed: ${streamError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[STREAM-UPLOAD] General error in stream handler:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

// Configure API route to handle streaming
export const config = {
  api: {
    // Disable default body parsing
    bodyParser: false,
    // Set response size limit
    responseLimit: '100mb',
  },
}; 