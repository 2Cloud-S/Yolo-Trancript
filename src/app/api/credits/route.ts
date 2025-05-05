import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { hasEfficientCredits, logCreditUsage } from '@/lib/supabase/admin-client';

// Calculate credits needed based on audio duration (in seconds)
function calculateCreditsNeeded(durationInSeconds: number): number {
  // 1 credit = 6 minutes (360 seconds) of audio
  const creditsPerMinute = 1 / 6; 
  const durationInMinutes = durationInSeconds / 60;
  const creditsNeeded = Math.ceil(durationInMinutes * creditsPerMinute);
  
  // Minimum 1 credit
  return Math.max(1, creditsNeeded);
}

// Get user's credit information
export async function GET(req: NextRequest) {
  console.log('[API] Credits GET request received', new Date().toISOString());
  
  // Allow the request to come from the same origin
  const headers = new Headers();
  headers.append('Access-Control-Allow-Credentials', 'true');
  headers.append('Content-Type', 'application/json');
  
  try {
    // Parse the cookies securely
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Check if the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[API] Authentication error in GET:', authError || 'No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }
    
    // Get user's credit information
    const { data, error } = await supabase
      .from('user_credit_summary')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (error) {
      console.error('Error fetching user credits:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch credit information',
        details: error.message,
        code: error.code
      }, { status: 500, headers });
    }
    
    // If no credit record exists yet, return default values
    if (!data) {
      return NextResponse.json({
        credits_balance: 0,
        total_credits_purchased: 0,
        total_credits_used: 0,
        purchase_count: 0,
        usage_count: 0
      }, { headers });
    }
    
    return NextResponse.json(data, { headers });
  } catch (error) {
    console.error('Unexpected error in credits API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500, headers });
  }
}

// Check if user has enough credits for transcription
export async function POST(req: NextRequest) {
  console.log('[API] Credits POST request received', new Date().toISOString());
  
  // Allow the request to come from the same origin
  const headers = new Headers();
  headers.append('Access-Control-Allow-Credentials', 'true');
  headers.append('Content-Type', 'application/json');
  
  try {
    // Parse the cookies securely
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Check if the user is authenticated
    console.log('[API] Checking authentication');
    try {
      // Get the authenticated user with detailed logging
      console.log('[API] Getting authenticated user...');
      const { data, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('[API] Authentication error:', authError);
        return NextResponse.json({ 
          error: 'Authentication error', 
          details: authError.message
        }, { status: 401, headers });
      }
      
      const user = data.user;
      if (!user) {
        console.log('[API] No authenticated user found in session');
        // Return more detailed error for debugging
        return NextResponse.json({ 
          error: 'No authenticated user found', 
          details: 'Auth session missing!'
        }, { status: 401, headers });
      }
      
      console.log(`[API] User authenticated: ${user.id} (${user.email})`);
      
      // Parse request body
      const body = await req.json();
      console.log('[API] Request body action:', body.action);
      
      const { action, durationInSeconds, transcriptionId } = body;
      
      // Check credit balance for a new transcription
      if (action === 'check') {
        if (!durationInSeconds || durationInSeconds <= 0) {
          return NextResponse.json({ error: 'Invalid duration' }, { status: 400, headers });
        }
        
        const creditsNeeded = calculateCreditsNeeded(durationInSeconds);
        const hasCredits = await hasEfficientCredits(user.id, creditsNeeded);
        
        return NextResponse.json({
          hasEnoughCredits: hasCredits,
          creditsNeeded,
        }, { headers });
      }
      
      // Deduct credits for a completed transcription
      if (action === 'deduct') {
        if (!durationInSeconds || durationInSeconds <= 0) {
          return NextResponse.json({ error: 'Invalid duration' }, { status: 400, headers });
        }
        
        if (!transcriptionId) {
          return NextResponse.json({ error: 'Transcription ID required' }, { status: 400, headers });
        }
        
        const creditsNeeded = calculateCreditsNeeded(durationInSeconds);
        const success = await logCreditUsage(user.id, creditsNeeded, transcriptionId);
        
        if (!success) {
          return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500, headers });
        }
        
        return NextResponse.json({
          success: true,
          creditsDeducted: creditsNeeded,
        }, { headers });
      }
      
      // Get transaction history
      if (action === 'history') {
        console.log('[API] Credits history requested for user:', user.id);
        
        try {
          // Fetch credit transactions
          console.log('[API] Fetching credit transactions...');
          const { data: transactions, error: txError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (txError) {
            console.error('[API] Error fetching transactions:', txError);
            return NextResponse.json({ 
              error: `Failed to fetch transactions: ${txError.message}`,
              code: txError.code,
              details: txError.details
            }, { status: 500, headers });
          }
          
          console.log(`[API] Successfully fetched ${transactions?.length || 0} transactions`);
          
          // Fetch credit usage
          console.log('[API] Fetching credit usage history...');
          const { data: usage, error: usageError } = await supabase
            .from('credit_usage')
            .select('*, transcriptions(file_name)')
            .eq('user_id', user.id)
            .order('used_at', { ascending: false });
            
          if (usageError) {
            console.error('[API] Error fetching usage:', usageError);
            return NextResponse.json({ 
              error: `Failed to fetch usage history: ${usageError.message}`,
              code: usageError.code,
              details: usageError.details
            }, { status: 500, headers });
          }
          
          console.log(`[API] Successfully fetched ${usage?.length || 0} usage records`);
          
          // Return success with data
          return NextResponse.json({
            transactions,
            usage
          }, { headers });
        } catch (historyError: any) {
          console.error('[API] Unexpected error in history action:', historyError);
          return NextResponse.json({ 
            error: `Internal server error in history action: ${historyError.message}`,
            stack: process.env.NODE_ENV === 'development' ? historyError.stack : undefined
          }, { status: 500, headers });
        }
      }
      
      return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers });
    } catch (error) {
      console.error('Error checking authentication:', error);
      return NextResponse.json({ 
        error: 'Authentication error',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500, headers });
    }
  } catch (error) {
    console.error('Unexpected error in credits API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500, headers });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(req: NextRequest) {
  const headers = new Headers();
  
  // Basic CORS headers
  headers.set('Access-Control-Allow-Origin', req.headers.get('origin') || '*');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }
  
  return new NextResponse(null, { headers });
} 