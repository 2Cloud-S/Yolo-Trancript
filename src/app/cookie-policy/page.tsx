'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import YoloMascot from '@/components/YoloMascot';

export default function CookiePolicyPage() {
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Essential cookies cannot be disabled
    functional: false,
    analytics: false,
    advertising: false
  });

  // Load saved preferences on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('cookiePreferencesDetailed');
    
    if (savedPreferences) {
      setCookiePreferences(JSON.parse(savedPreferences));
    } else {
      // If detailed preferences don't exist, check general consent
      const consentStatus = localStorage.getItem('cookieConsent');
      if (consentStatus === 'accepted') {
        setCookiePreferences({
          essential: true,
          functional: true,
          analytics: true,
          advertising: true
        });
      }
    }
    
    // Scroll to settings if URL has #settings hash
    if (window.location.hash === '#settings') {
      const settingsElement = document.getElementById('cookie-settings');
      if (settingsElement) {
        settingsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const savePreferences = () => {
    localStorage.setItem('cookiePreferencesDetailed', JSON.stringify(cookiePreferences));
    localStorage.setItem('cookieConsent', 'customized');
    
    // Show confirmation message
    alert('Your cookie preferences have been saved.');
  };

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      advertising: true
    };
    
    setCookiePreferences(allAccepted);
    localStorage.setItem('cookiePreferencesDetailed', JSON.stringify(allAccepted));
    localStorage.setItem('cookieConsent', 'accepted');
    
    // Show confirmation message
    alert('All cookies have been accepted.');
  };

  const rejectNonEssential = () => {
    const essentialOnly = {
      essential: true,
      functional: false,
      analytics: false,
      advertising: false
    };
    
    setCookiePreferences(essentialOnly);
    localStorage.setItem('cookiePreferencesDetailed', JSON.stringify(essentialOnly));
    localStorage.setItem('cookieConsent', 'declined');
    
    // Show confirmation message
    alert('Only essential cookies will be used.');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#FFD60A] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Yolo Transcript</h1>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-900 text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <YoloMascot pose="listening" size="md" className="mx-auto mb-6" />
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Cookie Policy</h1>
            <p className="text-xl text-gray-600">Last Updated: May 3, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              
              <p className="mb-4">
                This Cookie Policy explains how Yolo Transcript uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
              </p>
              
              <p>
                Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Essential Cookies</h3>
              <p className="mb-4">
                These cookies are essential for providing you with services available through our website and to enable you to use some of its features. Without these cookies, the services you have asked for cannot be provided, including secure login, authentication, and remembering your transcription settings. These cookies are necessary for the website to function and cannot be switched off.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Functional Cookies</h3>
              <p className="mb-4">
                These cookies allow our website to remember choices you make when you use our website, such as remembering your language preferences, transcription parameters, or custom vocabulary settings. The purpose of these cookies is to provide you with a more personal experience and to avoid you having to re-enter your preferences every time you visit our website.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics and Performance Cookies</h3>
              <p className="mb-4">
                These cookies are used to collect information about traffic to our website and how users use our website. The information gathered does not identify any individual visitor. We use this information to help operate our website more efficiently, to gather broad demographic information, and to monitor the level of activity on our website. We use services such as Vercel Analytics to help us analyze how our users interact with the service.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Targeting and Advertising Cookies</h3>
              <p>
                These cookies record your visit to our website, the pages you have visited, and the links you have followed. We may use this information to make our website and the advertising displayed on it more relevant to your interests. We may also share this information with third parties for this purpose.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Cookies</h2>
              
              <p className="mb-4">
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website, deliver advertisements on and through the website, and so on. These may include:
              </p>
              
              <ul className="list-disc pl-5">
                <li>Supabase for authentication and user management</li>
                <li>Vercel Analytics for website analytics</li>
                <li>AssemblyAI for processing transcription requests</li>
                <li>Google services for integration with Google Drive</li>
              </ul>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Use Cookies Specifically</h2>
              
              <p className="mb-4">
                Here's how we use cookies specifically within Yolo Transcript:
              </p>
              
              <ul className="list-disc pl-5">
                <li><strong>Authentication</strong>: We use cookies to identify you when you visit our website and as you navigate through the site, particularly to maintain your login session.</li>
                <li><strong>Transcription Settings</strong>: We use cookies to store your preferences for transcription features, such as speaker diarization settings and custom vocabulary choices.</li>
                <li><strong>Integration Settings</strong>: Cookies help us remember your Google Drive and other integration preferences.</li>
                <li><strong>Usage Analysis</strong>: We use cookies to analyze how users interact with our transcription features to help us improve them.</li>
                <li><strong>Security</strong>: We use cookies as an element of the security measures used to protect user accounts, including preventing fraudulent use of login credentials.</li>
              </ul>
            </div>

            <div id="cookie-settings" className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Cookie Preferences</h2>
              
              <p className="mb-6">
                You can set your cookie preferences using the controls below. Essential cookies cannot be disabled as they are necessary for the website to function properly.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="font-bold text-gray-900">Essential Cookies</h3>
                    <p className="text-sm text-gray-600">Necessary for the website to function properly</p>
                  </div>
                  <div className="relative inline-block w-12 h-6 bg-gray-200 rounded-full pointer-events-none">
                    <div className={`absolute left-1 top-1 w-4 h-4 bg-blue-600 rounded-full transition-transform duration-200 transform translate-x-6`}></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="font-bold text-gray-900">Functional Cookies</h3>
                    <p className="text-sm text-gray-600">Remember your preferences and settings</p>
                  </div>
                  <label className="relative inline-block w-12 h-6 bg-gray-200 rounded-full cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={cookiePreferences.functional}
                      onChange={() => setCookiePreferences({...cookiePreferences, functional: !cookiePreferences.functional})}
                    />
                    <div className={`absolute left-1 top-1 w-4 h-4 ${cookiePreferences.functional ? 'bg-blue-600 transform translate-x-6' : 'bg-gray-400'} rounded-full transition-transform duration-200`}></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="font-bold text-gray-900">Analytics Cookies</h3>
                    <p className="text-sm text-gray-600">Help us improve our website by collecting anonymous information</p>
                  </div>
                  <label className="relative inline-block w-12 h-6 bg-gray-200 rounded-full cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={cookiePreferences.analytics}
                      onChange={() => setCookiePreferences({...cookiePreferences, analytics: !cookiePreferences.analytics})}
                    />
                    <div className={`absolute left-1 top-1 w-4 h-4 ${cookiePreferences.analytics ? 'bg-blue-600 transform translate-x-6' : 'bg-gray-400'} rounded-full transition-transform duration-200`}></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div>
                    <h3 className="font-bold text-gray-900">Advertising Cookies</h3>
                    <p className="text-sm text-gray-600">Used to show you relevant advertisements</p>
                  </div>
                  <label className="relative inline-block w-12 h-6 bg-gray-200 rounded-full cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={cookiePreferences.advertising}
                      onChange={() => setCookiePreferences({...cookiePreferences, advertising: !cookiePreferences.advertising})}
                    />
                    <div className={`absolute left-1 top-1 w-4 h-4 ${cookiePreferences.advertising ? 'bg-blue-600 transform translate-x-6' : 'bg-gray-400'} rounded-full transition-transform duration-200`}></div>
                  </label>
                </div>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={rejectNonEssential}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Reject All Non-Essential
                </button>
                <button 
                  onClick={savePreferences}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Save Preferences
                </button>
                <button 
                  onClick={acceptAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Accept All
                </button>
              </div>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. How to Control Cookies</h2>
              
              <p className="mb-4">
                In addition to the controls we provide above, you can choose to enable or disable cookies in your internet browser. Most internet browsers also enable you to choose whether you wish to disable all cookies or only third-party cookies. By default, most internet browsers accept cookies, but this can be changed.
              </p>
              
              <p>
                For further information about how to manage cookies in specific browsers, please visit the browser developer's website:
              </p>
              <ul className="list-disc pl-5">
                <li><a href="https://support.google.com/chrome/answer/95647" className="text-blue-600 hover:underline">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" className="text-blue-600 hover:underline">Mozilla Firefox</a></li>
                <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" className="text-blue-600 hover:underline">Microsoft Edge</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" className="text-blue-600 hover:underline">Safari (macOS)</a></li>
                <li><a href="https://support.apple.com/en-us/HT201265" className="text-blue-600 hover:underline">Safari (iOS)</a></li>
              </ul>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Updates to This Cookie Policy</h2>
              
              <p>
                We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
              
              <p>
                If you have any questions about our use of cookies or other technologies, please email us at privacy@yolo-transcript.com.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              &copy; 2025 Yolo Transcript. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/about" className="text-gray-400 hover:text-white text-sm">
                About
              </Link>
              <Link href="/privacy-policy" className="text-gray-400 hover:text-white text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-white text-sm">
                Terms of Service
              </Link>

              <Link href="/refund-policy" className="text-gray-400 hover:text-white text-sm">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 