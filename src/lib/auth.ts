/**
 * Authentication utility functions
 */
import { supabase } from './supabase/client';

/**
 * Try to refresh the auth session when it's expired or missing
 * @returns True if session refresh was successful, false otherwise
 */
export async function refreshSession(): Promise<boolean> {
  try {
    // First check if we already have a valid session
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (sessionData.session) {
      // We already have a valid session
      return true;
    }
    
    // Try to refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session) {
      console.error('Session refresh failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Session refresh error:', error);
    return false;
  }
}

/**
 * Check if the user is authenticated by calling the auth status endpoint
 * @returns Object with authentication status and user data if authenticated
 */
export async function checkAuthStatus(): Promise<{
  authenticated: boolean;
  userId?: string;
  error?: string;
  credits?: number;
  hasCredits?: boolean;
  code?: string;
}> {
  try {
    // First try to ensure we have a valid session
    const refreshed = await refreshSession();
    
    if (!refreshed) {
      return {
        authenticated: false,
        error: 'Session expired or invalid',
        code: 'session_expired'
      };
    }
    
    // Call the auth status API endpoint
    const response = await fetch('/api/auth/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for auth
    });

    if (!response.ok) {
      // Get error details if available
      let errorMessage = 'Authentication failed';
      let errorCode = 'auth_error';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        errorCode = errorData.code || errorCode;
      } catch (e) {
        console.error('Failed to parse auth error response', e);
      }

      return {
        authenticated: false,
        error: errorMessage,
        code: errorCode
      };
    }

    // Parse the successful response
    const data = await response.json();
    
    return {
      authenticated: data.authenticated,
      userId: data.userId,
      credits: data.credits,
      hasCredits: data.hasCredits,
      code: data.code
    };
  } catch (error) {
    console.error('Auth check failed:', error);
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown authentication error',
      code: 'unknown_error'
    };
  }
} 