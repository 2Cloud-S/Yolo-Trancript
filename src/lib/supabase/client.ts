import { createBrowserClient } from '@supabase/ssr';

// Client-side Supabase client for use in Client Components
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Export singleton instance for backward compatibility
const supabase = createClient();

export { supabase }; 