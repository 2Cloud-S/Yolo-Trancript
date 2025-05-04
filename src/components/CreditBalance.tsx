'use client';

import { useEffect, useState } from 'react';
import { CircleOff, RefreshCw, CreditCard } from 'lucide-react';
import Link from 'next/link';

type CreditBalanceProps = {
  showBuyButton?: boolean;
};

export default function CreditBalance({ showBuyButton = true }: CreditBalanceProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/credits');
      
      if (!response.ok) {
        throw new Error('Failed to fetch credit balance');
      }
      
      const data = await response.json();
      setCredits(data.credits_balance || 0);
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError('Could not load credit balance');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm font-medium">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Loading credits...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-500">
        <CircleOff className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-md shadow-sm">
      <div className="flex items-center space-x-2">
        <CreditCard className="h-5 w-5 text-purple-500" />
        <span className="font-medium">
          {credits !== null ? (
            <>
              <span className="text-lg">{credits}</span> <span className="text-sm text-gray-600">credits</span>
            </>
          ) : (
            'No credits'
          )}
        </span>
      </div>
      
      {showBuyButton && (
        <Link 
          href="/pricing" 
          className="px-3 py-1 text-sm font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors"
        >
          Buy Credits
        </Link>
      )}
    </div>
  );
} 