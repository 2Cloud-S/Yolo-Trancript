import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';
import CookieConsentBanner from '@/components/CookieConsentBanner';
import AuthProvider from '@/components/AuthProvider';
import { GoogleAnalytics } from '@next/third-parties/google'
import PageViewTracker from '@/components/Analytics';
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Yolo Transcript - AI-Powered Audio & Video Transcription',
  description: 'Accurate transcription service powered by AI with features like speaker diarization, custom vocabulary, and sentiment analysis.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/images/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/images/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/images/safari-pinned-tab.svg', color: '#FF8C42' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Yolo Transcript - AI-Powered Audio & Video Transcription',
    description: 'Accurate transcription service powered by AI with features like speaker diarization, custom vocabulary, and sentiment analysis.',
    type: 'website',
    url: 'https://yolotranscript.com',
    images: [
      {
        url: '/images/yolo-transcript-og.png',
        width: 1200,
        height: 630,
        alt: 'Yolo Transcript',
      }
    ],
    siteName: 'Yolo Transcript',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yolo Transcript - AI-Powered Audio & Video Transcription',
    description: 'Accurate transcription service powered by AI with features like speaker diarization, custom vocabulary, and sentiment analysis.',
    images: ['/images/yolo-transcript-twitter.png'],
    creator: '@Afnanxkhan_ak',
  },
  verification: {
    google: 'YOUR_GOOGLE_SITE_VERIFICATION', // Replace with your actual verification code
  },
  alternates: {
    canonical: 'https://yolotranscript.com',
  },
  metadataBase: new URL('https://yolotranscript.com'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          defer
          data-website-id="68337b03bef79813a5d2d177"
          data-domain="www.yolo-transcript.com"
          src="https://datafa.st/js/script.js"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <CookieConsentBanner />
          <PageViewTracker />
        </AuthProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || ''} />
      </body>
    </html>
  );
}
