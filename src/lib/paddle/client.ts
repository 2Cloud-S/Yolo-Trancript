/**
 * Paddle Client for integration with Paddle.js
 * We use script injection approach to avoid TypeScript errors with the Paddle SDK
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
      reject('Cannot load Paddle script on server side');
      return;
    }

    // If Paddle is already loaded, resolve immediately
    if (window.Paddle) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paddle.js'));
    document.head.appendChild(script);
  });
};

/**
 * Initializes the Paddle client on the client side.
 * This should be called in a client component, typically near the top of your application.
 */
export const initPaddle = async () => {
  if (typeof window === 'undefined') {
    return null; // Return early if running on the server
  }

  try {
    // Ensure Paddle script is loaded
    await loadPaddleScript();
    
    // Set environment
    window.Paddle.Environment.set(process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox');
    
    // Initialize Paddle with client token
    if (window.Paddle.Initialized) {
      window.Paddle.Update({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
      });
    } else {
      window.Paddle.Initialize({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '',
      });
    }

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
    // Make sure Paddle is initialized
    const paddle = await initPaddle();
    if (!paddle) {
      throw new Error('Paddle is not initialized');
    }

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
        console.log('Checkout closed');
      },
    });

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