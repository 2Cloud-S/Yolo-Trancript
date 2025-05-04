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
  try {
    // Get the raw request body for signature verification
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const paddleSignature = req.headers.get('paddle-signature');
    
    if (!paddleSignature) {
      console.error('No Paddle signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 401 });
    }

    // Verify webhook signature
    const isValid = verifyPaddleSignature(
      rawBody,
      paddleSignature,
      process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET || ''
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Process different webhook event types
    const eventType = body.event_type;
    console.log(`Processing Paddle webhook: ${eventType}`);

    // Initialize Supabase admin client
    const supabase = createAdminClient();

    // Handle transaction completed event
    if (eventType === 'transaction.completed') {
      // Extract data from the webhook
      const { transaction, customer } = body.data;
      
      if (!transaction || !customer) {
        return NextResponse.json({ error: 'Missing transaction or customer data' }, { status: 400 });
      }

      // Find the user by email
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', customer.email)
        .single();

      if (userError || !userData) {
        console.error('User not found:', customer.email, userError);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Get the package name and credits
      const lineItems = transaction.items || [];
      if (lineItems.length === 0) {
        return NextResponse.json({ error: 'No line items found' }, { status: 400 });
      }

      const packageName = lineItems[0].product.name || 'Unknown Package';
      const creditsToAdd = CREDIT_PACKAGES[packageName as keyof typeof CREDIT_PACKAGES] || 0;

      if (creditsToAdd <= 0) {
        console.error('Invalid credit package:', packageName);
        return NextResponse.json({ error: 'Invalid credit package' }, { status: 400 });
      }

      // Record the transaction
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
        console.error('Error recording transaction:', txError);
        return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
      }

      // Check if user already has a credit balance
      const { data: userCredits, error: creditsError } = await supabase
        .from('user_credits')
        .select('id, credits_balance')
        .eq('user_id', userData.id)
        .single();

      if (creditsError && creditsError.code !== 'PGRST116') { // Not found error
        console.error('Error checking user credits:', creditsError);
        return NextResponse.json({ error: 'Failed to check user credits' }, { status: 500 });
      }

      // Update or create user credits
      if (userCredits) {
        // Update existing balance
        const { error: updateError } = await supabase
          .from('user_credits')
          .update({
            credits_balance: userCredits.credits_balance + creditsToAdd
          })
          .eq('id', userCredits.id);

        if (updateError) {
          console.error('Error updating user credits:', updateError);
          return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
        }
      } else {
        // Create new balance
        const { error: createError } = await supabase
          .from('user_credits')
          .insert({
            user_id: userData.id,
            credits_balance: creditsToAdd
          });

        if (createError) {
          console.error('Error creating user credits:', createError);
          return NextResponse.json({ error: 'Failed to create credits' }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true });
    }

    // Default response for unhandled events
    return NextResponse.json({ success: true, message: 'Event received but not processed' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Validate the webhook signature from Paddle
function verifyPaddleSignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) {
    console.warn('No webhook secret provided');
    return false;
  }
  
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const computedSignature = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
} 