'use client';

import React from 'react';
import Link from 'next/link';
import { GoogleAnalytics } from '@next/third-parties/google';
import { motion } from 'framer-motion';

const testimonials = [
  {
    quote: "Yolo Transcript saved me hours on editing!",
    author: "Alex, Podcaster"
  },
  {
    quote: "The accuracy is unbelievable - even with technical terms.",
    author: "Sarah, Tech Show Host"
  },
  {
    quote: "I was skeptical about AI transcription until I tried Yolo.",
    author: "Mark, Interview Series Creator"
  },
  {
    quote: "Converting my podcasts to blog posts is now a breeze.",
    author: "Jamie, Content Creator"
  },
  {
    quote: "Customer support helped me every step of the way.",
    author: "Taylor, New Podcaster"
  }
];

export default function PodcastTrialPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Section */}
      <header className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute inset-0">
            {/* Sound wave animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 bg-white/30 rounded-full"
                    style={{ height: '200px' }}
                    animate={{
                      height: ['40px', '200px', '40px'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Get 30 Minutes of Free Podcast Transcription
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Sign Up for Yolo Transcript and Start with 5 Free Credits
            </p>
            <Link 
              href="https://www.yolo-transcript.com/auth/register?redirect=/dashboard" 
              className="bg-white text-orange-600 hover:bg-orange-100 px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Animation */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-xl shadow-xl">
                {/* Animated Process Timeline */}
                <motion.div 
                  className="absolute bottom-0 left-0 h-1 bg-orange-500 z-10"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                
                {/* Upload Animation */}
                <motion.div 
                  className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center p-4"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{ 
                    opacity: [1, 1, 0],
                    scale: [1, 1.05, 0.8],
                    x: [0, 0, -500]
                  }}
                  transition={{ 
                    duration: 6, 
                    times: [0, 0.3, 0.35],
                    repeat: Infinity
                  }}
                >
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                    className="w-20 h-20 mb-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Upload</h3>
                  <p className="text-gray-600 text-center">Drag & drop your podcast audio file</p>
                </motion.div>
                
                {/* Processing Animation */}
                <motion.div 
                  className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center p-4"
                  initial={{ opacity: 0, scale: 0.8, x: 500 }}
                  animate={{ 
                    opacity: [0, 1, 1, 0],
                    scale: [0.8, 1, 1, 0.8],
                    x: [500, 0, 0, -500]
                  }}
                  transition={{ 
                    duration: 6, 
                    times: [0.3, 0.35, 0.6, 0.65],
                    repeat: Infinity
                  }}
                >
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 mb-4 text-orange-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Transcribing</h3>
                  <div className="flex space-x-2">
                    <motion.div 
                      className="w-2 h-2 bg-orange-500 rounded-full"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-orange-500 rounded-full"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, delay: 0.3, repeat: Infinity, repeatType: "loop" }}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-orange-500 rounded-full"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, delay: 0.6, repeat: Infinity, repeatType: "loop" }}
                    />
                  </div>
                  <p className="text-gray-600 text-center mt-2">AI processing your audio</p>
                </motion.div>
                
                {/* Result Animation */}
                <motion.div 
                  className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center p-4"
                  initial={{ opacity: 0, scale: 0.8, x: 500 }}
                  animate={{ 
                    opacity: [0, 1, 1, 0],
                    scale: [0.8, 1, 1, 0.8],
                    x: [500, 0, 0, -500]
                  }}
                  transition={{ 
                    duration: 6, 
                    times: [0.6, 0.65, 0.95, 1],
                    repeat: Infinity
                  }}
                >
                  <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: [0.9, 1.1, 0.9] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 mb-4"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Complete!</h3>
                  
                  <div className="h-12 w-full max-w-xs bg-white rounded-md shadow-sm p-2 overflow-hidden relative">
                    <motion.div 
                      className="absolute top-0 left-0 h-full w-2 bg-orange-500"
                      animate={{ x: [0, 200, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <div className="flex space-x-1 mb-1">
                      <div className="h-1 w-12 bg-gray-300 rounded-full"></div>
                      <div className="h-1 w-8 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="h-1 w-20 bg-gray-300 rounded-full"></div>
                      <div className="h-1 w-10 bg-gray-300 rounded-full"></div>
                      <div className="h-1 w-14 bg-gray-300 rounded-full"></div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-center mt-2">Ready to download</p>
                </motion.div>
              </div>
            </div>
            <div className="md:w-1/2 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Upload your podcast, get accurate text in minutes.
              </h2>
              <Link 
                href="https://www.yolo-transcript.com/auth/register?redirect=/dashboard" 
                className="bg-orange-500 text-white hover:bg-orange-600 px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose Yolo Transcript</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center mb-4">99% Accurate AI Transcription</h3>
              <p className="text-gray-600 text-center">
                Our advanced AI models deliver industry-leading accuracy, even with technical terms and multiple speakers.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center mb-4">Export to Word or SRT</h3>
              <p className="text-gray-600 text-center">
                Download your transcriptions in multiple formats for easy editing, publishing, or subtitling.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center mb-4">No Credit Card Required</h3>
              <p className="text-gray-600 text-center">
                Try our service completely risk-free with no payment information needed to get started.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">What Our Users Say</h2>
          <div className="flex justify-center mb-12">
            <div className="bg-orange-100 text-orange-800 px-6 py-3 rounded-full font-bold">
              Trusted by 500+ Creators
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.quote}"</p>
                <p className="font-bold">– {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transcribe Your Podcast?
          </h2>
          <p className="text-xl md:text-2xl mb-8">
            Claim Your 5 Free Credits (30 Minutes) Now
          </p>
          <Link 
            href="https://www.yolo-transcript.com/auth/register?redirect=/dashboard" 
            className="bg-white text-orange-600 hover:bg-orange-100 px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl inline-block mb-8"
          >
            Start Free Trial
          </Link>
          <p className="text-white text-lg font-semibold">
            Limited Offer: Free Credits for New Users Only
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p>Yolo Transcript © 2025</p>
            </div>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="hover:text-orange-300 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-orange-300 transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-orange-300 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Google Analytics */}
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || ''} />
    </div>
  );
}