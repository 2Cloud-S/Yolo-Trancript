import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    // Create a server-side Supabase client
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    
    // Authenticate the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    // Get duration if available
    const durationSeconds = formData.get('duration_seconds');
    const duration = durationSeconds ? parseFloat(durationSeconds.toString()) : null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Generate a unique filename
    const filename = `${uuidv4()}-${file.name}`;
    
    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('audio-uploads')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }
    
    // Get a public URL for the file
    const { data: publicUrl } = supabaseAdmin
      .storage
      .from('audio-uploads')
      .getPublicUrl(filename);
    
    // Save the file metadata and duration to the database
    const { data: fileRecord, error: dbError } = await supabaseAdmin
      .from('files')
      .insert({
        user_id: user.id,
        file_name: file.name,
        storage_path: filename,
        size_bytes: file.size,
        type: file.type,
        public_url: publicUrl.publicUrl,
        duration: duration || 0,
        upload_method: 'direct'
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save file metadata' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      id: fileRecord.id,
      name: file.name,
      type: file.type, 
      size: file.size,
      url: publicUrl.publicUrl,
      duration: duration || 0
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 