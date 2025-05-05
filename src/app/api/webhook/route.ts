import { NextRequest, NextResponse } from 'next/server';
import { getPaddleClient } from '@/lib/paddle/api-client';
import { createServiceRoleClient } from '@/lib/supabase/server';
import crypto from 'crypto';

interface PaddleCustomer {
  id: string;
  email: string;
  name?: string;
  status: string;
  created_at: string;
  updated_at: string;
  custom_data?: Record<string, any>;
}

interface PaddleTransaction {
  id: string;
  customer_id?: string;
  customer?: PaddleCustomer;
  billing_details?: {
    email?: string;
    name?: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
  custom_data?: Record<string, any>;
}

interface PaddleApiResponse<T> {
  data: T;
  meta?: {
    request_id: string;
    pagination?: {
      per_page: number;
      next?: string;
      has_more: boolean;
      estimated_total: number;
    };
  };
}

// Helper function to fetch customer details from Paddle API
async function fetchCustomerFromPaddle(customerId: string): Promise<{ email: string | null }> {
  try {
    // Get Paddle API credentials from environment variables
    const apiKey = process.env.PADDLE_API_KEY || '';
    if (!apiKey) {
      console.error('❌ No Paddle API key found in environment variables');
      return { email: null };
    }
    
    // Paddle API base URL depends on environment
    const isProdEnv = process.env.NODE_ENV === 'production';
    const baseUrl = isProdEnv 
      ? 'https://api.paddle.com' 
      : 'https://sandbox-api.paddle.com';
    
    // Make API request to get customer details
    console.log(`🔍 Fetching customer details from Paddle API for ID: ${customerId}`);
    const response = await fetch(`${baseUrl}/customers/${customerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error fetching customer from Paddle API: ${response.status} ${errorText}`);
      return { email: null };
    }
    
    const data = await response.json();
    console.log('✅ Customer data retrieved successfully from Paddle API');
    
    // Extract email from response
    const email = data?.data?.email || null;
    if (email) {
      console.log(`✅ Found customer email from Paddle API: ${email}`);
    } else {
      console.error('❌ No email found in Paddle API response');
    }
    
    return { email };
  } catch (error) {
    console.error('❌ Error calling Paddle API:', error);
    return { email: null };
  }
}

// Helper function to fetch transaction details from Paddle API
async function fetchTransactionFromPaddle(transactionId: string): Promise<{ customer_email: string | null }> {
  try {
    // Get Paddle API credentials from environment variables
    const apiKey = process.env.PADDLE_API_KEY || '';
    if (!apiKey) {
      console.error('❌ No Paddle API key found in environment variables');
      return { customer_email: null };
    }
    
    // Paddle API base URL depends on environment
    const isProdEnv = process.env.NODE_ENV === 'production';
    const baseUrl = isProdEnv 
      ? 'https://api.paddle.com' 
      : 'https://sandbox-api.paddle.com';
    
    // Make API request to get transaction details
    console.log(`🔍 Fetching transaction details from Paddle API for ID: ${transactionId}`);
    const response = await fetch(`${baseUrl}/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error fetching transaction from Paddle API: ${response.status} ${errorText}`);
      return { customer_email: null };
    }
    
    const data = await response.json();
    console.log('✅ Transaction data retrieved successfully from Paddle API');
    
    // Try to get customer info from the transaction
    let customerEmail = null;
    
    // Extract customer ID first
    const customerId = data?.data?.customer_id;
    if (customerId) {
      // If we have a customer ID, try to get customer details
      console.log(`🔍 Found customer_id in transaction data: ${customerId}`);
      const { email } = await fetchCustomerFromPaddle(customerId);
      customerEmail = email;
    }
    
    // Try to find email in the billing details or custom data
    if (!customerEmail) {
      const billingDetails = data?.data?.billing_details;
      if (billingDetails && billingDetails.email) {
        customerEmail = billingDetails.email;
        console.log(`✅ Found email in transaction billing details: ${customerEmail}`);
      } else if (data?.data?.custom_data && data.data.custom_data.user_email) {
        customerEmail = data.data.custom_data.user_email;
        console.log(`✅ Found email in transaction custom data: ${customerEmail}`);
      }
    }
    
    return { customer_email: customerEmail };
  } catch (error) {
    console.error('❌ Error calling Paddle API for transaction:', error);
    return { customer_email: null };
  }
}

