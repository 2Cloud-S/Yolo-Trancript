import { redirect } from 'next/navigation';
import { Database } from '@/types/supabase';
import { UserProfile } from './components/UserProfile';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  
  // Get the user and explicitly check with getUser instead of just getSession
  const { data: { user }, error } = await supabase.auth.getUser();

  // Log authentication status for debugging
  console.log("[SettingsPage] Auth check result:", { hasUser: !!user, error: error?.message });

  if (!user || error) {
    console.log("[SettingsPage] Redirecting to login - No authenticated user found");
    return redirect('/auth/login');
  }
  
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings
        </p>
      </div>
      
      <div className="space-y-10">
        {/* User Profile Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Profile</h3>
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <UserProfile user={user} />
          </div>
        </div>
      </div>
    </div>
  );
} 