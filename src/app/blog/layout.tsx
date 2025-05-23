import React from 'react';
import Link from 'next/link';
import BlogSearch from '@/components/BlogSearch';

export const metadata = {
  title: 'Blog | Yolo Transcript',
  description: 'Articles, guides, and updates about transcription technology and AI.',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Link href="/" className="text-yellow-600 hover:text-yellow-700 transition-colors flex items-center font-medium mb-4 md:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </Link>
            <BlogSearch />
          </div>
        </div>
      </div>
      {children}
      
      <footer className="bg-white border-t border-gray-200 py-10 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Yolo Transcript Blog</h3>
              <p className="text-gray-600">
                Stay updated with the latest in transcription technology and AI
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <h4 className="font-medium text-gray-800 text-center md:text-right mb-2">Quick Links</h4>
              <div className="flex flex-wrap justify-center md:justify-end gap-4">
                <Link href="/blog" className="text-gray-600 hover:text-yellow-600 transition-colors">
                  All Posts
                </Link>
                <Link href="/" className="text-gray-600 hover:text-yellow-600 transition-colors">
                  Home
                </Link>
                <Link href="/pricing" className="text-gray-600 hover:text-yellow-600 transition-colors">
                  Pricing
                </Link>
                <Link href="/about" className="text-gray-600 hover:text-yellow-600 transition-colors">
                  About Us
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-8 mt-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm mb-4 md:mb-0">
                © {new Date().getFullYear()} Yolo Transcript. All rights reserved.
              </p>
              <div className="flex justify-center space-x-6">
                <a href="https://x.com/YoloTranscript" className="text-gray-400 hover:text-yellow-600 transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/afnankhan-ak/" className="text-gray-400 hover:text-yellow-600 transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 