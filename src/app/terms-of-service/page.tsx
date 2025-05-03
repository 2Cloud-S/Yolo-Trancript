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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              
              <p className="mb-4">
                Yolo Transcript provides an AI-powered audio and video transcription service that converts spoken content into text. Our service includes features such as:
              </p>
              
              <ul className="list-disc pl-5 mb-4">
                <li>Audio and video transcription</li>
                <li>Speaker diarization (identifying different speakers)</li>
                <li>Custom vocabulary support for specialized terminology</li>
                <li>Sentiment analysis</li>
                <li>Integration with cloud storage providers like Google Drive</li>
                <li>Transcript export in various formats</li>
              </ul>
              
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the service at any time without prior notice.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Credit-Based System and Payments</h2>
              
              <p className="mb-4">
                Yolo Transcript operates on a credit-based system. Credits are used to pay for transcription services, with costs varying based on the length and complexity of the audio or video.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Credit Packs</h3>
              <p className="mb-4">
                Users can purchase credit packs of various sizes. Each credit pack allows for a specific amount of transcription time. Credit packs may vary in price and available transcription minutes. The current credit pack options and pricing can be found on our <Link href="/pricing" className="text-blue-600 hover:underline">Pricing</Link> page.
              </p>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Credit Usage</h3>
              <p className="mb-4">
                Credits are deducted from your account based on the following factors:
              </p>
              <ul className="list-disc pl-5 mb-4">
                <li>Length of the audio or video file</li>
                <li>Use of additional features such as speaker diarization, custom vocabulary, or sentiment analysis</li>
                <li>Priority processing (if available)</li>
              </ul>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Terms</h3>
              <p className="mb-4">
                All purchases of credit packs are final and non-refundable unless required by law. We accept payment through our supported payment processors.
              </p>
              
              <p>
                We reserve the right to change credit pricing or the credit-to-minute conversion rate at our sole discretion. Any changes to pricing will be communicated to you in advance and will not affect previously purchased credits.
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
              
              <p className="mb-4">
                You retain all ownership rights to your content. By uploading content to our service, you grant Yolo Transcript a limited license to use, process, and store your content solely for the purpose of providing the transcription service to you.
              </p>
              
              <p>
                We reserve the right to remove any content that violates these terms or is otherwise objectionable at our sole discretion.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Third-Party Integrations</h2>
              
              <p className="mb-4">
                Yolo Transcript offers integration with third-party services such as Google Drive. By using these integrations, you agree to comply with the terms of service of these third-party providers.
              </p>
              
              <p className="mb-4">
                For Google Drive integration:
              </p>
              <ul className="list-disc pl-5 mb-4">
                <li>You authorize Yolo Transcript to access your Google Drive account for the purpose of saving and managing your transcriptions.</li>
                <li>You can revoke this access at any time by disconnecting the integration within your account settings or through Google's security settings.</li>
                <li>We store access tokens securely and only use them for the authorized purposes.</li>
              </ul>
              
              <p>
                We are not responsible for any issues that may arise from the use of third-party services or changes in their APIs or terms of service.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Transcription Accuracy</h2>
              
              <p className="mb-4">
                While we strive to provide accurate transcriptions, our service relies on artificial intelligence and may not be 100% accurate. Factors that can affect accuracy include:
              </p>
              <ul className="list-disc pl-5 mb-4">
                <li>Audio quality and background noise</li>
                <li>Accents and dialects</li>
                <li>Technical terminology or uncommon words</li>
                <li>Multiple speakers talking simultaneously</li>
              </ul>
              
              <p className="mb-4">
                We offer features like custom vocabulary to improve accuracy for specialized terminology. However, we do not guarantee perfect transcription and recommend that users review and edit transcripts for critical content.
              </p>
              
              <p>
                Yolo Transcript shall not be liable for any inaccuracies in transcriptions or any decisions made based on the content of transcriptions.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              
              <p className="mb-4">
                In no event shall Yolo Transcript or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the Service, even if Yolo Transcript or a Yolo Transcript authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
              
              <p>
                Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Data Security and Privacy</h2>
              
              <p className="mb-4">
                Your privacy is important to us. Our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link> describes how we collect, use, and protect your personal information and uploaded content.
              </p>
              
              <p>
                We implement technical and organizational measures to protect your data, but no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
              
              <p>
                Yolo Transcript may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
              
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of the United States and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
              
              <p>
                If you have any questions about these Terms of Service, please contact us at contact@yolo-transcript.com.
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