import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';
import crypto from 'crypto';

// Credit mapping for each package
const CREDIT_PACKAGES = {
  'Starter': 50,
  'Pro': 100,
  'Creator': 250,
  'Power': 500,
};

// Process Paddle webhook
export async function POST(req: NextRequest) {
  console.log('🔍 Webhook received:', new Date().toISOString());
  
  try {
    // Log request information for debugging
    console.log('🔍 Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
    console.log('🔍 Request URL:', req.url);
    console.log('🔍 Request method:', req.method);
    
    // Get the raw request body for signature verification
    const rawBody = await req.text();
    console.log('🔍 Raw body length:', rawBody.length);
    console.log('🔍 Raw body preview:', rawBody.substring(0, 200) + '...');
    
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log('🔍 Event type:', body.event_type);
      console.log('🔍 Event ID:', body.event_id);
      console.log('🔍 Notification ID:', body.notification_id);
    } catch (e) {
      console.error('❌ Error parsing JSON body:', e);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    const paddleSignature = req.headers.get('paddle-signature');
    console.log('🔍 Paddle signature present:', !!paddleSignature);
    
    if (!paddleSignature) {
      console.error('❌ No Paddle signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 401 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET || '';
    console.log('🔍 Webhook secret present:', !!webhookSecret);
    
    const isValid = verifyPaddleSignature(
      rawBody,
      paddleSignature,
      webhookSecret
    );

    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('✅ Signature verified successfully');
    
    // Process different webhook event types
    const eventType = body.event_type;
    console.log(`🔍 Processing Paddle webhook: ${eventType}`);

    // Initialize Supabase admin client
    const supabase = createAdminClient();
    console.log('✅ Supabase admin client initialized');

    // Handle transaction completed event
    if (eventType === 'transaction.completed') {
      console.log('🔍 Processing transaction.completed event');
      // Extract data from the webhook
      const { transaction, customer } = body.data;
      
      if (!transaction || !customer) {
        console.error('❌ Missing transaction or customer data', JSON.stringify(body.data));
        return NextResponse.json({ error: 'Missing transaction or customer data' }, { status: 400 });
      }

      // Find the user by email
      console.log('🔍 Looking up user by email:', customer.email);
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', customer.email)
        .single();

      if (userError || !userData) {
        console.error('❌ User not found:', customer.email, userError);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      console.log('✅ User found:', userData.id);

      // Get the package name and credits
      const lineItems = transaction.items || [];
      if (lineItems.length === 0) {
        console.error('❌ No line items found');
        return NextResponse.json({ error: 'No line items found' }, { status: 400 });
      }

      const packageName = lineItems[0].product.name || 'Unknown Package';
      const creditsToAdd = CREDIT_PACKAGES[packageName as keyof typeof CREDIT_PACKAGES] || 0;

      console.log('🔍 Package:', packageName, 'Credits to add:', creditsToAdd);

      if (creditsToAdd <= 0) {
        console.error('❌ Invalid credit package:', packageName);
        return NextResponse.json({ error: 'Invalid credit package' }, { status: 400 });
      }

      // Record the transaction
      console.log('🔍 Recording transaction in credit_transactions table');
      const { error: txError } = await supabase.from('credit_transactions').insert({
        user_id: userData.id,
        paddle_transaction_id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency_code,
        status: 'completed',
        credits_added: creditsToAdd,
        package_name: packageName,
        metadata: transaction
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
        .eq('user_id', userData.id)
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
            user_id: userData.id,
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
      // Log the data for inspection
      console.log('🔍 Transaction updated data:', JSON.stringify(body.data));
      
      const { transaction, customer } = body.data;
      
      if (!transaction || !customer) {
        console.error('❌ Missing transaction or customer data in transaction.updated event');
        return NextResponse.json({ error: 'Missing transaction or customer data' }, { status: 400 });
      }
      
      console.log('✅ Transaction.updated event received and logged - Status:', transaction.status);
      
      // For now, we'll just acknowledge this event
      // In the future, you can implement specific logic for handling updates
      return NextResponse.json({ 
        success: true, 
        message: 'Transaction.updated event received',
        transactionId: transaction.id,
        status: transaction.status
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

// Validate the webhook signature from Paddle
function verifyPaddleSignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) {
    console.warn('⚠️ No webhook secret provided');
    return false;
  }
  
  try {
    console.log('🔍 Verifying signature with payload length:', payload.length);
    const hmac = crypto.createHmac('sha256', secret);
    const computedSignature = hmac.update(payload).digest('hex');
    console.log('🔍 Computed signature:', computedSignature);
    console.log('🔍 Provided signature:', signature);
    
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
} 