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
      
      // More comprehensive email extraction attempt
      console.log('🔍 Attempting to extract customer email from various locations in payload');
      
      // Common paths for customer email
      if (transactionData.customer && transactionData.customer.email) {
        customerEmail = transactionData.customer.email;
        console.log('✅ Found email in transactionData.customer.email:', customerEmail);
      } else if (transactionData.billing_details && transactionData.billing_details.email) {
        customerEmail = transactionData.billing_details.email;
        console.log('✅ Found email in transactionData.billing_details.email:', customerEmail);
      } else if (transactionData.buyer && transactionData.buyer.email) {
        customerEmail = transactionData.buyer.email;
        console.log('✅ Found email in transactionData.buyer.email:', customerEmail);
      } else if (transactionData.user && transactionData.user.email) {
        customerEmail = transactionData.user.email;
        console.log('✅ Found email in transactionData.user.email:', customerEmail);
      } else if (transactionData.email) {
        customerEmail = transactionData.email;
        console.log('✅ Found email directly in transactionData.email:', customerEmail);
      } else {
        // Check if email exists in custom data if any
        if (transactionData.custom_data && typeof transactionData.custom_data === 'object') {
          if (transactionData.custom_data.email) {
            customerEmail = transactionData.custom_data.email;
            console.log('✅ Found email in transactionData.custom_data.email:', customerEmail);
          }
        }
        
        // Check for email in items array if present
        if (!customerEmail && transactionData.items && Array.isArray(transactionData.items)) {
          for (const item of transactionData.items) {
            if (item.customer && item.customer.email) {
              customerEmail = item.customer.email;
              console.log('✅ Found email in item.customer.email:', customerEmail);
              break;
            }
          }
        }
        
        // Check if email exists at other locations in the payload as a last resort
        if (!customerEmail) {
          try {
            // Look recursively for email property
            const findEmailInObject = (obj: any): string | null => {
              if (!obj || typeof obj !== 'object') return null;
              
              if (obj.email && typeof obj.email === 'string') {
                console.log('✅ Found email in object path:', obj.email);
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
      }
      
      if (!customerEmail) {
        // Log the complete transaction data to help debugging
        console.error('❌ Missing customer data in the webhook payload:', JSON.stringify(transactionData, null, 2));
        
        // Check if we can fallback to a default test user for development
        if (process.env.NODE_ENV === 'development' && process.env.TEST_USER_EMAIL) {
          console.log('⚠️ Using test user email as fallback in development mode');
          customerEmail = process.env.TEST_USER_EMAIL;
        } else {
          return NextResponse.json({ error: 'Missing customer data' }, { status: 400 });
        }
      }
      
      console.log('🔍 Found customer email:', customerEmail);

      // Find the user by email
      console.log('🔍 Looking up user by email:', customerEmail);
      
      // Get all users and filter by email (until Supabase adds a direct getUserByEmail method)
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error listing users:', listError);
        return NextResponse.json({ error: 'Database error while looking up user' }, { status: 500 });
      }
      
      const userData = usersData.users.find(u => u.email === customerEmail);
      if (!userData) {
        console.error('❌ User not found in database:', customerEmail);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const userId = userData.id;
      console.log('✅ User found:', userId);

      // Get the package name and credits
      let packageName = 'Unknown Package';
      let creditsToAdd = 0;
      
      // Extract items from the transaction data
      const lineItems = transactionData.items || [];
      if (lineItems.length === 0) {
        console.error('❌ No line items found');
        return NextResponse.json({ error: 'No line items found' }, { status: 400 });
      }

      console.log('🔍 Processing line items:', JSON.stringify(lineItems));
      
      // Try to extract product name from the first item
      const firstItem = lineItems[0];
      
      // More robust package name extraction
      if (firstItem.product && firstItem.product.name) {
        packageName = firstItem.product.name;
        console.log('✅ Found package name in firstItem.product.name:', packageName);
      } else if (firstItem.price && firstItem.price.product_name) {
        packageName = firstItem.price.product_name;
        console.log('✅ Found package name in firstItem.price.product_name:', packageName);
      } else if (firstItem.name) {
        packageName = firstItem.name;
        console.log('✅ Found package name in firstItem.name:', packageName);
      } else if (firstItem.product_name) {
        packageName = firstItem.product_name;
        console.log('✅ Found package name in firstItem.product_name:', packageName);
      } else if (firstItem.price && firstItem.price.name) {
        packageName = firstItem.price.name;
        console.log('✅ Found package name in firstItem.price.name:', packageName);
      } else {
        // Try searching for the product/price info in a different structure
        if (firstItem.price_id && firstItem.price_id.includes('_')) {
          // Sometimes the price_id contains info like "pri_starter" we can extract
          const parts = firstItem.price_id.split('_');
          if (parts.length > 1) {
            packageName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1); // Capitalize first letter
            console.log('✅ Extracted package name from price_id:', packageName);
          }
        }
      }
      
      // Extract credit amount from the package name
      creditsToAdd = CREDIT_PACKAGES[packageName as keyof typeof CREDIT_PACKAGES] || 0;
      console.log('🔍 Package:', packageName, 'Credits to add:', creditsToAdd);

      if (creditsToAdd <= 0) {
        console.error('❌ Invalid credit package or package not found:', packageName);
        console.log('🔍 Available packages:', Object.keys(CREDIT_PACKAGES).join(', '));
        
        // Try to match package name partially
        const possibleMatch = Object.keys(CREDIT_PACKAGES).find(
          key => packageName.toLowerCase().includes(key.toLowerCase()) || 
                key.toLowerCase().includes(packageName.toLowerCase())
        );
        
        if (possibleMatch) {
          packageName = possibleMatch;
          creditsToAdd = CREDIT_PACKAGES[packageName as keyof typeof CREDIT_PACKAGES];
          console.log('🔍 Found possible package match:', packageName, 'Credits:', creditsToAdd);
        } else {
          // Default to Starter package as fallback
          packageName = 'Starter';
          creditsToAdd = CREDIT_PACKAGES['Starter'];
          console.log('🔍 Using default package as fallback:', packageName, 'Credits:', creditsToAdd);
        }
      }

      // Record the transaction
      console.log('🔍 Recording transaction in credit_transactions table');
      try {
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
          return NextResponse.json({ 
            error: 'Failed to record transaction', 
            details: txError.message 
          }, { status: 500 });
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
          return NextResponse.json({ 
            error: 'Failed to check user credits', 
            details: creditsError.message 
          }, { status: 500 });
        }

        // Update or create user credits
        if (userCredits) {
          // Update existing balance
          const newBalance = userCredits.credits_balance + creditsToAdd;
          console.log('🔍 Updating existing credit balance from', userCredits.credits_balance, 'to', newBalance);
          const { error: updateError } = await supabase
            .from('user_credits')
            .update({
              credits_balance: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', userCredits.id);

          if (updateError) {
            console.error('❌ Error updating user credits:', updateError);
            return NextResponse.json({ 
              error: 'Failed to update credits', 
              details: updateError.message 
            }, { status: 500 });
          }
          
          console.log('✅ Credits updated successfully. New balance:', newBalance);
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
            return NextResponse.json({ 
              error: 'Failed to create credits', 
              details: createError.message 
            }, { status: 500 });
          }
          
          console.log('✅ New credits record created successfully with balance:', creditsToAdd);
        }

        return NextResponse.json({ 
          success: true,
          message: 'Transaction processed successfully',
          user_id: userId,
          credits_added: creditsToAdd,
          package: packageName
        });
      } catch (dbError) {
        console.error('❌ Unexpected database error:', dbError);
        return NextResponse.json({ 
          error: 'Database operation failed', 
          message: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
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