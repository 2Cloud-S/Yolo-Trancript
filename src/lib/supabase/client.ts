import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Get configuration from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Log configuration (without revealing keys)
console.log(`[Supabase] Initializing client with URL: ${supabaseUrl} (key provided: ${!!supabaseAnonKey})`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables! Check your .env.local file.');
}

// Create a client with default settings for the browser
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'  // Use PKCE flow for better security
    },
    global: {
      headers: {
        'x-app-name': 'yolo-transcript' 
      }
    }
  }
);

// Add auth state change listener to log auth events
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`[Supabase] Auth state changed: ${event}`, session ? 'User authenticated' : 'No session');
  
  // Handle token refresh errors
  if (event === 'TOKEN_REFRESHED') {
    console.log('[Supabase] Session token refreshed successfully');
  }
  
  // Handle signed out state, which can cause fetch errors
  if (event === 'SIGNED_OUT') {
    console.log('[Supabase] User signed out - subsequent API calls will fail until authenticated');
  }
});

// Log successful creation
console.log('[Supabase] Client created successfully');

// Export a function to get the client (useful for components that need to refresh the client)
export function getClient() {
  return supabase;
}

export default supabase; 