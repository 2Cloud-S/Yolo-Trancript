// Google Analytics event tracking utilities

/**
 * Track a custom event in Google Analytics
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Track a page view in Google Analytics
 */
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID, {
      page_path: url,
    });
  }
};

/**
 * Track user sign in
 */
export const trackSignIn = (method: string) => {
  trackEvent('sign_in', 'authentication', method);
};

/**
 * Track file upload
 */
export const trackUpload = (fileType: string, fileSize: number) => {
  trackEvent('file_upload', 'engagement', fileType, fileSize);
};

/**
 * Track transcription start
 */
export const trackTranscriptionStart = (duration: number) => {
  trackEvent('transcription_start', 'core_feature', 'duration_seconds', duration);
};

/**
 * Track credit purchase
 */
export const trackCreditPurchase = (packageName: string, amount: number) => {
  trackEvent('credit_purchase', 'monetization', packageName, amount);
}; 