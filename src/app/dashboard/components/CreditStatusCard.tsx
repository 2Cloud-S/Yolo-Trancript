'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Create simple UI components instead of importing from external libraries
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 border-b ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-medium ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

const Progress = ({ value = 0, className = '' }: { value?: number; className?: string }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div 
      className={`h-2.5 rounded-full ${className}`} 
      style={{ width: `${value}%` }}
    ></div>
  </div>
);

// Dynamically import the CreditPurchaseButton
const CreditPurchaseButton = dynamic(
  () => import('@/components/CreditPurchaseButton'),
  { ssr: false }
);

export function CreditStatusCard() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch('/api/credits');
        
        if (!response.ok) {
          throw new Error('Failed to fetch credits');
        }
        
        const data = await response.json();
        setCredits(data.credits);
      } catch (err: any) {
        console.error('Error fetching credits:', err);
        setError(err.message || 'Failed to load credits');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCredits();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Credit Balance
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-2 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Credit Balance
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-xs text-blue-600 underline mt-2"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  // Determine status based on credit amount
  let status = 'normal';
  let progressColor = 'bg-blue-600';
  let progressValue = 100;
  
  if (credits !== null) {
    if (credits <= 10) {
      status = 'low';
      progressColor = 'bg-red-500';
      progressValue = 15;
    } else if (credits <= 25) {
      status = 'medium';
      progressColor = 'bg-amber-500';
      progressValue = 40;
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Credit Balance
        </CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">
              {credits ?? 0}
            </p>
            {status === 'low' && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-red-100 text-red-800">
                Low
              </span>
            )}
          </div>
          
          <Progress value={progressValue} className={progressColor} />
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p className="flex items-center">
              <Clock className="mr-1 h-3 w-3" /> 
              {credits} credits ≈ {Math.round((credits || 0) * 6 / 60)} hours
            </p>
            <Link href="/pricing" className="text-blue-600 hover:underline">
              View plans
            </Link>
          </div>
          
          {status === 'low' && (
            <div className="mt-4">
              <CreditPurchaseButton
                priceId="pri_01jtdj3q5xd7v2gvj87yfz57ym" // Pro pack (100 credits)
                packageName="Pro"
                className="w-full px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md hover:bg-gray-800"
              >
                Add more credits
              </CreditPurchaseButton>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 