import Link from 'next/link';
import YoloMascot from '@/components/YoloMascot';

export default function CookiePolicyPage() {
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
                These cookies are essential for providing you with services available through our website and to enable you to use some of its features. Without these cookies, the services you have asked for cannot be provided, and we only use these cookies to provide you with those services.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Functionality Cookies</h3>
              <p className="mb-4">
                These cookies allow our website to remember choices you make when you use our website, such as remembering your language preferences or your login details. The purpose of these cookies is to provide you with a more personal experience and to avoid you having to re-enter your preferences every time you visit our website.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics and Performance Cookies</h3>
              <p className="mb-4">
                These cookies are used to collect information about traffic to our website and how users use our website. The information gathered does not identify any individual visitor. The information is aggregated and anonymous. We use this information to help operate our website more efficiently, to gather broad demographic information, and to monitor the level of activity on our website.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Targeting and Advertising Cookies</h3>
              <p>
                These cookies record your visit to our website, the pages you have visited, and the links you have followed. We will use this information to make our website and the advertising displayed on it more relevant to your interests. We may also share this information with third parties for this purpose.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Cookies</h2>
              
              <p className="mb-4">
                In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website, deliver advertisements on and through the website, and so on. These may include:
              </p>
              
              <ul className="list-disc pl-5">
                <li>Google Analytics for website analytics</li>
                <li>Google AdSense for advertising</li>
                <li>Facebook Pixel for marketing and retargeting</li>
                <li>Supabase for authentication and user management</li>
              </ul>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How to Control Cookies</h2>
              
              <p className="mb-4">
                You can control and manage cookies in various ways. Please keep in mind that removing or blocking cookies can negatively impact your user experience and parts of our website may no longer be fully accessible.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Browser Controls</h3>
              <p className="mb-4">
                Most browsers automatically accept cookies, but you can choose to accept or decline cookies through the settings on your browser. Each browser is different, so check the "Help" menu of your browser to learn how to change your cookie preferences.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Disabling Most Targeted Advertising Cookies</h3>
              <p>
                You can disable targeted advertising by using the preference forms of the Digital Advertising Alliance, the Network Advertising Initiative, or the European Interactive Digital Advertising Alliance.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Updates to This Cookie Policy</h2>
              
              <p>
                We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact Us</h2>
              
              <p>
                If you have any questions about our use of cookies or other technologies, please email us at cookies@yolotranscript.com.
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 