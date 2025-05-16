import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Podcast Transcription Trial | Yolo Transcript',
  description: 'Get 30 minutes of free podcast transcription with Yolo Transcript. Sign up today for 5 free credits, no credit card required.',
  openGraph: {
    title: 'Free Podcast Transcription Trial | Yolo Transcript',
    description: 'Get 30 minutes of free podcast transcription with Yolo Transcript. Sign up today for 5 free credits, no credit card required.',
    type: 'website',
    url: 'https://yolotranscript.com/campaigns/podcast-trial',
    images: [
      {
        url: '/images/podcast-trial-og.png',
        width: 1200,
        height: 630,
        alt: 'Yolo Transcript Podcast Trial',
      }
    ],
  },
};

export default function PodcastTrialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      {children}
    </main>
  );
} 