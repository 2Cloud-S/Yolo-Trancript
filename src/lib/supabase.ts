import { createClient } from '@supabase/supabase-js';
import { CustomVocabulary } from '@/types/transcription';

// Provide default values for development to prevent crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Log Supabase configuration
console.log('Initializing Supabase client with:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  isDevelopment: process.env.NODE_ENV === 'development'
});

// Instead of throwing an error, log a warning
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  }
});

// Log successful client creation
console.log('Supabase client initialized successfully');

// Types for database
export type Transcript = {
  id: string;
  user_id: string;
  file_name: string;
  transcript_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  text?: string;
  duration?: number;
  file_size?: number;
  file_type?: string;
  error_message?: string;
  transcription_text?: string;
  metadata?: any;
};

// Function to save transcript metadata to Supabase
export async function saveTranscript(data: Omit<Transcript, 'id' | 'created_at' | 'updated_at'>) {
  console.log('Saving transcript to Supabase:', data);
  try {
  const { data: transcript, error } = await supabase
      .from('transcriptions')
    .insert(data)
    .select()
    .single();

    if (error) {
      console.error('Error saving transcript:', error);
      throw error;
    }
    console.log('Successfully saved transcript:', transcript);
  return transcript;
  } catch (err) {
    console.error('Unexpected error in saveTranscript:', err);
    throw err;
  }
}

// Function to get all transcripts for a user
export async function getUserTranscripts(userId: string) {
  console.log('Fetching transcripts for user:', userId);
  try {
  const { data, error } = await supabase
      .from('transcriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user transcripts:', error);
      throw error;
    }
    console.log('Retrieved user transcripts:', data);
  return data as Transcript[];
  } catch (err) {
    console.error('Unexpected error in getUserTranscripts:', err);
    throw err;
  }
}

// Function to get a single transcript
export async function getTranscript(id: string) {
  console.log('Fetching transcript:', id);
  try {
  const { data, error } = await supabase
      .from('transcriptions')
    .select('*')
    .eq('id', id)
    .single();

    if (error) {
      console.error('Error fetching transcript:', error);
      throw error;
    }
    console.log('Retrieved transcript:', data);
  return data as Transcript;
  } catch (err) {
    console.error('Unexpected error in getTranscript:', err);
    throw err;
  }
}

// Function to update transcript status and text
export async function updateTranscript(id: string, updates: Partial<Transcript>) {
  console.log('Updating transcript:', { id, updates });
  try {
  const { data, error } = await supabase
      .from('transcriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

    if (error) {
      console.error('Error updating transcript:', error);
      throw error;
    }
    console.log('Successfully updated transcript:', data);
  return data as Transcript;
  } catch (err) {
    console.error('Unexpected error in updateTranscript:', err);
    throw err;
  }
}

// Custom Vocabulary Functions
export async function getCustomVocabularies(userId: string): Promise<CustomVocabulary[]> {
  try {
    const { data, error } = await supabase
      .from('custom_vocabulary')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting custom vocabularies:', error);
    throw error;
  }
}

export async function getDefaultVocabulary(userId: string): Promise<CustomVocabulary | null> {
  try {
    const { data, error } = await supabase
      .from('custom_vocabulary')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data || null;
  } catch (error) {
    console.error('Error getting default vocabulary:', error);
    throw error;
  }
}

export async function createCustomVocabulary(
  userId: string, 
  name: string, 
  terms: string[], 
  isDefault = false
): Promise<CustomVocabulary> {
  try {
    // If setting this one as default, unset any existing default
    if (isDefault) {
      await supabase
        .from('custom_vocabulary')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('custom_vocabulary')
      .insert({
        user_id: userId,
        name,
        terms,
        is_default: isDefault
      })
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating custom vocabulary:', error);
    throw error;
  }
}

export async function updateCustomVocabulary(
  id: string,
  updates: Partial<Omit<CustomVocabulary, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<CustomVocabulary> {
  try {
    // If setting this one as default, get the user ID first
    if (updates.is_default) {
      const { data: vocab } = await supabase
        .from('custom_vocabulary')
        .select('user_id')
        .eq('id', id)
        .single();
        
      if (vocab) {
        await supabase
          .from('custom_vocabulary')
          .update({ is_default: false })
          .eq('user_id', vocab.user_id)
          .eq('is_default', true);
      }
    }

    const { data, error } = await supabase
      .from('custom_vocabulary')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating custom vocabulary:', error);
    throw error;
  }
}

export async function deleteCustomVocabulary(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('custom_vocabulary')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting custom vocabulary:', error);
    throw error;
  }
}

export async function getCustomVocabularyById(id: string): Promise<CustomVocabulary | null> {
  try {
    const { data, error } = await supabase
      .from('custom_vocabulary')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting custom vocabulary by ID:', error);
    throw error;
  }
} 