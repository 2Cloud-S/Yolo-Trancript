/**
 * Direct client-side uploads to AssemblyAI
 * This bypasses Vercel's 4.5MB serverless function payload limit
 */

/**
 * Upload a file directly to AssemblyAI from the client
 * @param file The file to upload
 * @param apiKey AssemblyAI API key
 * @returns Upload URL from AssemblyAI
 */
export async function uploadFileDirectly(file: File, apiKey: string): Promise<string> {
  try {
    console.log('Starting direct upload to AssemblyAI');
    console.log('File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    // Use the simple direct upload method that works for all file sizes
    // AssemblyAI handles chunking internally
    const response = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: file // Send the entire file directly
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Upload error response:', errorBody);
      throw new Error(`AssemblyAI upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.upload_url) {
      throw new Error('No upload URL returned from AssemblyAI');
    }
    
    console.log('Upload successful, URL:', result.upload_url);
    return result.upload_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
} 