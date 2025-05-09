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
  try {
    // Extract the authorization header for authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }
    
    // Use the token to authenticate the user
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Authentication failed:", userError);
      return NextResponse.json({ error: 'Unauthorized: ' + (userError?.message || 'Invalid token') }, { status: 401 });
    }

    // Get file from request body stream
    if (!request.body) {
      return NextResponse.json({ error: 'No file data received' }, { status: 400 });
    }

    // Create readable stream from request body
    const fileStream = request.body;
    const contentType = request.headers.get('content-type') || 'audio/mpeg';
    const fileName = request.headers.get('x-file-name') || 'unknown.mp3';
    
    console.log(`Starting stream upload for file: ${fileName}, content-type: ${contentType}`);

    // Stream directly to AssemblyAI
    try {
      // Upload the file stream directly to AssemblyAI
      const uploadUrl = await assemblyai.files.upload(fileStream);
      
      console.log('File successfully streamed to AssemblyAI:', uploadUrl);
      
      return NextResponse.json({
        url: uploadUrl,
        fileName: fileName,
        userId: user.id,
        success: true
      });
    } catch (streamError: any) {
      console.error('Stream upload error:', streamError);
      return NextResponse.json(
        { error: `Stream upload failed: ${streamError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('General error in stream handler:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

// Configure API route to handle streaming
export const config = {
  runtime: 'edge',
  // Max file size of 100MB (in bytes)
  api: {
    bodyParser: false,
    responseLimit: '100mb',
  },
}; 