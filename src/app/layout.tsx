import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';
import CookieConsentBanner from '@/components/CookieConsentBanner';

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
      { url: '/favicon.ico' },
      { url: '/images/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/images/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/images/safari-pinned-tab.svg', color: '#5bbad5' },
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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yolo Transcript - AI-Powered Audio & Video Transcription',
    description: 'Accurate transcription service powered by AI with features like speaker diarization, custom vocabulary, and sentiment analysis.',
    images: ['/images/yolo-transcript-twitter.png'],
    creator: '@Afnanxkhan_ak',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <CookieConsentBanner />
        <Analytics />
      </body>
    </html>
  );
}
