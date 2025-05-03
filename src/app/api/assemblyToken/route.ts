import { AssemblyAI } from 'assemblyai';

export async function POST() {
  const apiKey = process.env.ASSEMBLY_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ AssemblyAI API key is missing. Please set ASSEMBLY_API_KEY in your .env.local file.');
    return Response.json({ 
      error: 'AssemblyAI API key not configured', 
      message: 'Please add the ASSEMBLY_API_KEY environment variable to your .env.local file.'
    }, { status: 500 });
  }
  
  try {
    const assemblyClient = new AssemblyAI({
      apiKey: apiKey
    });

    const token = await assemblyClient.realtime.createTemporaryToken({
      expires_in: 3600, // 1 hour
    });

    return Response.json({ token });
  } catch (error) {
    console.error('Error creating AssemblyAI token:', error);
    return Response.json({ 
      error: 'Failed to create AssemblyAI token',
      message: 'An error occurred while creating the token.'
    }, { status: 500 });
  }
} 