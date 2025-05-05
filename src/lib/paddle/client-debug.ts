/**
 * DEPRECATED: This file is deprecated and should not be used in production code.
 * Please use the standard client.ts instead for all production code.
 * 
 * Enhanced Paddle Client with detailed debugging capabilities
 * Extends the base client with comprehensive logging and error handling
 */

// Define a global type for Paddle
declare global {
  interface Window {
    Paddle: any;
  }
}

/**
 * Ensures the Paddle.js script is loaded with detailed error logging
 */
const loadPaddleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      console.error('[PaddleDebug] Cannot load Paddle script on server side');
      reject(new Error('Cannot load Paddle script on server side'));
      return;
    }

    // If Paddle is already loaded, resolve immediately
    if (window.Paddle) {
      console.log('[PaddleDebug] Paddle already loaded');
      resolve();
      return;
    }

    console.log('[PaddleDebug] Loading Paddle script...');
    
    try {
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.async = true;
      
      // Add detailed event listeners for debugging
      script.addEventListener('load', () => {
        console.log('[PaddleDebug] Paddle script loaded successfully');
        
        // Check if Paddle is actually available
        if (window.Paddle) {
          console.log('[PaddleDebug] Paddle object is available in window');
          resolve();
        } else {
          const error = new Error('Paddle script loaded but Paddle object is not available');
          console.error('[PaddleDebug]', error);
          reject(error);
        }
      });
      
      script.addEventListener('error', (e) => {
        const errorMsg = 'Failed to load Paddle.js script';
        console.error('[PaddleDebug]', errorMsg, e);
        reject(new Error(errorMsg));
      });
      
      // Add a timeout to detect if script loading takes too long
      const timeout = setTimeout(() => {
        if (!window.Paddle) {
          const timeoutError = new Error('Timeout while loading Paddle.js script');
          console.error('[PaddleDebug]', timeoutError);
          reject(timeoutError);
        }
      }, 10000); // 10 second timeout
      
      // Clear timeout when script loads
      script.addEventListener('load', () => clearTimeout(timeout));
      
      // Append the script to the document
      document.head.appendChild(script);
      console.log('[PaddleDebug] Script tag added to document head');
    } catch (error) {
      console.error('[PaddleDebug] Error while creating script element:', error);
      reject(error);
    }
  });
};

/**
 * Initializes the Paddle client with detailed logging
 */
export const initPaddle = async () => {
  if (typeof window === 'undefined') {
    console.log("[PaddleDebug] Server-side execution detected, skipping Paddle initialization");
    return null;
  }

  try {
    console.log('[PaddleDebug] Starting Paddle initialization...');
    
    // Check environment variables
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT;
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    
    if (!environment) {
      console.error('[PaddleDebug] Missing NEXT_PUBLIC_PADDLE_ENVIRONMENT environment variable');
    }
    
    if (!token) {
      console.error('[PaddleDebug] Missing NEXT_PUBLIC_PADDLE_CLIENT_TOKEN environment variable');
    }
    
    console.log(`[PaddleDebug] Environment: ${environment || 'not set'}`);
    console.log(`[PaddleDebug] Token available: ${!!token}`);
    
    // Ensure Paddle script is loaded
    await loadPaddleScript();
    
    // Set environment
    try {
      console.log(`[PaddleDebug] Setting Paddle environment to: ${environment || 'sandbox'}`);
      window.Paddle.Environment.set(environment || 'sandbox');
    } catch (envError) {
      console.error('[PaddleDebug] Failed to set Paddle environment:', envError);
      throw envError;
    }
    
    // Initialize Paddle with client token and detailed event logging
    try {
      if (window.Paddle.Initialized) {
        console.log('[PaddleDebug] Paddle already initialized, updating settings');
        window.Paddle.Update({
          token: token,
        });
      } else {
        console.log('[PaddleDebug] Initializing Paddle for the first time');
        
        // Store original console methods for logging preservation
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        
        // Define a detailed event callback
        const detailedEventCallback = (event: any) => {
          const eventType = event.name;
          const eventData = event.data;
          
          originalConsoleLog(`[PaddleDebug] Event: ${eventType}`);
          
          // Log specific event details based on event type
          switch (eventType) {
            case 'checkout.error':
              originalConsoleError('[PaddleDebug] Checkout Error:', eventData);
              break;
            case 'checkout.completed':
              originalConsoleLog('[PaddleDebug] Checkout Completed Successfully:', eventData);
              break;
            case 'checkout.closed':
              originalConsoleLog('[PaddleDebug] Checkout Closed:', eventData);
              break;
            case 'checkout.loaded':
              originalConsoleLog('[PaddleDebug] Checkout Loaded');
              break;
            default:
              originalConsoleLog(`[PaddleDebug] Event Data:`, eventData);
          }
        };
        
        // Initialize with detailed callback
        window.Paddle.Initialize({
          token: token,
          eventCallback: detailedEventCallback
        });
      }
    } catch (initError: any) {
      console.error('[PaddleDebug] Failed to initialize Paddle:', initError);
      
      // Provide more context about common initialization errors
      if (initError.message?.includes('token')) {
        console.error('[PaddleDebug] Invalid or missing token. Check your environment variables.');
      } else if (initError.message?.includes('environment')) {
        console.error('[PaddleDebug] Invalid environment. Valid values are "sandbox" or "production".');
      }
      
      throw initError;
    }

    // Verify initialization
    if (window.Paddle.Initialized) {
      console.log("[PaddleDebug] Paddle initialization successful");
      
      // Log Paddle version and settings
      try {
        console.log(`[PaddleDebug] Paddle Version: ${window.Paddle.version || 'Unknown'}`);
        console.log(`[PaddleDebug] Current Environment: ${window.Paddle.Environment.get()}`);
        console.log(`[PaddleDebug] Checkout Available: ${!!window.Paddle.Checkout}`);
      } catch (e) {
        console.warn('[PaddleDebug] Could not get Paddle version or settings:', e);
      }
      
      return window.Paddle;
    } else {
      console.error('[PaddleDebug] Paddle.Initialized is false after initialization attempt');
      return null;
    }
  } catch (error) {
    console.error('[PaddleDebug] Critical error during Paddle initialization:', error);
    return null;
  }
};

