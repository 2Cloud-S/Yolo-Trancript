'use client';

import { useState, useEffect } from 'react';
import { CreditCard, DownloadCloud, ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import supabase from '@/lib/supabase/client';

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

// Add these lines at the top to define the logInfo and logError functions
const logInfo = (message: string) => {
  console.log(`[CreditHistoryTable] ${message}`);
};

const logError = (message: string, error?: any) => {
  console.error(`[CreditHistoryTable] ${message}`, error || '');
};

// Add a function to check if the realtime schema exists
const checkRealtimeSchema = async (client: any, debugSetter?: (value: string | null) => void) => {
  try {
    logInfo('Checking if realtime schema exists...');
    
    // Check if the realtime schema is available
    const { data, error } = await client.rpc('check_realtime_schema_exists', {});
    
    if (error) {
      logError('Error checking realtime schema:', error);
      if (debugSetter) {
        debugSetter(`Realtime schema issue detected: ${error.message}. This might cause subscription errors.`);
      }
      return false;
    }
    
    return !!data;
  } catch (error: any) {
    logError('Error checking realtime schema:', error);
    return false;
  }
};

// Add a function to check if CORS extensions might be causing issues
const checkForCORSBlockers = (debugSetter?: (value: string | null) => void) => {
  // Check if any browser extensions might be blocking requests
  const ua = window.navigator.userAgent;
  const extensionsWarning = 
    "IMPORTANT: Some browser extensions (like 'Allow CORS', 'CORS Unblock', etc.) " +
    "can block API requests. If you're seeing failed fetch errors, try disabling these extensions.";

  logInfo('Checking for potential CORS issues...');
  
  // Check for Chrome
  if (ua.indexOf('Chrome') > -1) {
    // Look for extension clues in error messages
    const consoleErrorListener = (event: ErrorEvent) => {
      if (event.error && event.error.message && (
        event.error.message.includes('blocked by CORS policy') || 
        event.error.message.includes('NetworkError') ||
        event.error.message.includes('Failed to fetch')
      )) {
        logError('Possible CORS issue detected:', extensionsWarning);
        if (debugSetter) {
          debugSetter('Possible CORS issue detected. Try disabling browser extensions.');
        }
      }
    };
    
    window.addEventListener('error', consoleErrorListener);
    
    return () => {
      window.removeEventListener('error', consoleErrorListener);
    };
  }
  
  return () => {}; // Empty cleanup function if not Chrome
};

// Add a function to check if the required tables exist
const checkDatabaseTables = async (client: any) => {
  try {
    logInfo('Checking if required database tables exist...');
    
    // First, check if credit_transactions table exists
    const { data: transactionsMeta, error: transactionsMetaError } = await client
      .from('credit_transactions')
      .select('id')
      .limit(1);
      
    if (transactionsMetaError) {
      logError('Error checking credit_transactions table:', transactionsMetaError);
      return {
        tablesExist: false,
        error: `credit_transactions error: ${transactionsMetaError.message}`,
      };
    }
    
    // Next, check if credit_usage table exists
    const { data: usageMeta, error: usageMetaError } = await client
      .from('credit_usage')
      .select('id')
      .limit(1);
      
    if (usageMetaError) {
      logError('Error checking credit_usage table:', usageMetaError);
      return {
        tablesExist: false,
        error: `credit_usage error: ${usageMetaError.message}`,
      };
    }
    
    return {
      tablesExist: true,
      error: null,
    };
  } catch (error: any) {
    logError('Error checking database tables:', error);
    return {
      tablesExist: false,
      error: error.message,
    };
  }
};

export function CreditHistoryTable() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [usageHistory, setUsageHistory] = useState<Usage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('purchases');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = location.hash.replace('#', '');
      if (hash === 'purchases' || hash === 'usage') {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initialize based on current hash

    // Check for CORS blocking extensions
    const corsBlockerCleanup = checkForCORSBlockers(setDebugInfo);
    
    const fetchCreditHistory = async () => {
      setLoading(true);
      setError(null);
      
      logInfo('Starting credit history fetch...');
      
      try {
        // Check if user is authenticated
        logInfo('Checking authentication...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logError('Session error:', sessionError);
          throw new Error(`Authentication error: ${sessionError.message}`);
        }
        
        if (!session) {
          logError('No session found');
          throw new Error('Authentication required');
        }
        
        logInfo(`Authenticated as user: ${session.user.id}`);
        
        // Fetch the user's transactions
        logInfo('Fetching transactions directly via Supabase client...');
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (transactionsError) {
          logError('Transaction fetch error:', transactionsError);
          throw new Error(`Error fetching transactions: ${transactionsError.message}`);
        }
        
        logInfo(`Successfully fetched ${transactionsData?.length || 0} transactions`);
        
        // Fetch the user's credit usage
        logInfo('Fetching usage history directly via Supabase client...');
        const { data: usageData, error: usageError } = await supabase
          .from('credit_usage')
          .select('*, transcriptions(file_name)')
          .eq('user_id', session.user.id)
          .order('used_at', { ascending: false });
        
        if (usageError) {
          logError('Usage fetch error:', usageError);
          throw new Error(`Error fetching usage: ${usageError.message}`);
        }
        
        logInfo(`Successfully fetched ${usageData?.length || 0} usage records`);
        
        setTransactions(transactionsData || []);
        setUsageHistory(usageData || []);
      } catch (err: any) {
        logError('Error in direct Supabase fetch:', err);
        setDebugInfo(`Direct fetch error: ${err.message}`);
        
        // Fallback to API route if direct Supabase access fails
        logInfo('Falling back to API route...');
        try {
          logInfo('Sending API request to /api/credits...');
          const response = await fetch('/api/credits', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'history',
            }),
            // Add cache: 'no-store' to prevent caching issues
            cache: 'no-store',
          });
          
          logInfo(`API response status: ${response.status}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            logError(`API response error (${response.status}):`, errorText);
            throw new Error(`Failed to fetch credit history: ${response.statusText} - ${errorText}`);
          }
          
          const data = await response.json();
          logInfo('Successfully parsed API response');
          
          setTransactions(data.transactions || []);
          setUsageHistory(data.usage || []);
          setError(null); // Clear error if fallback succeeded
          logInfo('Fallback to API route successful');
        } catch (fallbackErr: any) {
          logError('Error in fallback API fetch:', fallbackErr);
          setError(fallbackErr.message || 'Failed to load credit history');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchCreditHistory();
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

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
        <p className="font-medium">{error.includes('Authentication') ? 'Authentication Error' : 'Error Loading Data'}</p>
        <p className="mt-1 text-sm">{error}</p>
        {error.includes('Authentication') ? (
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => window.location.href = '/auth/login'}
              className="text-white bg-red-700 hover:bg-red-800 px-4 py-2 rounded text-sm"
            >
              Sign In Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="text-red-800 bg-white border border-red-300 px-4 py-2 rounded text-sm"
            >
              Refresh Page
            </button>
          </div>
        ) : (
          <button
            onClick={() => window.location.reload()}
            className="text-red-800 underline mt-2 text-sm"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="p-3 bg-gray-100 border border-gray-300 rounded text-xs overflow-auto mb-4">
          <p className="font-medium text-gray-700">Debug info:</p>
          <pre className="mt-1 text-gray-600">{debugInfo}</pre>
        </div>
      )}
      
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