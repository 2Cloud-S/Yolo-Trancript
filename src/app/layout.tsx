import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Yolo Transcript',
  description: 'Convert your audio and video files into text transcripts with Yolo Transcript.',
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
    title: 'Yolo Transcript - Audio & Video Transcription',
    description: 'Fast, accurate speech-to-text conversion powered by AI. Transform your audio and video content into easily readable transcripts.',
    type: 'website',
    url: 'https://yolotranscript.com',
    images: [
      {
        url: '/images/yolo-transcript-social.png',
        width: 1200,
        height: 630,
        alt: 'Yolo Transcript - Audio to Text Conversion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yolo Transcript - Audio & Video Transcription',
    description: 'Fast, accurate speech-to-text conversion powered by AI',
    images: ['/images/yolo-transcript-social.png'],
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
        <Analytics />
      </body>
    </html>
  );
}
