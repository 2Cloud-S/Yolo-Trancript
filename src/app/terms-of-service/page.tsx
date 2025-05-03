import Link from 'next/link';
import YoloMascot from '@/components/YoloMascot';

export default function TermsOfServicePage() {
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
            <YoloMascot pose="pointing" size="md" className="mx-auto mb-6" />
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-xl text-gray-600">Last Updated: May 3, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              
              <p className="mb-4">
                By accessing or using the Yolo Transcript service, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>
              
              <p>
                The materials contained in this website are protected by applicable copyright and trademark law.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
              
              <p className="mb-4">
                Permission is granted to temporarily use the materials (information or software) on Yolo Transcript for personal, non-commercial use only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              
              <ul className="list-disc pl-5 mb-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software contained on Yolo Transcript</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
              
              <p>
                This license shall automatically terminate if you violate any of these restrictions and may be terminated by Yolo Transcript at any time.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              
              <p className="mb-4">
                To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account.
              </p>
              
              <p>
                Yolo Transcript reserves the right to refuse service, terminate accounts, remove or edit content, or cancel orders at our sole discretion.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Payment and Subscription</h2>
              
              <p className="mb-4">
                Some aspects of the Service may be provided for a fee. You will be required to select a payment plan and provide accurate information regarding your payment method.
              </p>
              
              <p className="mb-4">
                Subscription fees are billed in advance on a monthly or annual basis. Your subscription will automatically renew unless you cancel at least 24 hours before the end of the current billing period.
              </p>
              
              <p>
                We reserve the right to change our subscription plans or adjust pricing at our sole discretion. Any changes to pricing will be communicated to you in advance.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Content and Conduct</h2>
              
              <p className="mb-4">
                You are solely responsible for all audio and video content that you upload, post, or otherwise make available via the Service. You agree that you will not upload content that:
              </p>
              
              <ul className="list-disc pl-5 mb-4">
                <li>Infringes on the intellectual property rights of others</li>
                <li>Contains unlawful, defamatory, or offensive material</li>
                <li>Contains personal or private information about others without their consent</li>
                <li>Violates any applicable law or regulation</li>
              </ul>
              
              <p>
                We reserve the right to remove any content that violates these terms or is otherwise objectionable at our sole discretion.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
              
              <p className="mb-4">
                In no event shall Yolo Transcript or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the Service, even if Yolo Transcript or a Yolo Transcript authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
              
              <p>
                Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Changes to Terms</h2>
              
              <p>
                Yolo Transcript may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Governing Law</h2>
              
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of the United States and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
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
              <Link href="/cookie-policy" className="text-gray-400 hover:text-white text-sm">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 