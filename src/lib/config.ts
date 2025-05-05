// Debug configuration settings
export const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG === 'true';
export const DEBUG_CREDENTIALS = process.env.NEXT_PUBLIC_DEBUG_CREDENTIALS === 'true';
export const DEBUG_API = process.env.NEXT_PUBLIC_DEBUG_API === 'true';
export const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';

// Function to log with conditional debugging
export function debugLog(area: string, message: string, data?: any) {
  if (!DEBUG_MODE) return;
  
  // Check area-specific debug flags
  if (area === 'credentials' && !DEBUG_CREDENTIALS) return;
  if (area === 'api' && !DEBUG_API) return;
  if (area === 'auth' && !DEBUG_AUTH) return;
  
  console.log(`[DEBUG:${area}] ${message}`, data || '');
}

// Function to log errors with conditional debugging
export function debugError(area: string, message: string, error?: any) {
  if (!DEBUG_MODE) return;
  
  // Always log errors regardless of area-specific flags
  console.error(`[ERROR:${area}] ${message}`, error || '');
}

// Default configuration
export const config = {
  debug: DEBUG_MODE,
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
  appName: 'Yolo Transcript',
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
};

export default config; 