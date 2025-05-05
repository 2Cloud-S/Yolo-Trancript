import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import crypto from 'crypto';

// Credit mapping for each package
// Add normalized versions of package names for better matching
const CREDIT_PACKAGES: Record<string, number> = {
  'Starter': 50,
  'starter': 50, 
  'starter pack': 50,
  'starter package': 50,
  'Pro': 100,
  'pro': 100,
  'pro package': 100,
  'professional': 100,
  'Creator': 250,
  'creator': 250,
  'creator package': 250,
  'Power': 500,
  'power': 500,
  'power package': 500,
  'power user': 500
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

      // Extract the raw body text
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
      
      // Compute the HMAC
      const hmac = crypto.createHmac('sha256', this.secret);
      const data = `${timestamp}:${rawBody}`;
      const computedHash = hmac.update(data).digest('hex');
      
      console.log('🔍 Timestamp:', timestamp);
      console.log('🔍 Received hash:', hash);
      console.log('🔍 Computed hash:', computedHash);
      
      const isValid = computedHash === hash;
      
      // Parse the body as JSON
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

// Process Paddle webhook
export async function POST(req: NextRequest) {
  console.log('🔍 Webhook received:', new Date().toISOString());
  console.log('🔍 Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
  console.log('🔍 Request URL:', req.url);
  
  try {
    // Get webhook secret
    const webhookSecret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET || '';
    console.log('🔍 Webhook secret present:', !!webhookSecret);
    
    // Verify the signature and get the body
    const verifier = new PaddleWebhookVerifier(webhookSecret);
    const { isValid, body } = await verifier.verifySignature(req);
    
    // If signature is invalid or test request without signature
    if (!isValid) {
      // Check if this is a test ping without a signature
      if (!req.headers.get('paddle-signature')) {
        console.log('ℹ️ Test request detected (no signature)');
        return NextResponse.json({ message: 'Webhook endpoint is working, but no signature was provided.' });
      }
      
      // Empty body check (for curl tests)
      const rawText = await req.clone().text();
      if (!rawText || rawText.trim() === '') {
        console.log('ℹ️ Empty request body received - likely a test call');
        return NextResponse.json({ message: 'Webhook endpoint is working, but no data was provided.' });
      }
      
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    console.log('✅ Signature verified successfully');
    
    // Check for required Paddle webhook fields
    if (!body.event_type || !body.data) {
      console.error('❌ Missing required fields in webhook payload');
      return NextResponse.json({ 
        error: 'Invalid webhook payload', 
        message: 'The webhook payload is missing required fields (event_type, data)' 
      }, { status: 400 });
    }

    // Process different webhook event types
    const eventType = body.event_type;
    console.log(`🔍 Processing Paddle webhook: ${eventType}`);

    // Initialize Supabase admin client
    const supabase = createAdminClient();
    console.log('✅ Supabase admin client initialized');

    // Handle transaction completed event
    if (eventType === 'transaction.completed') {
      console.log('🔍 Processing transaction.completed event');
      // Log the complete payload for debugging
      console.log('🔍 Complete webhook payload:', JSON.stringify(body));
      
      // Extract data from the webhook with more robust parsing
      const transactionData = body.data;
      console.log('🔍 Transaction data:', JSON.stringify(transactionData));
      
      if (!transactionData || !transactionData.id) {
        console.error('❌ Missing transaction data', JSON.stringify(body.data));
        return NextResponse.json({ error: 'Missing transaction data' }, { status: 400 });
      }
      
      // Attempt to extract customer information
      // The path might be different depending on Paddle's payload structure
      let customerEmail = null;
      
      // Try different possible paths to customer email
      if (transactionData.customer && transactionData.customer.email) {
        customerEmail = transactionData.customer.email;
      } else if (transactionData.billing_details && transactionData.billing_details.email) {
        customerEmail = transactionData.billing_details.email;
      } else if (transactionData.buyer && transactionData.buyer.email) {
        customerEmail = transactionData.buyer.email;
      } else {
        // Check if email exists at other locations in the payload
        try {
          // Look recursively for email property
          const findEmailInObject = (obj: any): string | null => {
            if (!obj || typeof obj !== 'object') return null;
            
            if (obj.email && typeof obj.email === 'string') {
              return obj.email;
            }
            
            for (const key in obj) {
              if (typeof obj[key] === 'object') {
                const result = findEmailInObject(obj[key]);
                if (result) return result;
              }
            }
            
            return null;
          };
          
          customerEmail = findEmailInObject(transactionData);
        } catch (error) {
          console.error('❌ Error searching for customer email:', error);
        }
      }
      
      if (!customerEmail) {
        console.error('❌ Missing customer data', JSON.stringify(transactionData));
        return NextResponse.json({ error: 'Missing customer data' }, { status: 400 });
      }
      
      console.log('🔍 Found customer email:', customerEmail);

      // Find the user by email
      console.log('🔍 Looking up user by email:', customerEmail);
      
      // Variable to store the user ID
      let userId: string;
      
      // Try to directly query auth.users (needs service role key)
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('email', customerEmail)
        .maybeSingle();
      
      if (userError) {
        console.error('❌ Error querying user by email:', userError);
        return NextResponse.json({ error: 'Database error while looking up user' }, { status: 500 });
      }
      
      if (!userData) {
        console.error('❌ User not found with email:', customerEmail);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      userId = userData.id;
      console.log('✅ User found:', userId);

      // Get the package name and credits
      const lineItems = transactionData.items || [];
      if (lineItems.length === 0) {
        console.error('❌ No line items found');
        return NextResponse.json({ error: 'No line items found' }, { status: 400 });
      }

      // Extract product name by looking through different possible fields
      let packageName = 'Unknown Package';
      const firstItem = lineItems[0];
      
      if (firstItem.product && firstItem.product.name) {
        packageName = firstItem.product.name;
      } else if (firstItem.price && firstItem.price.product_name) {
        packageName = firstItem.price.product_name;
      } else if (firstItem.name) {
        packageName = firstItem.name;
      } else if (firstItem.product_name) {
        packageName = firstItem.product_name;
      }
      
      const creditsToAdd = CREDIT_PACKAGES[packageName as keyof typeof CREDIT_PACKAGES] || 0;

      console.log('🔍 Package:', packageName, 'Credits to add:', creditsToAdd);

      if (creditsToAdd <= 0) {
        console.error('❌ Invalid credit package or package not found:', packageName);
        console.log('🔍 Available packages:', Object.keys(CREDIT_PACKAGES).join(', '));
        
        // Try to match package name partially
        const possibleMatch = Object.keys(CREDIT_PACKAGES).find(
          key => packageName.includes(key) || key.includes(packageName)
        );
        
        if (possibleMatch) {
          packageName = possibleMatch;
          console.log('🔍 Found possible package match:', packageName);
        } else {
          // Default to Starter package if we can't identify the package
          packageName = 'Starter';
          console.log('🔍 Using default package:', packageName);
        }
      }

      // Record the transaction
      console.log('🔍 Recording transaction in credit_transactions table');
      const { error: txError } = await supabase.from('credit_transactions').insert({
        user_id: userId,
        paddle_transaction_id: transactionData.id,
        amount: transactionData.amount || 0,
        currency: transactionData.currency_code || 'USD',
        status: 'completed',
        credits_added: creditsToAdd,
        package_name: packageName,
        metadata: transactionData
      });

      if (txError) {
        console.error('❌ Error recording transaction:', txError);
        return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
      }

      console.log('✅ Transaction recorded successfully');

      // Check if user already has a credit balance
      console.log('🔍 Checking if user has existing credit balance');
      const { data: userCredits, error: creditsError } = await supabase
        .from('user_credits')
        .select('id, credits_balance')
        .eq('user_id', userId)
        .single();

      if (creditsError && creditsError.code !== 'PGRST116') { // Not found error
        console.error('❌ Error checking user credits:', creditsError);
        return NextResponse.json({ error: 'Failed to check user credits' }, { status: 500 });
      }

      // Update or create user credits
      if (userCredits) {
        // Update existing balance
        console.log('🔍 Updating existing credit balance from', userCredits.credits_balance, 'to', userCredits.credits_balance + creditsToAdd);
        const { error: updateError } = await supabase
          .from('user_credits')
          .update({
            credits_balance: userCredits.credits_balance + creditsToAdd
          })
          .eq('id', userCredits.id);

        if (updateError) {
          console.error('❌ Error updating user credits:', updateError);
          return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
        }
      } else {
        // Create new balance
        console.log('🔍 Creating new credit balance with', creditsToAdd, 'credits');
        const { error: createError } = await supabase
          .from('user_credits')
          .insert({
            user_id: userId,
            credits_balance: creditsToAdd
          });

        if (createError) {
          console.error('❌ Error creating user credits:', createError);
          return NextResponse.json({ error: 'Failed to create credits' }, { status: 500 });
        }
      }

      console.log('✅ Credits updated successfully');
      return NextResponse.json({ success: true });
    } 
    // Handle transaction.updated event
    else if (eventType === 'transaction.updated') {
      console.log('🔍 Processing transaction.updated event');
      // Log the complete data for inspection
      console.log('🔍 Complete webhook payload:', JSON.stringify(body));
      
      // Extract transaction data with more robust parsing
      const transactionData = body.data;
      console.log('🔍 Transaction data:', JSON.stringify(transactionData));
      
      if (!transactionData || !transactionData.id) {
        console.error('❌ Missing transaction data', JSON.stringify(body.data));
        return NextResponse.json({ error: 'Missing transaction data' }, { status: 400 });
      }
      
      console.log('✅ Transaction.updated event received and logged - ID:', transactionData.id);
      console.log('✅ Status (if available):', transactionData.status || 'unknown');
      
      // For now, we'll just acknowledge this event
      return NextResponse.json({ 
        success: true, 
        message: 'Transaction.updated event received',
        transactionId: transactionData.id,
        status: transactionData.status || 'unknown'
      });
    }

    // Default response for unhandled events
    console.log('ℹ️ Unhandled event type:', eventType);
    return NextResponse.json({ 
      success: true, 
      message: 'Event received but not processed',
      eventType: eventType 
    });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
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