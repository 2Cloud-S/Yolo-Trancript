/**
 * Paddle Client for integration with Paddle.js
 * Using script injection approach to avoid SDK compatibility issues
 */

// Define a global type for Paddle
declare global {
  interface Window {
    Paddle: any;
  }
}

/**
 * Ensures the Paddle.js script is loaded
 */
const loadPaddleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      console.log('Cannot load Paddle script on server side');
      reject('Cannot load Paddle script on server side');
      return;
    }

    // If Paddle is already loaded, resolve immediately
    if (window.Paddle) {
      console.log('Paddle already loaded');
      resolve();
      return;
    }

    console.log('Loading Paddle script...');
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => {
      console.log('Paddle script loaded successfully');
      resolve();
    };
    script.onerror = (e) => {
      console.error('Failed to load Paddle.js script:', e);
      reject(new Error('Failed to load Paddle.js'));
    };
    document.head.appendChild(script);
  });
};

/**
 * Initializes the Paddle client on the client side.
 * This should be called in a client component, typically near the top of your application.
 */
export const initPaddle = async () => {
  if (typeof window === 'undefined') {
    console.log("Server-side execution detected, skipping Paddle initialization");
    return null; // Return early if running on the server
  }

  try {
    // Ensure Paddle script is loaded
    await loadPaddleScript();
    
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox';
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
    
    console.log(`Initializing Paddle with environment: ${environment}, token exists: ${!!token}`);
    
    // Set environment
    window.Paddle.Environment.set(environment);
    
    // Initialize Paddle with client token
    if (window.Paddle.Initialized) {
      console.log('Paddle already initialized, updating settings');
      window.Paddle.Update({
        token: token,
      });
    } else {
      console.log('Initializing Paddle for the first time');
      window.Paddle.Initialize({
        token: token,
        eventCallback: (event: any) => {
          console.log('Paddle event:', event.name, event.data);
        }
      });
    }

    console.log("Paddle initialization successful");
    return window.Paddle;
  } catch (error) {
    console.error('Failed to initialize Paddle:', error);
    return null;
  }
};

/**
 * Utility function to open a Paddle checkout for a specific price ID
 * @param priceId The Paddle price ID to purchase
 * @param customerEmail Optional customer email to prefill
 */
export const openCheckout = async (priceId: string, customerEmail?: string) => {
  try {
    console.log(`Opening checkout for priceId: ${priceId}, email: ${customerEmail || 'not provided'}`);
    
    // Make sure Paddle is initialized
    const paddle = await initPaddle();
    if (!paddle) {
      console.error('Failed to initialize Paddle, cannot open checkout');
      throw new Error('Paddle is not initialized');
    }

    console.log('Creating checkout with Paddle...');
    // Create and open the checkout
    const checkout = await paddle.Checkout.open({
      items: [
        {
          priceId: priceId,
          quantity: 1,
        },
      ],
      customer: customerEmail ? { email: customerEmail } : undefined,
      successUrl: `${window.location.origin}/dashboard?checkout=success`,
      closeCallback: () => {
        console.log('Checkout closed via callback');
      },
    });

    console.log("Checkout opened successfully");
    return checkout;
  } catch (error) {
    console.error('Error opening checkout:', error);
    throw error;
  }
};

export default {
  initPaddle,
  openCheckout,
}; 