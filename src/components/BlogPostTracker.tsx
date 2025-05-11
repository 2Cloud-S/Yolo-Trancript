'use client';

import React, { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

interface BlogPostTrackerProps {
  slug: string;
  title: string;
}

export default function BlogPostTracker({ slug, title }: BlogPostTrackerProps) {
  useEffect(() => {
    // Track blog post view
    trackEvent('blog_post_view', 'content', title);
  }, [slug, title]);
  
  return null; // This component doesn't render anything
} 