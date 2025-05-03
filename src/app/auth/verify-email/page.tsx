'use client';

import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import EnvWarning from '@/components/EnvWarning';
import YoloMascot from '@/components/YoloMascot';

export default function VerifyEmail() {
  return (
    <div className="flex flex-col min-h-screen">
      <EnvWarning />
      
      {/* Header */}
      <header className="bg-[#FFD60A] shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 animate-fadeIn relative overflow-hidden group">
                <span className="inline-block transform transition-transform duration-500 ease-in-out group-hover:translate-x-1">
                  Yolo Transcript
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 border-2 border-gray-900 text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="bg-[#FFD60A] p-8 rounded-lg border-2 border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
                <YoloMascot pose="pointing" size="lg" />
                <div className="mt-4 p-4 bg-white rounded border border-gray-900">
                  <p className="text-gray-800 text-sm font-mono">"I've sent a verification email to your inbox. Please check and confirm your account to get started!"</p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-white border-2 border-gray-900 rounded-lg p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-center mb-6">
                  <div className="h-16 w-16 rounded-full bg-[#06B6D4] flex items-center justify-center">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Check your email</h2>
                <p className="text-center text-gray-700 mb-8">
            We've sent you a verification link. Please check your email to confirm your account.
          </p>
        
          <div className="space-y-6">
            <div className="text-center">
                    <p className="text-sm text-gray-600">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>

            <div>
              <Link
                href="/auth/login"
                      className="w-full flex justify-center items-center py-3 px-4 border-2 border-gray-900 rounded-md font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 shadow-[4px_4px_0px_0px_rgba(255,214,10,1)]"
              >
                      <ArrowLeft className="mr-2 h-4 w-4" />
            Return to login
          </Link>
            </div>
          </div>
        </div>
      </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} Yolo Transcript. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="/terms-of-service" className="text-sm text-gray-600 hover:text-gray-900">
                Terms of Service
              </Link>
              <Link href="/privacy-policy" className="text-sm text-gray-600 hover:text-gray-900">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 