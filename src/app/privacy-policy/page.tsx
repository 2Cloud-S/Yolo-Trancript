import Link from 'next/link';
import YoloMascot from '@/components/YoloMascot';

export default function PrivacyPolicyPage() {
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
            <YoloMascot pose="coding" size="md" className="mx-auto mb-6" />
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-xl text-gray-600">Last Updated: June 10, 2024</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              
              <p className="mb-4">
                At Yolo Transcript, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our transcription service.
              </p>
              
              <p>
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Personal Data</h3>
              <p className="mb-4">
                When you create an account, we collect personally identifiable information, such as your:
              </p>
              <ul className="list-disc pl-5 mb-4">
                <li>Name</li>
                <li>Email address</li>
                <li>Payment information</li>
                <li>IP address and device information</li>
              </ul>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Audio and Video Content</h3>
              <p className="mb-4">
                We collect and process the audio and video files you upload for transcription purposes. This content may contain personal information depending on what is recorded in the files.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Transcription Data</h3>
              <p className="mb-4">
                We collect and store the transcriptions generated from your audio and video files, including:
              </p>
              <ul className="list-disc pl-5 mb-4">
                <li>Full text transcripts</li>
                <li>Speaker diarization information (who said what)</li>
                <li>Sentiment analysis data (if enabled)</li>
                <li>Custom vocabulary terms you've provided</li>
                <li>Timestamps and metadata associated with the transcription</li>
              </ul>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Integration Information</h3>
              <p>
                If you connect third-party services like Google Drive, we collect and store authentication tokens and necessary account information to enable these integrations to function properly.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-5 mb-4">
                <li>Provide, maintain, and improve our transcription services</li>
                <li>Process and complete transcription requests</li>
                <li>Apply custom vocabulary and speaker diarization as requested</li>
                <li>Perform sentiment analysis when enabled</li>
                <li>Facilitate integrations with third-party services like Google Drive</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Develop new features and services</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Prevent fraudulent transactions and monitor against theft</li>
              </ul>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Services</h2>
              
              <p className="mb-4">
                Our service relies on trusted third-party providers to deliver various aspects of our transcription service:
              </p>
              
              <ul className="list-disc pl-5 mb-4">
                <li><strong>AssemblyAI</strong>: We use AssemblyAI to process and transcribe your audio and video files. Your content is transmitted to their service for processing. Please review <a href="https://www.assemblyai.com/privacy" className="text-blue-600 hover:underline">AssemblyAI's Privacy Policy</a> for more information.</li>
                <li><strong>Supabase</strong>: We use Supabase for user authentication and data storage. Your account information and transcription data are stored in our Supabase database.</li>
                <li><strong>Google Drive</strong>: If you enable Google Drive integration, we will interact with Google's APIs to store and manage your transcriptions in your Google Drive account.</li>
                <li><strong>Vercel</strong>: Our application is hosted on Vercel, which processes user requests and may collect basic usage information.</li>
              </ul>
              
              <p>
                We select partners with strong privacy practices, but we encourage you to review their respective privacy policies to understand how they handle your data.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Retention</h2>
              
              <p className="mb-4">
                We retain your personal information for as long as necessary to provide the services you've requested, comply with our legal obligations, resolve disputes, and enforce our agreements. Specifically:
              </p>
              
              <ul className="list-disc pl-5 mb-4">
                <li><strong>Audio and Video Files</strong>: Your uploaded files are stored for 30 days after transcription, after which they are permanently deleted unless you opt for extended storage.</li>
                <li><strong>Transcription Data</strong>: Your transcripts are stored in your account until you delete them or close your account.</li>
                <li><strong>Custom Vocabulary</strong>: Your custom vocabulary lists are stored until you delete them or close your account.</li>
                <li><strong>Integration Tokens</strong>: Authentication tokens for services like Google Drive are stored securely until you disconnect the integration or close your account.</li>
              </ul>
              
              <p>
                You can delete your data at any time through your account settings. Upon account deletion, we will remove all your personal data within 30 days, except where we have a legal obligation to retain certain information.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Security</h2>
              
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage. These measures include:
              </p>
              
              <ul className="list-disc pl-5 mb-4">
                <li>Secure HTTPS connections for all data transfers</li>
                <li>Encryption of sensitive data at rest and in transit</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Regular security assessments and updates</li>
              </ul>
              
              <p>
                While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security. No method of transmission over the Internet or electronic storage is 100% secure.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
              
              <p className="mb-4">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-5 mb-4">
                <li>The right to access personal information we hold about you</li>
                <li>The right to request correction of inaccurate information</li>
                <li>The right to request deletion of your information</li>
                <li>The right to object to processing of your information</li>
                <li>The right to data portability</li>
                <li>The right to withdraw consent</li>
              </ul>
              
              <p>
                If you wish to exercise any of these rights, please contact us at privacy@yolo-transcript.com. We will respond to your request within 30 days.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
              
              <p>
                Our service is not directed to children under the age of 16. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and you believe your child has provided us with personal information, please contact us at privacy@yolo-transcript.com, and we will take steps to delete such information.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes To This Policy</h2>
              
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
              
              <p>
                If you have any questions about this Privacy Policy, please contact us at privacy@yolo-transcript.com.
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
              &copy; 2024 Yolo Transcript. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/about" className="text-gray-400 hover:text-white text-sm">
                About
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-white text-sm">
                Terms of Service
              </Link>
              <Link href="/cookie-policy" className="text-gray-400 hover:text-white text-sm">
                Cookie Policy
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