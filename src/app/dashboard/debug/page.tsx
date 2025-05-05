'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export default function DebugPage() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [directCheck, setDirectCheck] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Get auth status from the API
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        setAuthStatus(data);
        
        // Perform a direct check with the Supabase client
        const supabase = createClientComponentClient<Database>();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        setDirectCheck({
          hasSession: !!sessionData.session,
          sessionError: sessionError?.message,
          user: sessionData.session?.user,
        });
        
        // If we have a session, try to fetch data
        if (sessionData.session) {
          const userId = sessionData.session.user.id;
          
          // Try to get user credits
          const { data: credits, error: creditsError } = await supabase
            .from('user_credits')
            .select('*')
            .eq('user_id', userId)
            .single();
            
          setUserCredits({
            data: credits,
            error: creditsError?.message,
          });
          
          // Try to get transactions
          const { data: txData, error: txError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', userId)
            .limit(3)
            .order('created_at', { ascending: false });
            
          setTransactions(txData || []);
          
          if (txError) {
            console.error('Transaction fetch error:', txError);
          }
          
          // Try to get usage
          const { data: usageData, error: usageError } = await supabase
            .from('credit_usage')
            .select('*')
            .eq('user_id', userId)
            .limit(3)
            .order('used_at', { ascending: false });
            
          setUsageHistory(usageData || []);
          
          if (usageError) {
            console.error('Usage fetch error:', usageError);
          }
        }
      } catch (err: any) {
        console.error('Debug page error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);
  
  if (loading) {
    return <div className="p-6">Loading authentication debug information...</div>;
  }
  
  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }
  
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Authentication &amp; Permissions Debug</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Session Status</h2>
        <div className="flex space-x-4">
          <div className="bg-white p-4 rounded shadow flex-1">
            <h3 className="font-medium">API Check</h3>
            <div className="mt-2">
              <div className="text-sm">
                Authenticated: <span className={authStatus?.authenticated ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {String(authStatus?.authenticated)}
                </span>
              </div>
              <div className="text-sm mt-1">Status: {authStatus?.status}</div>
              {authStatus?.user && (
                <div className="text-sm mt-1">User ID: {authStatus.user.id}</div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded shadow flex-1">
            <h3 className="font-medium">Direct Client Check</h3>
            <div className="mt-2">
              <div className="text-sm">
                Has Session: <span className={directCheck?.hasSession ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {String(directCheck?.hasSession)}
                </span>
              </div>
              {directCheck?.sessionError && (
                <div className="text-sm text-red-500 mt-1">Error: {directCheck.sessionError}</div>
              )}
              {directCheck?.user && (
                <div className="text-sm mt-1">User ID: {directCheck.user.id}</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {authStatus?.rls_check && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">RLS Permissions</h2>
          <div className="bg-white p-4 rounded shadow">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2">Table</th>
                  <th className="text-left pb-2">Access</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">user_credits</td>
                  <td>
                    <span className={authStatus.rls_check.data?.permissions?.user_credits_access ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                      {String(authStatus.rls_check.data?.permissions?.user_credits_access)}
                    </span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">credit_transactions</td>
                  <td>
                    <span className={authStatus.rls_check.data?.permissions?.credit_transactions_access ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                      {String(authStatus.rls_check.data?.permissions?.credit_transactions_access)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2">credit_usage</td>
                  <td>
                    <span className={authStatus.rls_check.data?.permissions?.credit_usage_access ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                      {String(authStatus.rls_check.data?.permissions?.credit_usage_access)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Direct Data Access Tests</h2>
        
        <div className="bg-white p-4 rounded shadow mb-4">
          <h3 className="font-medium">User Credits</h3>
          {userCredits?.error ? (
            <div className="text-red-500 mt-2">{userCredits.error}</div>
          ) : userCredits?.data ? (
            <div className="mt-2">
              <div className="text-sm">Balance: {userCredits.data.credits_balance}</div>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(userCredits.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-gray-500 mt-2">No data found</div>
          )}
        </div>
        
        <div className="bg-white p-4 rounded shadow mb-4">
          <h3 className="font-medium">Transactions (up to 3)</h3>
          {transactions.length > 0 ? (
            <div className="mt-2">
              <div className="text-sm">Count: {transactions.length}</div>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(transactions, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-gray-500 mt-2">No transactions found</div>
          )}
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium">Usage History (up to 3)</h3>
          {usageHistory.length > 0 ? (
            <div className="mt-2">
              <div className="text-sm">Count: {usageHistory.length}</div>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(usageHistory, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-gray-500 mt-2">No usage history found</div>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <button 
          onClick={() => {
            // Run the fix_permissions.sql script
            fetch('/api/auth/fix-permissions', { method: 'POST' })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  alert('Permissions fixed! Please refresh the page.');
                  window.location.reload();
                } else {
                  alert('Error fixing permissions: ' + data.error);
                }
              })
              .catch(err => {
                alert('Error: ' + err.message);
              });
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Attempt to Fix Permissions
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 ml-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
} 