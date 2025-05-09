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
  // For files smaller than 5MB, use simple upload
  if (file.size <= 5 * 1024 * 1024) {
    return uploadSimple(file, apiKey);
  }
  
  // For larger files, implement chunked upload
  return uploadChunked(file, apiKey);
}

/**
 * Simple direct upload for smaller files
 */
async function uploadSimple(file: File, apiKey: string): Promise<string> {
  try {
    console.log('Starting simple upload to AssemblyAI');
    
    const response = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: file
    });
    
    if (!response.ok) {
      throw new Error(`AssemblyAI upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Simple upload successful:', result.upload_url);
    return result.upload_url;
  } catch (error) {
    console.error('Simple upload error:', error);
    throw error;
  }
}

/**
 * Chunked upload for larger files
 */
async function uploadChunked(file: File, apiKey: string): Promise<string> {
  try {
    console.log('Starting chunked upload to AssemblyAI');
    
    // Step 1: Create upload
    const createResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_name: file.name,
        file_size: file.size,
      })
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to initiate chunked upload: ${createResponse.status} ${createResponse.statusText}`);
    }
    
    const { upload_url, status } = await createResponse.json();
    
    if (status !== 'created') {
      throw new Error(`Failed to create upload: ${status}`);
    }
    
    // Step 2: Upload chunks
    const chunkSize = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const chunk = file.slice(start, end);
      
      // Upload this chunk
      const chunkResponse = await fetch(`${upload_url}?part_number=${i + 1}`, {
        method: 'PUT',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: chunk
      });
      
      if (!chunkResponse.ok) {
        throw new Error(`Failed to upload chunk ${i + 1}: ${chunkResponse.status} ${chunkResponse.statusText}`);
      }
      
      console.log(`Uploaded chunk ${i + 1}/${totalChunks}`);
    }
    
    // Step 3: Complete upload
    const completeResponse = await fetch(upload_url, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        total_parts: totalChunks,
      })
    });
    
    if (!completeResponse.ok) {
      throw new Error(`Failed to complete upload: ${completeResponse.status} ${completeResponse.statusText}`);
    }
    
    const completeResult = await completeResponse.json();
    console.log('Chunked upload successful:', completeResult.upload_url);
    return completeResult.upload_url;
  } catch (error) {
    console.error('Chunked upload error:', error);
    throw error;
  }
} 