// Credit mapping for each package
// Add normalized versions of package names for better matching
const CREDIT_PACKAGES: Record<string, number> = {
  'Starter': 50,
  'starter': 50, 
  'starter pack': 50,
  'starter package': 50,
  'small': 50,
  'Small': 50,
  'small package': 50,
  'small pack': 50,
  'basic': 50,
  'Basic': 50,
  'Pro': 100,
  'pro': 100,
  'pro package': 100,
  'professional': 100,
  'medium': 100,
  'Medium': 100,
  'medium package': 100,
  'medium pack': 100,
  'Creator': 250,
  'creator': 250,
  'creator package': 250,
  'large': 250,
  'Large': 250,
  'large package': 250,
  'large pack': 250,
  'Power': 500,
  'power': 500,
  'power package': 500,
  'power user': 500,
  'elite': 500,
  'Elite': 500,
  'premium': 500,
  'Premium': 500,
  'enterprise': 500,
  'Enterprise': 500
};

// Helper class for Paddle webhook signature verification
class PaddleWebhookVerifier {
  constructor(private secret: string) {
    if (!secret) {
      console.warn('⚠️ No webhook secret provided');
    }
  }

  async verifySignature(request: NextRequest): Promise<{ isValid: boolean; body: any }> {
    try {
      const signature = request.headers.get('paddle-signature');
      if (!signature) {
        console.error('❌ No paddle-signature header found');
        return { isValid: false, body: null };
      }

      // Getting the raw body directly as text without any processing
      const rawBody = await request.text();
      console.log('🔍 Raw body length:', rawBody.length);
      
      if (!rawBody || rawBody.trim() === '') {
        console.log('ℹ️ Empty request body received');
        return { isValid: false, body: null };
      }
      
      // Extract signature components
      const matches = signature.match(/^ts=(\d+);h1=(.+)$/);
      if (!matches) {
        console.error('❌ Invalid signature format');
        return { isValid: false, body: null };
      }
      
      const [_, timestamp, hash] = matches;
      
      // Compute the HMAC using the raw body as Paddle sent it
      const hmac = crypto.createHmac('sha256', this.secret);
      const data = `${timestamp}:${rawBody}`;
      const computedHash = hmac.update(data).digest('hex');
      
      console.log('🔍 Timestamp:', timestamp);
      console.log('🔍 Received hash:', hash);
      console.log('🔍 Computed hash:', computedHash);
      
      const isValid = computedHash === hash;
      
      // Parse the body as JSON only after validation
      let parsedBody = null;
      try {
        parsedBody = JSON.parse(rawBody);
      } catch (e) {
        console.error('❌ Error parsing JSON body:', e);
        return { isValid, body: null };
      }
      
      return { 
        isValid, 
        body: parsedBody 
      };
    } catch (error) {
      console.error('❌ Error verifying signature:', error);
      return { isValid: false, body: null };
    }
  }
}

// Helper function to analyze webhook payload structure
function analyzeWebhookStructure(payload: any): void {
  try {
    console.log('🔍 Analyzing webhook payload structure');
    
    // Check for customer_id
    if (payload.customer_id) {
      console.log('✅ Found customer_id:', payload.customer_id);
    }
    
    // Check for items structure
    if (Array.isArray(payload.items)) {
      console.log('✅ Found items array with', payload.items.length, 'items');
      
      // Analyze first item
      if (payload.items[0]) {
        const firstItem = payload.items[0];
        console.log('🔍 First item structure keys:', Object.keys(firstItem).join(', '));
        
        // Check for price structure
        if (firstItem.price) {
          console.log('✅ Found price object in first item with keys:', Object.keys(firstItem.price).join(', '));
          
          // Check for product name
          if (firstItem.price.name) {
            console.log('✅ Found price.name:', firstItem.price.name);
          }
        }
      }
    }
    
    // Check for checkout data
    if (payload.checkout) {
      console.log('✅ Found checkout data with keys:', Object.keys(payload.checkout).join(', '));
    }
    
    // Check for customer data directly
    if (payload.customer) {
      console.log('✅ Found customer object with keys:', Object.keys(payload.customer).join(', '));
    }
    
    // Check for payments data
    if (Array.isArray(payload.payments) && payload.payments.length > 0) {
      console.log('✅ Found payments array with', payload.payments.length, 'items');
      console.log('🔍 First payment item keys:', Object.keys(payload.payments[0]).join(', '));
    }
    
    // Check for custom_data
    if (payload.custom_data) {
      console.log('✅ Found custom_data with keys:', payload.custom_data ? Object.keys(payload.custom_data).join(', ') : 'null');
    }
  } catch (error) {
    console.error('❌ Error analyzing webhook structure:', error);
  }
}

