'use client';

import React, { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

export default function BlogTracker() {
  useEffect(() => {
    // Track blog index page view
    trackEvent('blog_index_view', 'content');
  }, []);
  
  return null; // This component doesn't render anything
} 