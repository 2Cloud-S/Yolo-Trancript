'use client';

import { useState, useEffect } from 'react';

export default function EnvWarning() {
  const [showWarning, setShowWarning] = useState(false);
  
  useEffect(() => {
    // Check if we're missing environment variables by making a test request
    async function checkEnvVariables() {
      try {
        const response = await fetch('/api/assemblyToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        // If we get an error about missing environment variables, show warning
        if (data.error && (
          data.error.includes('API key not configured') || 
          data.message?.includes('environment variable')
        )) {
          setShowWarning(true);
        }
      } catch (error) {
        console.error('Error checking environment variables:', error);
      }
    }
    
    checkEnvVariables();
  }, []);
  
  if (!showWarning) return null;
  
  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">Environment Setup Required</h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              Your app is missing some environment variables:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Create a <code className="bg-amber-100 px-1 py-0.5 rounded">.env.local</code> file in the project root</li>
              <li>Add your Supabase URL: <code className="bg-amber-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code></li>
              <li>Add your Supabase Anon Key: <code className="bg-amber-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
              <li>Add your AssemblyAI API Key: <code className="bg-amber-100 px-1 py-0.5 rounded">ASSEMBLY_API_KEY</code></li>
            </ul>
            <p className="mt-2">
              Then restart your development server.
            </p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="text-sm font-medium text-amber-800 hover:text-amber-600"
              onClick={() => setShowWarning(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 