// Process Paddle webhook
export async function POST(req: NextRequest) {
  console.log('🔍 Webhook received:', new Date().toISOString());
  console.log('🔍 Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
  console.log('🔍 Request URL:', req.url);
  
  // Check for API key availability early (without logging the actual key)
  console.log('🔍 Paddle API key available:', !!process.env.PADDLE_API_KEY);
  console.log('🔍 Paddle Sandbox API key available:', !!process.env.PADDLE_SANDBOX_API_KEY);
  
  try {
    // Clone the request to preserve it for potential emergency fallback
    const reqClone = req.clone();
    
    // Get webhook secret
    const webhookSecret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET || '';
    console.log('🔍 Webhook secret present:', !!webhookSecret);
    
    // Get the signature from headers
    const signature = req.headers.get('paddle-signature');
    if (!signature) {
      console.error('❌ Missing paddle-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
    
    // Get the raw body
    const rawBody = await req.text();
    
    // Get the appropriate Paddle client based on environment
    const paddleClient = getPaddleClient();
    
    // Verify the signature
    const isValid = await paddleClient.verifyWebhookSignature(signature, rawBody, webhookSecret);
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the body
    const body = JSON.parse(rawBody);
    console.log('🔍 Webhook event type:', body.event_type);

    // Handle transaction completed event
    if (body.event_type === 'transaction.completed') {
      console.log('🔍 Processing transaction.completed event');
      
      const transactionData = body.data;
      console.log('🔍 Transaction data:', JSON.stringify(transactionData));
      
      if (!transactionData || !transactionData.id) {
        console.error('❌ Missing transaction data', JSON.stringify(body.data));
        return NextResponse.json({ error: 'Missing transaction data' }, { status: 400 });
      }
      
      // Extract customer email from various possible locations
      let customerEmail = transactionData.customer?.email || 
                         transactionData.customer_email ||
                         transactionData.billing_details?.email;
      
      if (!customerEmail) {
        console.log('🔍 No direct customer email found, attempting to fetch from Paddle API');
        
        // Try to get customer details using customer_id
        if (transactionData.customer_id) {
          try {
            const customerResponse = await paddleClient.getCustomerById(transactionData.customer_id) as PaddleApiResponse<PaddleCustomer>;
            if (customerResponse?.data?.email) {
              customerEmail = customerResponse.data.email;
              console.log('✅ Found customer email via API:', customerEmail);
            }
          } catch (error) {
            console.error('❌ Error fetching customer data:', error);
          }
        }
        
        // If still no email, try to get transaction details
        if (!customerEmail && transactionData.id) {
          try {
            const transactionResponse = await paddleClient.getTransaction(transactionData.id) as PaddleApiResponse<PaddleTransaction>;
            if (transactionResponse?.data) {
              customerEmail = transactionResponse.data.customer?.email ||
                            transactionResponse.data.billing_details?.email;
              if (customerEmail) {
                console.log('✅ Found customer email via transaction API:', customerEmail);
              }
            }
          } catch (error) {
            console.error('❌ Error fetching transaction data:', error);
          }
        }
      }
      
      if (!customerEmail) {
        console.error('❌ Could not find customer email in webhook data');
        return NextResponse.json({ error: 'Missing customer email' }, { status: 400 });
      }

      // Get package name and credits from transaction data
      const packageName = transactionData.items?.[0]?.price?.name || 'Unknown Package';
      const creditsToAdd = CREDIT_PACKAGES[packageName.toLowerCase()] || 0;

      if (creditsToAdd === 0) {
        console.error('❌ Could not determine credits to add for package:', packageName);
        return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
      }

      // Initialize Supabase client with service role
      const supabase = createServiceRoleClient();

      // Get user ID from email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', customerEmail)
        .single();

      if (userError || !userData) {
        console.error('❌ Error finding user:', userError);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userId = userData.id;

      // Start a transaction to update both tables
      const { error: transactionError } = await supabase.rpc('process_credit_purchase', {
        p_user_id: userId,
        p_paddle_transaction_id: transactionData.id,
        p_amount: transactionData.details.totals.total,
        p_currency: transactionData.currency_code,
        p_credits_to_add: creditsToAdd,
        p_package_name: packageName,
        p_metadata: transactionData
      });

      if (transactionError) {
        console.error('❌ Error processing credit purchase:', transactionError);
        return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 });
      }

      console.log('✅ Successfully processed credit purchase for user:', userId);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Transaction processed successfully',
        customerEmail,
        creditsAdded: creditsToAdd
      });
    }
    
    // Return success for other event types
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received and processed',
      eventType: body.event_type
    });
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Paddle-Signature'
    }
  });
} 