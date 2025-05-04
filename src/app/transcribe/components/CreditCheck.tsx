'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the CreditPurchaseButton
const CreditPurchaseButton = dynamic(
  () => import('@/components/CreditPurchaseButton'),
  { ssr: false }
);

interface CreditCheckProps {
  durationInSeconds: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CreditCheck({ durationInSeconds, onConfirm, onCancel }: CreditCheckProps) {
  const [loading, setLoading] = useState(true);
  const [hasCredits, setHasCredits] = useState(false);
  const [creditsNeeded, setCreditsNeeded] = useState(0);
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [error, setError] = useState('');

  // Calculate credits needed based on audio duration (1 credit = 6 minutes)
  const calculateCreditsNeeded = (seconds: number) => {
    return Math.ceil(seconds / 360); // 6 minutes = 360 seconds
  };

  useEffect(() => {
    const checkCredits = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Calculate needed credits
        const needed = calculateCreditsNeeded(durationInSeconds);
        setCreditsNeeded(needed);
        
        // Check if user has enough credits
        const response = await fetch('/api/credits/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'check',
            creditsNeeded: needed,
          }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setHasCredits(data.hasEnoughCredits);
          setCreditsBalance(data.creditsBalance || 0);
        } else {
          setError(data.error || 'Failed to check credits');
          setHasCredits(false);
        }
      } catch (err) {
        console.error('Error checking credits:', err);
        setError('Failed to check credits. Please try again.');
        setHasCredits(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkCredits();
  }, [durationInSeconds]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          <p className="text-center text-gray-600">Checking your available credits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-center text-red-600">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasCredits) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="h-8 w-8 text-amber-500" />
          <h3 className="text-lg font-bold text-gray-900">Not Enough Credits</h3>
          <p className="text-center text-gray-600">
            You need {creditsNeeded} credits to transcribe this audio, but you only have {creditsBalance} credits.
          </p>
          <div className="w-full space-y-3">
            <Link
              href="/pricing"
              className="block w-full px-4 py-2 bg-amber-500 text-center text-white rounded-md hover:bg-amber-600"
            >
              View All Plans
            </Link>
            <CreditPurchaseButton
              priceId={process.env.NEXT_PUBLIC_DEFAULT_PRICE_ID || "pri_01jtdj3q5xd7v2gvj87yfz57ym"} // Pro pack (100 credits)
              packageName="Pro"
              className="block w-full px-4 py-2 bg-gray-900 text-center text-white rounded-md hover:bg-gray-800"
              text="Buy 100 Credits Now"
            />
            <button
              onClick={onCancel}
              className="block w-full px-4 py-2 bg-gray-200 text-center text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <div className="flex flex-col items-center space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Ready to Transcribe</h3>
        <p className="text-center text-gray-600">
          This transcription will use {creditsNeeded} credits from your balance.
          You have {creditsBalance} credits available.
        </p>
        <div className="flex space-x-4 w-full">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Confirm & Transcribe
          </button>
        </div>
      </div>
    </div>
  );
} 