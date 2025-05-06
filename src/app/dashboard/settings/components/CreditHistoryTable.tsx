'use client';

import { useState, useEffect } from 'react';
import { CreditCard, DownloadCloud, ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Import the direct client

// Define simple UI components to avoid needing external imports
const Table = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
    {children}
  </table>
);

const TableHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <thead className={`bg-gray-50 ${className}`}>
    {children}
  </thead>
);

const TableBody = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
    {children}
  </tbody>
);

const TableRow = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <tr className={className}>
    {children}
  </tr>
);

const TableHead = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

const TableCell = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
    {children}
  </td>
);

// Tabs components
const Tabs = ({ children, value, onValueChange, className = '' }: { 
  children: React.ReactNode; 
  value: string; 
  onValueChange: (value: string) => void;
  className?: string;
}) => (
  <div className={`w-full ${className}`}>
    {children}
  </div>
);

const TabsList = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex mb-4 border-b ${className}`}>
    {children}
  </div>
);

const TabsTrigger = ({ children, value, className = '' }: { 
  children: React.ReactNode; 
  value: string; 
  className?: string;
}) => {
  const isActive = location.hash === `#${value}` || (!location.hash && value === 'purchases');
  
  return (
    <button 
      className={`px-4 py-2 ${isActive ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'} ${className}`}
      onClick={() => {
        history.pushState(null, '', `#${value}`);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value, className = '' }: { 
  children: React.ReactNode; 
  value: string; 
  className?: string;
}) => {
  const isActive = location.hash === `#${value}` || (!location.hash && value === 'purchases');
  
  return (
    <div className={`${isActive ? 'block' : 'hidden'} ${className}`}>
      {children}
    </div>
  );
};

type Transaction = {
  id: string;
  created_at: string;
  credits_added: number;
  amount: number;
  currency: string;
  package_name: string;
  status: string;
};

type Usage = {
  id: string;
  used_at: string;
  credits_used: number;
  description: string;
  transcription_id: string | null;
};

export function CreditHistoryTable() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [usageHistory, setUsageHistory] = useState<Usage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('purchases');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = location.hash.replace('#', '');
      if (hash === 'purchases' || hash === 'usage') {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initialize based on current hash

    // Fetch credit history on mount
    fetchCreditHistory();
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Function to fetch credit history data
    const fetchCreditHistory = async () => {
      setLoading(true);
      setError(null);
      
      try {
      // First get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      if (!user) {
        setError('Please sign in to view your credit history');
        setLoading(false);
        return;
      }
      
      console.log('Fetching credit history for user:', user.id);
      
      // Fetch transactions and usage data in parallel
      const [transactionsResponse, usageResponse] = await Promise.all([
        supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
          
        supabase
          .from('credit_usage')
          .select('*, transcriptions(file_name)')
          .eq('user_id', user.id)
          .order('used_at', { ascending: false })
      ]);
        
      if (transactionsResponse.error) {
        console.error('Error fetching transactions:', transactionsResponse.error);
        throw new Error(`Failed to fetch transactions: ${transactionsResponse.error.message}`);
        }
        
      if (usageResponse.error) {
        console.error('Error fetching usage:', usageResponse.error);
        throw new Error(`Failed to fetch usage: ${usageResponse.error.message}`);
      }
        
      setTransactions(transactionsResponse.data || []);
      setUsageHistory(usageResponse.data || []);
      } catch (err: any) {
        console.error('Error fetching credit history:', err);
        setError(err.message || 'Failed to load credit history');
      } finally {
        setLoading(false);
      }
    };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            fetchCreditHistory();
          }}
          className="text-red-800 underline mt-2 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="purchases" className="border rounded-md">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No purchase history</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't purchased any credits yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>{transaction.package_name}</TableCell>
                    <TableCell className="text-green-600">
                      <span className="flex items-center">
                        <ArrowUp className="mr-1 h-4 w-4" />
                        +{transaction.credits_added}
                      </span>
                    </TableCell>
                    <TableCell>
                      {transaction.currency === 'USD' ? '$' : ''}
                      {transaction.amount}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}
                      >
                        {transaction.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        
        <TabsContent value="usage" className="border rounded-md">
          {usageHistory.length === 0 ? (
            <div className="text-center py-12">
              <DownloadCloud className="h-12 w-12 mx-auto text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No usage history</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't used any credits yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Credits Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageHistory.map((usage) => (
                  <TableRow key={usage.id}>
                    <TableCell className="font-medium">{formatDate(usage.used_at)}</TableCell>
                    <TableCell>
                      {usage.transcription_id ? (
                        <a 
                          href={`/dashboard/transcription/${usage.transcription_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {usage.description}
                        </a>
                      ) : (
                        usage.description
                      )}
                    </TableCell>
                    <TableCell className="text-red-600">
                      <span className="flex items-center">
                        <ArrowDown className="mr-1 h-4 w-4" />
                        -{usage.credits_used}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 