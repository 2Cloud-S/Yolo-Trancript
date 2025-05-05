'use client';

import { useState, useEffect } from 'react';
import { initPaddle } from '@/lib/paddle/client';
import supabase from '@/lib/supabase/client';
import Link from 'next/link';

export default function PaddleDiagnosticPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [paddleStatus, setPaddleStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const runDiagnostics = async () => {
      setIsLoading(true);
      try {
        // Get environment variables
        const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'Not set';
        const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
        const tokenExists = !!clientToken;
        
        // Check price IDs
        const priceStarter = process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || '';
        const pricePro = process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || '';
        const priceCreator = process.env.NEXT_PUBLIC_PADDLE_PRICE_CREATOR || '';
        const pricePower = process.env.NEXT_PUBLIC_PADDLE_PRICE_POWER || '';
        
        // Check user authentication
        const { data } = await supabase.auth.getUser();
        const currentUser = data.user;
        setUser(currentUser);
        
        // Try to initialize Paddle
        let paddleInitialized = false;
        let paddleError = null;
        
        try {
          const paddle = await initPaddle();
          paddleInitialized = !!paddle;
        } catch (error: any) {
          paddleError = error.message || 'Failed to initialize Paddle';
        }
        
        // Set diagnostic info
        setDiagnosticInfo({
          environment: {
            paddleEnvironment: environment,
            tokenExists,
            nodeEnv: process.env.NODE_ENV || 'Not set',
          },
          priceIds: {
            starter: {
              value: priceStarter,
              isValid: priceStarter.startsWith('pri_'),
            },
            pro: {
              value: pricePro,
              isValid: pricePro.startsWith('pri_'),
            },
            creator: {
              value: priceCreator,
              isValid: priceCreator.startsWith('pri_'),
            },
            power: {
              value: pricePower,
              isValid: pricePower.startsWith('pri_'),
            },
          },
          authentication: {
            isAuthenticated: !!currentUser,
            userEmail: currentUser?.email || 'Not authenticated',
          },
          paddle: {
            initialized: paddleInitialized,
            error: paddleError,
          }
        });
        
        // Determine overall status
        if (paddleInitialized && tokenExists && environment !== 'Not set') {
          setPaddleStatus('success');
        } else {
          setPaddleStatus('error');
          setErrorMessage('Paddle integration issues detected. See details below.');
        }
      } catch (error: any) {
        setPaddleStatus('error');
        setErrorMessage(error.message || 'An error occurred during diagnostics');
      } finally {
        setIsLoading(false);
      }
    };
    
    runDiagnostics();
  }, []);

  const renderStatusBadge = (status: 'success' | 'error' | 'warning') => {
    const colors = {
      success: 'bg-green-100 text-green-800 border-green-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]} border`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin h-8 w-8 border-4 border-gray-900 border-opacity-25 rounded-full border-t-gray-900"></div>
        <p className="ml-2 text-gray-600">Running diagnostics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Paddle Integration Diagnostics</h1>
            <div>
              {paddleStatus === 'success' ? renderStatusBadge('success') : renderStatusBadge('error')}
            </div>
          </div>
          {errorMessage && (
            <p className="mt-2 text-red-600">{errorMessage}</p>
          )}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Environment Information */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">Environment</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Paddle Environment</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {diagnosticInfo.environment.paddleEnvironment}
                    {' '}
                    {diagnosticInfo.environment.paddleEnvironment === 'Not set' && renderStatusBadge('error')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Paddle Client Token</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {diagnosticInfo.environment.tokenExists ? 'Exists' : 'Missing'}{' '}
                    {!diagnosticInfo.environment.tokenExists && renderStatusBadge('error')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Node Environment</p>
                  <p className="mt-1 text-sm text-gray-900">{diagnosticInfo.environment.nodeEnv}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Paddle Initialization</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {diagnosticInfo.paddle.initialized ? 'Success' : 'Failed'}{' '}
                    {!diagnosticInfo.paddle.initialized && renderStatusBadge('error')}
                  </p>
                  {diagnosticInfo.paddle.error && (
                    <p className="mt-1 text-sm text-red-600">{diagnosticInfo.paddle.error}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Price IDs */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">Price IDs</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(diagnosticInfo.priceIds).map(([key, info]: [string, any]) => (
                  <div key={key} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                      <p className="mt-1 text-sm font-mono text-gray-900">
                        {info.value || 'Not set'}
                        {' '}
                        {!info.value && renderStatusBadge('error')}
                        {info.value && !info.isValid && renderStatusBadge('warning')}
                      </p>
                    </div>
                    <div>
                      {info.isValid ? (
                        <span className="text-xs text-green-600">Valid format</span>
                      ) : (
                        <span className="text-xs text-red-600">Invalid format (should start with 'pri_')</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Authentication */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">Authentication</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Authentication Status</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {diagnosticInfo.authentication.isAuthenticated ? 'Authenticated' : 'Not authenticated'}{' '}
                    {!diagnosticInfo.authentication.isAuthenticated && renderStatusBadge('warning')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">User Email</p>
                  <p className="mt-1 text-sm text-gray-900">{diagnosticInfo.authentication.userEmail}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">Troubleshooting Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Missing or Invalid Price IDs</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Ensure you have properly set up your environment variables in .env.local file with the correct Paddle price IDs.
                  </p>
                  <Link href="/ENV_SETUP.md" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500">
                    View ENV Setup Documentation
                  </Link>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Paddle Initialization Failed</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Check that your NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is correctly set and that you're using the right environment (sandbox or production).
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Not Authenticated</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    You must be logged in to complete a purchase. Try logging out and back in if you're experiencing issues.
                  </p>
                  {!diagnosticInfo.authentication.isAuthenticated && (
                    <Link href="/auth/login" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500">
                      Go to Login Page
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Documentation Links */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">Documentation</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Environment Variables Setup</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Learn how to properly set up your environment variables for Paddle integration.
                  </p>
                  <Link href="/ENV_SETUP.md" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500">
                    View ENV Setup Documentation
                  </Link>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Paddle Troubleshooting Guide</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Comprehensive guide for resolving common Paddle checkout issues.
                  </p>
                  <Link href="/PADDLE_TROUBLESHOOTING.md" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500">
                    View Troubleshooting Guide
                  </Link>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Paddle Documentation</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Official Paddle documentation for developers.
                  </p>
                  <a 
                    href="https://developer.paddle.com/build/checkout/build-overlay-checkout" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500"
                  >
                    Paddle Developer Docs
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 