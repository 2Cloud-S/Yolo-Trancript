import { AssemblyAI } from 'assemblyai';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ASSEMBLY_API_KEY;
    
    if (!apiKey) {
      return Response.json({ error: 'API key not found' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const assemblyClient = new AssemblyAI({
      apiKey: apiKey
    });

    // Get the bytes from the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload the file to AssemblyAI
    const uploadUrl = await assemblyClient.files.upload(buffer);

    return Response.json({ url: uploadUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: 'Failed to upload file' }, { status: 500 });
  }
} 