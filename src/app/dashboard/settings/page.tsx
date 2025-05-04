import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';
import { Database } from '@/types/supabase';
import { CreditCard } from 'lucide-react';
import { UserProfile } from './components/UserProfile';
import { CreditHistoryTable } from './components/CreditHistoryTable';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return redirect('/auth/login');
  }
  
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and credits
        </p>
      </div>
      
      <div className="space-y-10">
        {/* User Profile Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Profile</h3>
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <UserProfile user={session.user} />
          </div>
        </div>
        
        {/* Credit History Section */}
        <div>
          <div className="flex items-center mb-4">
            <CreditCard className="mr-2 h-5 w-5" />
            <h3 className="text-xl font-semibold">Credit History</h3>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <CreditHistoryTable />
          </div>
        </div>
      </div>
    </div>
  );
} 