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

// Process Paddle webhook
export async function POST(req: NextRequest) {
  console.log('🔍 Webhook received:', new Date().toISOString());
  console.log('🔍 Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));
  console.log('🔍 Request URL:', req.url);
  
  try {
    // Clone the request to preserve it for potential emergency fallback
    const reqClone = req.clone();
    
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
      const rawText = await reqClone.text();
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

      // Direct check for Paddle V2 checkout data (as seen in the error message)
      if (transactionData.customer_id) {
        // If we have a customer_id, try to use Paddle API to fetch customer details
        // (this would require additional implementation with Paddle API)
        console.log('✅ Found customer_id in transactionData:', transactionData.customer_id);
        // For now, we'll continue with other extraction methods
      }
      
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
      } else if (transactionData.custom_data && transactionData.custom_data.user_email) {
        // Paddle V2 API puts user email in custom_data
        customerEmail = transactionData.custom_data.user_email;
        console.log('✅ Found email in transactionData.custom_data.user_email:', customerEmail);
      } else if (transactionData.custom_data && transactionData.custom_data.email) {
        customerEmail = transactionData.custom_data.email;
        console.log('✅ Found email in transactionData.custom_data.email:', customerEmail);
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
          console.log('🔍 Checking items array for customer email');
          for (const item of transactionData.items) {
            // Log the item structure for debugging
            console.log('🔍 Item structure:', JSON.stringify(item));
            
            if (item.customer && item.customer.email) {
              customerEmail = item.customer.email;
              console.log('✅ Found email in item.customer.email:', customerEmail);
              break;
            }
            
            // Check for customer data in custom_data of each item
            if (item.custom_data && item.custom_data.user_email) {
              customerEmail = item.custom_data.user_email;
              console.log('✅ Found email in item.custom_data.user_email:', customerEmail);
              break;
            }
            
            // Look for customer email in price fields (sometimes it's nested there)
            if (item.price && item.price.customer && item.price.customer.email) {
              customerEmail = item.price.customer.email;
              console.log('✅ Found email in item.price.customer.email:', customerEmail);
              break;
            }
            
            // Paddle V2 may have checkout data in price properties
            if (item.price && item.price.metadata && item.price.metadata.customer_email) {
              customerEmail = item.price.metadata.customer_email;
              console.log('✅ Found email in item.price.metadata.customer_email:', customerEmail);
              break;
            }
            
            // Look in price.product path as well
            if (item.price && item.price.product && item.price.product.metadata && 
                item.price.product.metadata.customer_email) {
              customerEmail = item.price.product.metadata.customer_email;
              console.log('✅ Found email in item.price.product.metadata.customer_email:', customerEmail);
              break;
            }
            
            // Check for a buyer field that might contain email
            if (item.buyer && item.buyer.email) {
              customerEmail = item.buyer.email;
              console.log('✅ Found email in item.buyer.email:', customerEmail);
              break;
            }
          }
        }
        
        // Paddle v2 format specific check - look for checkout.customer.email
        if (!customerEmail && transactionData.checkout && transactionData.checkout.customer && transactionData.checkout.customer.email) {
          customerEmail = transactionData.checkout.customer.email;
          console.log('✅ Found email in transactionData.checkout.customer.email:', customerEmail);
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
        
        // Paddle V2 specific emergency fallback
        // Sometimes checkout data is included in an odd location - try to search for any 'email' string
        try {
          const rawDataString = JSON.stringify(transactionData);
          const emailMatches = rawDataString.match(/"email":\s*"([^"]+)"/);
          if (emailMatches && emailMatches[1]) {
            customerEmail = emailMatches[1];
            console.log('✅ Found email using emergency fallback match:', customerEmail);
          }
        } catch (error) {
          console.error('❌ Error during emergency email extraction:', error);
        }
        
        // Extra fallback for Paddle V2: get transaction details through API
        if (!customerEmail && transactionData.id) {
          // This would be the place to make a direct API call to Paddle API
          // to fetch transaction details including customer email
          console.log('⚠️ Potential fallback: Fetch customer details from Paddle API for transaction ID:', transactionData.id);
          
          // For now, we'll just attempt one more regex approach
          try {
            // Get the raw request text again to look for email patterns
            const rawString = JSON.stringify(body);
            console.log('🔍 Searching raw webhook body for email pattern');
            
            // Try to find any email-like pattern in the payload
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
            const emailMatch = rawString.match(emailRegex);
            
            if (emailMatch && emailMatch[0]) {
              customerEmail = emailMatch[0];
              console.log('✅ Found email using regex pattern match:', customerEmail);
            }
          } catch (error) {
            console.error('❌ Error during final email extraction attempt:', error);
          }
        }
        
        // Check if we can fallback to a default test user for development
        if (!customerEmail && process.env.NODE_ENV === 'development' && process.env.TEST_USER_EMAIL) {
          console.log('⚠️ Using test user email as fallback in development mode');
          customerEmail = process.env.TEST_USER_EMAIL;
        } else if (!customerEmail) {
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
        // Try to extract information directly from the transaction
        
        // Check if we have product info directly on the transaction
        if (transactionData.product_id) {
          console.log('🔍 Found product_id directly on transaction:', transactionData.product_id);
          
          // Try to determine package from product_id
          if (typeof transactionData.product_id === 'string' && transactionData.product_id.includes('_')) {
            const parts = transactionData.product_id.split('_');
            packageName = parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1);
            console.log('✅ Extracted package name from transaction product_id:', packageName);
            
            // Extract credits based on the derived package name
            creditsToAdd = CREDIT_PACKAGES[packageName as keyof typeof CREDIT_PACKAGES] || 0;
            if (creditsToAdd > 0) {
              console.log('✅ Determined credits to add from product_id:', creditsToAdd);
              
              // Skip to recording the transaction
              try {
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
                  message: 'Transaction processed successfully with fallback method',
                  credits_added: creditsToAdd
                });
              } catch (dbError) {
                console.error('❌ Database error:', dbError);
                return NextResponse.json({ error: 'Database error' }, { status: 500 });
              }
            }
          }
        }
        
        // If we still can't determine the package, return an error
        return NextResponse.json({ error: 'No line items found' }, { status: 400 });
      }
      
      console.log('🔍 Processing line items:', JSON.stringify(lineItems));
      
      // Try to extract product name from the first item
      const firstItem = lineItems[0];
      
      // Debug log the first item structure
      console.log('🔍 First item structure:', JSON.stringify(firstItem));
      
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
      } else if (firstItem.price && firstItem.price.description) {
        // Paddle V2 often uses a description field instead of name
        const description = firstItem.price.description;
        // Extract package name from description (e.g., "Starter Package" -> "Starter")
        const match = description.match(/^(\w+)(\s+Package)?$/i);
        if (match) {
          packageName = match[1];
          console.log('✅ Extracted package name from price.description:', packageName);
        } else {
          packageName = description;
          console.log('✅ Using price.description as package name:', packageName);
        }
      } else {
        // Try searching for the product/price info in a different structure
        if (firstItem.price && firstItem.price.id && firstItem.price.id.includes('_')) {
          // Sometimes the price_id contains info like "pri_starter" we can extract
          const parts = firstItem.price.id.split('_');
          if (parts.length > 1) {
            packageName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1); // Capitalize first letter
            console.log('✅ Extracted package name from price.id:', packageName);
          }
        } else if (firstItem.price_id && firstItem.price_id.includes('_')) {
          // Handle direct price_id field (in some Paddle formats)
          const parts = firstItem.price_id.split('_');
          if (parts.length > 1) {
            packageName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1); // Capitalize first letter
            console.log('✅ Extracted package name from price_id:', packageName);
          }
        }
        
        // Special handling for Paddle V2 formats where the package info might be nested differently
        if (packageName === 'Unknown Package' && firstItem.price && firstItem.price.product) {
          if (firstItem.price.product.name) {
            packageName = firstItem.price.product.name;
            console.log('✅ Found package name in firstItem.price.product.name:', packageName);
          } else if (firstItem.price.product.description) {
            packageName = firstItem.price.product.description;
            console.log('✅ Found package name in firstItem.price.product.description:', packageName);
          } else if (firstItem.price.product.id && firstItem.price.product.id.includes('_')) {
            // Extract from product id if it contains semantic information
            const parts = firstItem.price.product.id.split('_');
            if (parts.length > 1) {
              packageName = parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1);
              console.log('✅ Extracted package name from product.id:', packageName);
            }
          }
        }
      }
      
      // Extract credit amount from the package name
      creditsToAdd = CREDIT_PACKAGES[packageName as keyof typeof CREDIT_PACKAGES] || 0;
      console.log('🔍 Package:', packageName, 'Credits to add:', creditsToAdd);

      if (creditsToAdd <= 0) {
        console.error('❌ Invalid credit package or package not found:', packageName);
        console.log('🔍 Available packages:', Object.keys(CREDIT_PACKAGES).join(', '));
        
        // Log normalized package name for debugging
        const normalizedPackageName = packageName.toLowerCase().trim();
        console.log('🔍 Normalized package name:', normalizedPackageName);
        console.log('🔍 All package keys (lowercase):', Object.keys(CREDIT_PACKAGES).map(k => k.toLowerCase()).join(', '));
        
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
          // Check raw transaction data for clues about the package size
          try {
            const transactionAmount = parseFloat(transactionData.amount || '0');
            console.log('🔍 Transaction amount:', transactionAmount);
            
            // Use the transaction amount to determine package size
            if (transactionAmount > 0) {
              if (transactionAmount <= 10) {
                packageName = 'Starter';
                creditsToAdd = CREDIT_PACKAGES['Starter'];
              } else if (transactionAmount <= 25) {
                packageName = 'Pro';
                creditsToAdd = CREDIT_PACKAGES['Pro'];
              } else if (transactionAmount <= 50) {
                packageName = 'Creator';
                creditsToAdd = CREDIT_PACKAGES['Creator'];
              } else {
                packageName = 'Power';
                creditsToAdd = CREDIT_PACKAGES['Power'];
              }
              console.log('🔍 Determined package based on amount:', packageName, 'Credits:', creditsToAdd);
            } else {
              // Default to Starter package as fallback
              packageName = 'Starter';
              creditsToAdd = CREDIT_PACKAGES['Starter'];
              console.log('🔍 Using default package as fallback:', packageName, 'Credits:', creditsToAdd);
            }
          } catch (err) {
            // Default to Starter package as fallback on error
            packageName = 'Starter';
            creditsToAdd = CREDIT_PACKAGES['Starter'];
            console.log('🔍 Using default package as fallback due to error:', packageName, 'Credits:', creditsToAdd);
          }
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