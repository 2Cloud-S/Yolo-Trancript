import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Test endpoint for Paddle webhook secret verification
 * This helps verify if your webhook secret is correctly set and working
 */
export async function POST(req: NextRequest) {
  try {
    // Get the test payload
    const rawBody = await req.text();
    let payload;
    
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({
        error: 'Invalid JSON payload',
        message: 'The request body must be valid JSON'
      }, { status: 400 });
    }
    
    // Get our webhook secret
    const secret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({
        error: 'Missing webhook secret',
        message: 'PADDLE_NOTIFICATION_WEBHOOK_SECRET is not set in environment variables'
      }, { status: 500 });
    }
    
    // Create a test signature
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const hmac = crypto.createHmac('sha256', secret);
    const data = `${timestamp}:${rawBody}`;
    const hash = hmac.update(data).digest('hex');
    
    // Form the signature header as Paddle would
    const signature = `ts=${timestamp};h1=${hash}`;
    
    return NextResponse.json({
      success: true,
      message: 'Webhook secret is configured',
      testSignature: signature,
      webhookSecretConfigured: !!secret,
      webhookSecretMasked: secret ? `${secret.substring(0, 3)}...${secret.substring(secret.length - 3)}` : null,
      timestampUsed: timestamp,
      signatureFormat: 'ts={timestamp};h1={hash}',
      testInstructions: 'Use this signature in the paddle-signature header when sending test requests'
    });
  } catch (error) {
    console.error('Error in test-secret endpoint:', error);
    return NextResponse.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method with a JSON payload to test the webhook signature generation'
  });
} 