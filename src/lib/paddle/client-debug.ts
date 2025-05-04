/**
 * Enhanced Debug Paddle Client with better error handling and diagnostics
 * This can be used as a drop-in replacement for client.ts when debugging checkout issues
 */

// Define a global type for Paddle
declare global {
  interface Window {
    Paddle: any;
  }
}

/**
 * Ensures the Paddle.js script is loaded with enhanced error handling
 */
const loadPaddleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      console.log('[PaddleDebug] Cannot load Paddle script on server side');
      reject(new Error('Cannot load Paddle script on server side'));
      return;
    }

    // If Paddle is already loaded, resolve immediately
    if (window.Paddle) {
      console.log('[PaddleDebug] Paddle script already loaded');
      resolve();
      return;
    }

    console.log('[PaddleDebug] Loading Paddle script...');
    
    // Create a timeout to detect if script loading takes too long
    const timeout = setTimeout(() => {
      console.warn('[PaddleDebug] Paddle script loading timeout - this may indicate network issues');
    }, 5000);

    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => {
      clearTimeout(timeout);
      console.log('[PaddleDebug] Paddle script loaded successfully');
      
      // Verify that Paddle object is properly defined
      if (!window.Paddle) {
        console.error('[PaddleDebug] Paddle script loaded but window.Paddle is not defined');
        reject(new Error('Paddle object not defined after script load'));
        return;
      }
      
      if (!window.Paddle.Checkout) {
        console.error('[PaddleDebug] Paddle loaded but Checkout module is missing');
        reject(new Error('Paddle.Checkout module not available'));
        return;
      }
      
      console.log('[PaddleDebug] Paddle script verified and ready');
      resolve();
    };
    script.onerror = (e) => {
      clearTimeout(timeout);
      console.error('[PaddleDebug] Failed to load Paddle.js script:', e);
      reject(new Error('Failed to load Paddle.js'));
    };
    document.head.appendChild(script);
  });
};

/**
 * Initializes the Paddle client on the client side with enhanced debugging.
 * This should be called in a client component.
 */
export const initPaddle = async () => {
  if (typeof window === 'undefined') {
    console.log("[PaddleDebug] Server-side execution detected, skipping Paddle initialization");
    return null; // Return early if running on the server
  }

  try {
    console.log("[PaddleDebug] Starting Paddle initialization...");
    
    // Log environment information
    console.log("[PaddleDebug] Browser:", navigator.userAgent);
    console.log("[PaddleDebug] Location:", window.location.href);
    
    // Check if environment variables are set
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox';
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    
    if (!token) {
      console.error("[PaddleDebug] No Paddle client token found in environment variables");
      throw new Error("Paddle client token not found");
    }
    
    console.log(`[PaddleDebug] Configuration - Environment: ${environment}, Token length: ${token.length}`);
    
    // Ensure Paddle script is loaded
    await loadPaddleScript();
    
    // Set environment
    try {
      window.Paddle.Environment.set(environment);
      console.log(`[PaddleDebug] Environment set to: ${environment}`);
    } catch (envError) {
      console.error("[PaddleDebug] Error setting Paddle environment:", envError);
      throw new Error(`Failed to set Paddle environment to ${environment}`);
    }
    
    // Initialize Paddle with client token
    try {
      if (window.Paddle.Initialized) {
        console.log('[PaddleDebug] Paddle already initialized, updating settings');
        window.Paddle.Update({
          token: token,
          eventCallback: (event: any) => {
            console.log('[PaddleDebug] Paddle event:', event.name, event.data);
            
            // Special handling for warning and error events
            if (event.name.includes('warning') || event.name.includes('error')) {
              console.warn('[PaddleDebug] Paddle event warning/error:', event);
            }
          }
        });
      } else {
        console.log('[PaddleDebug] Initializing Paddle for the first time');
        window.Paddle.Initialize({
          token: token,
          eventCallback: (event: any) => {
            console.log('[PaddleDebug] Paddle event:', event.name, event.data);
            
            // Special handling for warning and error events
            if (event.name.includes('warning') || event.name.includes('error')) {
              console.warn('[PaddleDebug] Paddle event warning/error:', event);
            }
          }
        });
      }
    } catch (initError) {
      console.error("[PaddleDebug] Error during Paddle initialization:", initError);
      throw new Error("Failed to initialize Paddle");
    }

    // Verify Paddle is properly initialized
    if (!window.Paddle.Checkout || typeof window.Paddle.Checkout.open !== 'function') {
      console.error("[PaddleDebug] Paddle initialized but Checkout.open is not available");
      throw new Error("Paddle Checkout not available after initialization");
    }

    console.log("[PaddleDebug] Paddle initialization successful and verified");
    return window.Paddle;
  } catch (error) {
    console.error('[PaddleDebug] Failed to initialize Paddle:', error);
    return null;
  }
};

/**
 * Utility function to open a Paddle checkout for a specific price ID with enhanced error handling
 */
export const openCheckout = async (priceId: string, customerEmail?: string) => {
  try {
    console.log(`[PaddleDebug] Opening checkout for priceId: ${priceId}, email: ${customerEmail || 'not provided'}`);
    
    if (!priceId) {
      throw new Error("Price ID is required to open checkout");
    }
    
    // Make sure Paddle is initialized
    const paddle = await initPaddle();
    if (!paddle) {
      console.error('[PaddleDebug] Failed to initialize Paddle, cannot open checkout');
      throw new Error('Paddle is not initialized');
    }

    console.log('[PaddleDebug] Creating checkout with Paddle...');
    
    // Prepare checkout options
    const checkoutOptions = {
      items: [
        {
          priceId: priceId,
          quantity: 1,
        },
      ],
      customer: customerEmail ? { email: customerEmail } : undefined,
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'en'
      },
      successUrl: `${window.location.origin}/dashboard?checkout=success`,
      closeCallback: () => {
        console.log('[PaddleDebug] Checkout closed via callback');
      },
    };
    
    console.log('[PaddleDebug] Checkout options:', JSON.stringify(checkoutOptions, null, 2));
    
    // Create and open the checkout
    try {
      const checkout = await paddle.Checkout.open(checkoutOptions);
      console.log("[PaddleDebug] Checkout opened successfully", checkout);
      return checkout;
    } catch (checkoutError: any) {
      console.error('[PaddleDebug] Error in Paddle.Checkout.open:', checkoutError);
      
      // Try to determine the specific error
      if (checkoutError?.message?.includes('checkout_not_enabled')) {
        console.error('[PaddleDebug] Checkout not enabled for this account - check Paddle onboarding status');
      } else if (checkoutError?.message?.includes('domain')) {
        console.error('[PaddleDebug] Domain not approved for checkout - check Paddle domain settings');
      }
      
      throw checkoutError;
    }
  } catch (error) {
    console.error('[PaddleDebug] Error opening checkout:', error);
    throw error;
  }
};

export default {
  initPaddle,
  openCheckout,
}; 