import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Test endpoint that simulates various Paddle webhook events
 * This helps with testing and debugging the webhook handler
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const eventType = body.event_type || 'transaction.completed';
    const email = body.email || 'test@example.com';
    const packageName = body.package_name || 'Starter';
    const structure = body.structure || 'default'; // Different payload structures
    
    console.log('Generating test webhook event:', { eventType, email, packageName, structure });
    
    // Get webhook secret
    const secret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({
        error: 'Missing webhook secret',
        message: 'PADDLE_NOTIFICATION_WEBHOOK_SECRET is not set in environment variables'
      }, { status: 500 });
    }
    
    // Generate a mock transaction.completed event
    let eventData;
    
    // Create different event types
    if (eventType === 'transaction.completed') {
      eventData = generateCompletedEvent(email, packageName, structure);
    } else if (eventType === 'transaction.updated') {
      eventData = generateUpdatedEvent(email, packageName, structure);
    } else {
      eventData = {
        event_id: `evt_${generateId()}`,
        event_type: eventType,
        occurred_at: new Date().toISOString(),
        notification_id: `ntf_${generateId()}`,
        data: {
          id: `txn_${generateId()}`,
          status: 'completed',
          customer: {
            email: email
          },
          items: [
            {
              product: {
                name: packageName
              }
            }
          ]
        }
      };
    }
    
    // Serialize the payload
    const rawPayload = JSON.stringify(eventData);
    
    // Create a signature
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const hmac = crypto.createHmac('sha256', secret);
    const data = `${timestamp}:${rawPayload}`;
    const hash = hmac.update(data).digest('hex');
    const signature = `ts=${timestamp};h1=${hash}`;
    
    // Create a curl command to test this
    const curlCommand = `curl -X POST https://www.yolo-transcript.com/api/webhook \\
  -H "Content-Type: application/json" \\
  -H "paddle-signature: ${signature}" \\
  -d '${rawPayload}'`;
    
    return NextResponse.json({
      success: true,
      message: 'Test event generated',
      event: eventData,
      signature: signature,
      curlCommand: curlCommand,
      instructions: 'Use the curl command to test your webhook handler with this event'
    });
  } catch (error) {
    console.error('Error generating test event:', error);
    return NextResponse.json({
      error: 'Failed to generate test event',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Generate a completed transaction event
function generateCompletedEvent(email: string, packageName: string, structure: string = 'default') {
  const transactionId = `txn_${generateId()}`;
  
  // Create different structure types to match real-world Paddle webhooks
  if (structure === 'minimal') {
    // Minimal structure without nested objects
    return {
      event_id: `evt_${generateId()}`,
      event_type: 'transaction.completed',
      occurred_at: new Date().toISOString(),
      notification_id: `ntf_${generateId()}`,
      data: {
        id: transactionId,
        status: 'completed',
        email: email, // Direct email field instead of nested
        items: [
          {
            price_id: `pri_${packageName.toLowerCase()}`,
            quantity: 1
          }
        ],
        amount: 49.99,
        currency_code: 'USD'
      }
    };
  } else if (structure === 'paddle_v2') {
    // Structure matching Paddle v2 API format
    return {
      event_id: `evt_${generateId()}`,
      event_type: 'transaction.completed',
      occurred_at: new Date().toISOString(),
      notification_id: `ntf_${generateId()}`,
      data: {
        id: transactionId,
        status: 'completed',
        items: [
          {
            price: {
              id: `pri_${packageName.toLowerCase()}`,
              description: `${packageName} Package`
            },
            quantity: 1
          }
        ],
        customer_id: `ctm_${generateId()}`,
        address_id: `add_${generateId()}`,
        business_id: null,
        custom_data: {
          user_email: email
        },
        collection_mode: 'automatic',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        billed_at: new Date().toISOString(),
        details: {
          totals: {
            subtotal: '4999',
            tax: '0',
            total: '4999',
            grand_total: '4999',
            fee: '0',
            earnings: '4999',
            currency_code: 'USD'
          },
          tax_rates_used: []
        }
      }
    };
  } else {
    // Default structure (the one that's been working in our tests)
    return {
      event_id: `evt_${generateId()}`,
      event_type: 'transaction.completed',
      occurred_at: new Date().toISOString(),
      notification_id: `ntf_${generateId()}`,
      data: {
        id: transactionId,
        status: 'completed',
        customer: {
          email: email
        },
        items: [
          {
            price: {
              product_name: packageName
            },
            product: {
              name: packageName
            }
          }
        ],
        billing_details: {
          email: email
        },
        amount: 49.99,
        currency_code: 'USD'
      }
    };
  }
}

// Generate an updated transaction event
function generateUpdatedEvent(email: string, packageName: string, structure: string = 'default') {
  const transactionId = `txn_${generateId()}`;
  return {
    event_id: `evt_${generateId()}`,
    event_type: 'transaction.updated',
    occurred_at: new Date().toISOString(),
    notification_id: `ntf_${generateId()}`,
    data: {
      id: transactionId,
      status: 'completed',
      customer: {
        email: email
      },
      items: [
        {
          price: {
            product_name: packageName
          },
          product: {
            name: packageName
          }
        }
      ],
      billing_details: {
        email: email
      }
    }
  };
}

// Generate a random ID similar to Paddle's format
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to generate a test event',
    example: {
      event_type: 'transaction.completed',
      email: 'user@example.com',
      package_name: 'Starter'
    }
  });
} 