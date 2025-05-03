'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import EnvWarning from '@/components/EnvWarning';
import { Upload, CheckCircle, Zap, Shield, Clock, ArrowRight, Code, Mic, FileText, Twitter, FileImage } from 'lucide-react';
import AnimatedText from '@/components/AnimatedText';
import YoloMascot from '@/components/YoloMascot';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <EnvWarning />
      
      {/* Header with Upload Button */}
      <header className="bg-[#FFD60A] shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 animate-fadeIn relative overflow-hidden group">
                <span className="inline-block transform transition-transform duration-500 ease-in-out group-hover:translate-x-1">
                  Yolo Transcript
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-900 text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/pricing"
                    className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/auth/login?redirect=/dashboard"
                    className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register?redirect=/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-gray-900 text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#FFD60A] py-20 wave-border relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <AnimatedText />
              </h1>
              <p className="mt-5 text-base text-gray-800 sm:text-lg md:mt-8 md:text-xl max-w-xl">
                Upload your audio or video files and get accurate transcriptions powered by Yolo Transcript.
                Manage all your transcripts in a beautiful dashboard.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href={user ? "/dashboard" : "/auth/login?redirect=/dashboard"}
                  className="px-8 py-3 text-base font-medium rounded-md text-gray-900 bg-white border-2 border-gray-900 hover:bg-gray-50 md:py-4 md:text-lg md:px-10 inline-flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  {user ? "Upload Now" : "Sign In to Upload"}
                </Link>
                {!user && (
                  <Link
                    href="/auth/register?redirect=/dashboard"
                    className="px-8 py-3 text-base font-medium rounded-md text-white bg-gray-900 border-2 border-gray-900 hover:bg-gray-800 md:py-4 md:text-lg md:px-10 inline-flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]"
                  >
                    Create Free Account
                  </Link>
                )}
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="relative">
                <div className="bg-white p-8 rounded-lg border-2 border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
                  <YoloMascot pose="waving" size="lg" />
                  <div className="mt-4 p-4 bg-gray-100 rounded border border-gray-300">
                    <p className="text-gray-600 text-sm font-mono">"Hello! I'll turn your audio and video into text. Just upload a file to get started!"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-[#06B6D4] py-16 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="flex flex-col items-center justify-center bg-white py-6 px-4 rounded-lg border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <Mic className="h-8 w-8 text-orange-600" />
              </div>
              <p className="font-bold text-gray-900">Accurate Speech Recognition</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-white py-6 px-4 rounded-lg border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="font-bold text-gray-900">Powered by Advanced AI</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-white py-6 px-4 rounded-lg border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Twitter className="h-8 w-8 text-blue-600" />
              </div>
              <p className="font-bold text-gray-900">Easy Sharing & Export</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-gray-900 font-bold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              No Code? No Problem
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-600 lg:mx-auto">
              Create effortless automated transcriptions with just a few clicks
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-8">
              {[
                {
                  title: 'Easy Upload',
                  description: 'Drag and drop your audio or video files for instant transcription.',
                  icon: Upload,
                },
                {
                  title: 'Accurate Transcriptions',
                  description: 'State-of-the-art AI models provide high-quality transcriptions.',
                  icon: CheckCircle,
                },
                {
                  title: 'Fast Processing',
                  description: 'Get your transcriptions in minutes, not hours.',
                  icon: Zap,
                },
                {
                  title: 'Secure Storage',
                  description: 'All your transcriptions are securely stored and easily accessible.',
                  icon: Shield,
                },
              ].map((feature) => (
                <div key={feature.title} className="relative p-6 bg-white border-2 border-gray-900 rounded-lg mt-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-gray-900" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg leading-6 font-bold text-gray-900">{feature.title}</h3>
                      <p className="mt-2 text-base text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-gray-900 font-bold tracking-wide uppercase">How It Works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Multiple Ways to Play
            </p>
          </div>
          
          <div className="mt-10 relative">
            <div className="flex justify-center mb-12">
              <YoloMascot pose="pointing" size="md" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Upload',
                  description: 'Upload your audio or video file through our simple interface.',
                  icon: Upload,
                  mascot: 'waving',
                },
                {
                  title: 'Process',
                  description: 'Our AI processes your file and creates an accurate transcription.',
                  icon: Clock,
                  mascot: 'listening',
                },
                {
                  title: 'Download',
                  description: 'Download your transcription in various formats or view it online.',
                  icon: CheckCircle,
                  mascot: 'coding',
                },
              ].map((step, index) => (
                <div key={step.title} className="relative bg-white p-6 rounded-lg border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="absolute -top-6 -left-2 h-12 w-12 bg-[#FFD60A] rounded-full border-2 border-gray-900 flex items-center justify-center font-bold text-gray-900">
                    {index + 1}
                  </div>
                  <div className="pt-6">
                    <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 bg-[#FFD60A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-gray-900 font-bold tracking-wide uppercase">Pricing</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Choose the right plan for you
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-900 lg:mx-auto">
              Simple, transparent pricing with no hidden fees. Pay only for what you need.
            </p>
          </div>

          <div className="mt-10 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-4">
            {[
              {
                name: 'Starter',
                credits: '50',
                price: '$5',
                hours: '5',
                features: [
                  '5 hours of transcription',
                  'Premium speaker diarization',
                  'Highest accuracy',
                  'All export formats',
                  'Priority support',
                  'Sentiment analysis',
                  'Custom vocabulary',
                ],
              },
              {
                name: 'Pro',
                credits: '100',
                price: '$9',
                hours: '10',
                features: [
                  '10 hours of transcription',
                  'Premium speaker diarization',
                  'Highest accuracy',
                  'All export formats',
                  'Priority support',
                  'Sentiment analysis',
                  'Custom vocabulary',
                ],
                popular: true,
              },
              {
                name: 'Creator',
                credits: '250',
                price: '$20',
                hours: '25',
                features: [
                  '25 hours of transcription',
                  'Premium speaker diarization',
                  'Highest accuracy',
                  'All export formats',
                  'Priority support',
                  'Sentiment analysis',
                  'Custom vocabulary',
                ],
              },
              {
                name: 'Power',
                credits: '500',
                price: '$35',
                hours: '50',
                features: [
                  '50 hours of transcription',
                  'Premium speaker diarization',
                  'Highest accuracy',
                  'All export formats',
                  'Priority support',
                  'Sentiment analysis',
                  'Custom vocabulary',
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg bg-white border-2 ${
                  plan.popular ? 'border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] scale-105' : 'border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
                    {plan.credits} credits
                  </div>
                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    {plan.hours} hours of transcription
                  </p>
                  <Link
                    href="/auth/register"
                    className={`mt-8 block w-full border-2 border-gray-900 rounded-md py-2 text-sm font-bold text-center ${
                      plan.popular ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Get started
                  </Link>
                </div>
                <div className="pt-6 pb-8 px-6 bg-gray-50 rounded-b-lg border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-900 tracking-wide uppercase">What's included</h4>
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex space-x-3">
                        <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <div className="lg:w-0 lg:flex-1">
            <div className="flex items-center">
              <YoloMascot pose="waving" size="sm" className="mr-4" />
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  <span className="block">Start a Free Trial</span>
                </h2>
                <p className="mt-3 max-w-md text-lg">
                  Start a free trial with 30 API credits, no credit card required
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-5 py-3 border-2 border-transparent text-base font-medium rounded-md text-gray-900 bg-[#FFD60A] hover:bg-[#FFE03A] shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]"
              >
                Get started for free
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-black text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Yolo Transcript</h3>
              <p className="text-gray-400 text-sm">
                Audio and video transcription powered by cutting-edge AI
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                {[
                  { name: 'Features', href: '/#features' },
                  { name: 'Pricing', href: '/pricing' },
                  { name: 'FAQ', href: '/faq' }
                ].map(item => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-gray-400 hover:text-white text-sm">{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                {['About', 'Contact'].map(item => (
                  <li key={item}>
                    <a href={`/${item.toLowerCase()}`} className="text-gray-400 hover:text-white text-sm">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                {[
                  { name: 'Privacy Policy', path: '/privacy-policy' },
                  { name: 'Terms of Service', path: '/terms-of-service' },
                  { name: 'Cookie Policy', path: '/cookie-policy' },
                  { name: 'Refund Policy', path: '/refund-policy' }
                ].map(item => (
                  <li key={item.name}>
                    <a href={item.path} className="text-gray-400 hover:text-white text-sm">{item.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 Yolo Transcript. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {[
                { 
                  name: 'Twitter', 
                  href: 'https://x.com/Afnanxkhan_ak', 
                  icon: Twitter 
                },
                { 
                  name: 'GitHub', 
                  href: 'https://github.com/2Cloud-S/yolo-transcript', 
                  icon: (props: any) => (
                    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  )
                },
                { 
                  name: 'LinkedIn', 
                  href: 'https://www.linkedin.com/in/afnankhan-ak/', 
                  icon: (props: any) => (
                    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
                      <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                    </svg>
                  )
                }
              ].map((item) => (
                <a 
                  key={item.name} 
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white"
                  aria-label={item.name}
                >
                  {item.name === 'Twitter' ? (
                    <Twitter className="h-6 w-6" />
                  ) : (
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