/**
 * Opens a Paddle checkout with enhanced error handling and debugging
 */
export const openCheckoutDebug = async (priceId: string, customerEmail?: string) => {
  try {
    console.log(`[PaddleDebug] Opening checkout for priceId: ${priceId}`);
    console.log(`[PaddleDebug] Customer email: ${customerEmail || 'not provided'}`);
    
    // Make sure Paddle is initialized
    const paddle = await initPaddle();
    if (!paddle) {
      const error = new Error('Failed to initialize Paddle, cannot open checkout');
      console.error('[PaddleDebug]', error);
      throw error;
    }
    
    // Check if checkout is available
    if (!paddle.Checkout) {
      const error = new Error('Paddle.Checkout is not available. This may indicate incomplete onboarding.');
      console.error('[PaddleDebug]', error);
      throw error;
    }

    console.log('[PaddleDebug] Creating checkout with Paddle...');
    
    // Log browser information
    console.log(`[PaddleDebug] Browser: ${navigator.userAgent}`);
    console.log(`[PaddleDebug] URL: ${window.location.href}`);
    
    // Monitor network activity
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : 'unknown';
      if (url.includes('paddle.com')) {
        console.log(`[PaddleDebug] Network request to: ${url}`);
      }
      return originalFetch.apply(this, [input, init as any]);
    };
    
    // Prepare checkout options with detailed callbacks
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
        locale: 'en',
      },
      customData: {
        source: 'debug_checkout',
        timestamp: new Date().toISOString()
      },
      successCallback: (data: any) => {
        console.log('[PaddleDebug] Checkout completed successfully:', data);
        
        // Restore original fetch
        window.fetch = originalFetch;
        
        // Notify user about successful purchase
        if (typeof window !== 'undefined') {
          try {
            // Display native toast if available
            const event = new CustomEvent('paddle:purchase:success', { 
              detail: { data } 
            });
            window.dispatchEvent(event);
          } catch (e) {
            console.error('[PaddleDebug] Error dispatching success event:', e);
          }
        }
      },
      closeCallback: () => {
        console.log('[PaddleDebug] Checkout closed by user');
        
        // Restore original fetch
        window.fetch = originalFetch;
      },
      errorCallback: (error: any) => {
        console.error('[PaddleDebug] Checkout error:', error);
        
        // Restore original fetch
        window.fetch = originalFetch;
        
        // Analyze common errors
        if (error?.code === 'checkout_not_enabled') {
          console.error('[PaddleDebug] Checkout not enabled for your Paddle account. Check your account setup.');
        } else if (error?.message?.includes('domain')) {
          console.error('[PaddleDebug] Domain error. Current domain:', window.location.host);
          console.error('[PaddleDebug] Make sure this domain is approved in your Paddle Dashboard.');
        } else if (error?.code === 'invalid_price_id') {
          console.error('[PaddleDebug] Invalid price ID. Make sure the price ID exists in your Paddle dashboard.');
        }
      }
    };
    
    // Log checkout options for debugging
    console.log('[PaddleDebug] Checkout options:', JSON.stringify(checkoutOptions, null, 2));
    
    // Create and open the checkout
    console.log('[PaddleDebug] Calling Paddle.Checkout.open()...');
    
    try {
      paddle.Checkout.open(checkoutOptions);
      console.log('[PaddleDebug] Paddle.Checkout.open() called successfully');
      
      // Check if checkout is actually visible
      setTimeout(() => {
        const checkoutIframe = document.querySelector('iframe[src*="paddle.com"]');
        if (checkoutIframe) {
          console.log('[PaddleDebug] Checkout iframe found in DOM');
        } else {
          console.warn('[PaddleDebug] No checkout iframe found in DOM after 1 second');
          console.warn('[PaddleDebug] This may indicate a silent failure or domain configuration issue');
        }
      }, 1000);
      
      return true;
    } catch (checkoutError) {
      console.error('[PaddleDebug] Error opening checkout:', checkoutError);
      
      // Restore original fetch
      window.fetch = originalFetch;
      
      throw checkoutError;
    }
  } catch (error) {
    console.error('[PaddleDebug] Critical error during checkout open:', error);
    return false;
  }
};

/**
 * Exports for external use
 */
export default {
  init: initPaddle,
  openCheckout: openCheckoutDebug
}; 