'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import YoloMascot from '@/components/YoloMascot';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Unknown error occurred';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center">
          <YoloMascot pose="coding" size="md" className="mx-auto" />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Authentication Error</h1>
          <p className="mt-2 text-gray-600">
            We encountered a problem during authentication.
          </p>
        </div>

        <div className="mt-8 p-4 bg-red-50 rounded-md border border-red-200">
          <p className="text-sm text-red-800 font-mono">{error}</p>
        </div>

        <div className="flex flex-col space-y-4 mt-8">
          <Link 
            href="/login" 
            className="w-full flex justify-center py-2 px-4 border border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#FFD60A] text-black font-medium hover:bg-[#e6c209] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFD60A]"
          >
            Return to Login
          </Link>
          
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white text-black font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFD60A]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 