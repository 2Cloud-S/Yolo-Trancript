'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import the CreditPurchaseButton component
const CreditPurchaseButton = dynamic(
  () => import('@/components/CreditPurchaseButton'),
  { ssr: false }
);

// Credit packages information
const CREDIT_PACKAGES = {
  'Starter': {
    credits: '50',
    price: '$5',
    hours: '5',
  },
  'Pro': {
    credits: '100',
    price: '$9',
    hours: '10',
  },
  'Creator': {
    credits: '250',
    price: '$20',
    hours: '25',
  },
  'Power': {
    credits: '500',
    price: '$35',
    hours: '50',
  }
};

export default function CheckoutPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const priceId = searchParams.get('priceId');
  const packageName = searchParams.get('packageName');
  
  // Get the package details based on packageName
  const packageDetails = packageName ? CREDIT_PACKAGES[packageName as keyof typeof CREDIT_PACKAGES] : null;

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If no user, redirect to login with return URL
      if (!user) {
        const returnUrl = encodeURIComponent(`/dashboard/checkout?priceId=${priceId}&packageName=${packageName}`);
        router.push(`/auth/login?returnUrl=${returnUrl}`);
        return;
      }
      
      setUser(user);
      setLoading(false);
    }
    
    getUser();
  }, [router, priceId, packageName]);
  
  // Validation - check if we have all required data
  if (!loading && (!priceId || !packageName || !packageDetails)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Checkout Request</h2>
          <p className="text-gray-600 mb-6">
            The checkout information is incomplete or invalid. Please return to the pricing page and try again.
          </p>
          <div className="space-y-3">
            <Link 
              href="/pricing" 
              className="w-full block text-center bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800"
            >
              Return to Pricing
            </Link>
            <Link 
              href="/dashboard/paddle-diagnostic" 
              className="w-full block text-center bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
            >
              Run Diagnostics
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h1>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">Purchase Summary</h2>
              <p className="mt-2 text-gray-600">
                You're about to purchase the {packageName} credit package.
              </p>
            </div>
            
            <div className="p-6 bg-gray-50">
              <div className="flex justify-between mb-4">
                <span className="font-medium text-gray-700">Package:</span>
                <span className="text-gray-900 font-bold">{packageName}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="font-medium text-gray-700">Credits:</span>
                <span className="text-gray-900">{packageDetails?.credits || '-'} credits</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="font-medium text-gray-700">Transcription Time:</span>
                <span className="text-gray-900">{packageDetails?.hours || '-'} hours</span>
              </div>
              <div className="flex justify-between mb-6 pb-6 border-b border-gray-200">
                <span className="font-medium text-gray-700">Price:</span>
                <span className="text-gray-900 font-bold">{packageDetails?.price || '-'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <Link 
                  href="/pricing" 
                  className="text-gray-600 hover:text-gray-800"
                >
                  Return to pricing
                </Link>
                <CreditPurchaseButton
                  priceId={priceId || ''}
                  packageName={packageName || ''}
                  className="w-40 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                  mode="direct"
                >
                  Complete Purchase
                </CreditPurchaseButton>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Important Notes:</h3>
              <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                <li>Credits never expire and can be used at any time</li>
                <li>1 credit equals approximately 6 minutes of transcription time</li>
                <li>You'll receive a receipt via email after your purchase</li>
                <li>Credits will be added to your account immediately after successful payment</li>
              </ul>
              <p className="mt-4 text-sm text-gray-600">
                Having trouble with checkout? <Link href="/dashboard/paddle-diagnostic" className="text-blue-600 hover:underline">Run diagnostics</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 