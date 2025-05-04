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

// Define interface for pending purchase data
export interface PendingPurchase {
  priceId: string;
  packageName: string;
  timestamp: string;
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
 * Opens the Paddle checkout for a specific price
 * @param priceId The Paddle price ID to purchase
 * @param customerEmail Optional email address for the customer
 */
export const openCheckout = async (priceId: string, customerEmail?: string) => {
  // Make sure Paddle is initialized
  await initPaddle();
  
  console.log(`Opening checkout for priceId: ${priceId}, email: ${customerEmail || 'not provided'}`);
  
  // Make sure we're in the browser
  if (typeof window === 'undefined' || !window.Paddle) {
    console.error('Paddle is not available on the window object');
    return false;
  }
  
  // Open checkout with the provided priceId
  window.Paddle.Checkout.open({
    items: [{
      priceId: priceId,
      quantity: 1
    }],
    customer: customerEmail ? { email: customerEmail } : undefined,
    settings: {
      displayMode: 'overlay',
      theme: 'light',
      locale: 'en',
      successUrl: `${window.location.origin}/dashboard?checkout=success`,
    }
  });
  
  return true;
};

/**
 * Saves a pending purchase to localStorage
 * This should be called before redirecting to login
 * @param priceId The Paddle price ID to purchase
 * @param packageName The name of the package for display purposes
 * @returns true if successful, false otherwise
 */
export const savePendingPurchase = (priceId: string, packageName: string): boolean => {
  try {
    if (typeof window === 'undefined') {
      console.log('Cannot save pending purchase on server side');
      return false;
    }
    
    const pendingPurchase: PendingPurchase = {
      priceId,
      packageName,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('pendingPurchase', JSON.stringify(pendingPurchase));
    console.log(`Saved pending purchase for ${packageName}`);
    return true;
  } catch (error) {
    console.error('Error saving pending purchase:', error);
    return false;
  }
};

/**
 * Retrieves a pending purchase from localStorage
 * @returns The pending purchase data or null if not found or expired
 */
export const getPendingPurchase = (): PendingPurchase | null => {
  try {
    if (typeof window === 'undefined') {
      console.log('Cannot get pending purchase on server side');
      return null;
    }
    
    const pendingPurchaseJson = localStorage.getItem('pendingPurchase');
    if (!pendingPurchaseJson) return null;
    
    const pendingPurchase = JSON.parse(pendingPurchaseJson) as PendingPurchase;
    
    // Validate timestamp - only process if less than 30 minutes old
    const purchaseTime = new Date(pendingPurchase.timestamp).getTime();
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - purchaseTime;
    const thirtyMinutesInMs = 30 * 60 * 1000;
    
    if (timeDifference > thirtyMinutesInMs) {
      console.log('Found expired purchase intent, removing');
      localStorage.removeItem('pendingPurchase');
      return null;
    }
    
    return pendingPurchase;
  } catch (error) {
    console.error('Error getting pending purchase:', error);
    localStorage.removeItem('pendingPurchase');
    return null;
  }
};

/**
 * Clears a pending purchase from localStorage
 */
export const clearPendingPurchase = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pendingPurchase');
  console.log('Cleared pending purchase');
};

export default {
  initPaddle,
  openCheckout,
  savePendingPurchase,
  getPendingPurchase,
  clearPendingPurchase
}; 