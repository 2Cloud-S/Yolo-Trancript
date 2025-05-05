'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Sidebar from '@/components/ui/Sidebar';
import { LogOut } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'lg:pl-64' : ''} flex flex-col min-h-screen`}>
        {/* Top Navigation */}
        <nav className="border-b-2 border-gray-900 bg-[#FFD60A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-900 lg:hidden"
                >
                  <span className="sr-only">Open sidebar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Yolo Transcript</h1>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleSignOut}
                  className="ml-3 inline-flex items-center px-4 py-2 border-2 border-gray-900 text-sm font-bold rounded-md text-gray-900 bg-white hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors duration-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
} 