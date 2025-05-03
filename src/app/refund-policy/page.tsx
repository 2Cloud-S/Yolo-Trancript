import Link from 'next/link';
import YoloMascot from '@/components/YoloMascot';

export default function RefundPolicyPage() {
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
            <YoloMascot pose="waving" size="md" className="mx-auto mb-6" />
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Refund Policy</h1>
            <p className="text-xl text-gray-600">Last Updated: May 3, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Credit-Based System</h2>
              
              <p className="mb-4">
                Yolo Transcript operates on a credit-based system. Credits are purchased in packs and are used to pay for transcription services. The current credit pack options and pricing can be found on our <Link href="/pricing" className="text-blue-600 hover:underline">Pricing</Link> page.
              </p>
              
              <p>
                Credits are consumed when you use our transcription services, with consumption rates based on audio/video length and the specific features utilized (such as speaker diarization, custom vocabulary, and sentiment analysis).
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Refund Eligibility</h2>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Eligible for Refund</h3>
              <p className="mb-4">
                We offer refunds under the following circumstances:
              </p>
              <ul className="list-disc pl-5 mb-4">
                <li>Technical issues preventing the use of purchased credits within 30 days of purchase.</li>
                <li>Duplicate or erroneous charges for the same credit pack.</li>
                <li>Service unavailability resulting in inability to use purchased credits for 7 consecutive days or more.</li>
                <li>Complete system failure resulting in irretrievable loss of credits or transcription data.</li>
              </ul>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Not Eligible for Refund</h3>
              <p className="mb-4">
                Refunds are not provided for:
              </p>
              <ul className="list-disc pl-5 mb-4">
                <li>Credits that have been partially or fully consumed.</li>
                <li>Dissatisfaction with transcription accuracy (please see our accuracy disclaimer in section 4).</li>
                <li>Changes in pricing after purchase of credits.</li>
                <li>Refund requests made more than 30 days after purchase.</li>
                <li>Violation of our Terms of Service.</li>
              </ul>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Refund Process</h2>
              
              <p className="mb-4">
                To request a refund, please follow these steps:
              </p>
              <ol className="list-decimal pl-5 mb-4">
                <li>Contact our support team at refunds@yolo-transcript.com with the subject line "Refund Request".</li>
                <li>Include the following information:
                  <ul className="list-disc pl-5 mb-4 mt-2">
                    <li>Your account email address</li>
                    <li>Date of purchase</li>
                    <li>Credit pack purchased</li>
                    <li>Reason for refund request</li>
                    <li>Any relevant documentation or screenshots</li>
                  </ul>
                </li>
                <li>Our team will review your request within 3 business days.</li>
                <li>If approved, refunds will be processed to the original payment method within 5-10 business days, depending on your payment provider.</li>
              </ol>
              
              <p>
                For urgent refund requests or specific concerns, please contact our support team directly.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Transcription Accuracy Disclaimer</h2>
              
              <p className="mb-4">
                While we strive to provide high-quality transcriptions, our service relies on artificial intelligence technology which may not achieve 100% accuracy. Transcription accuracy can be affected by various factors including:
              </p>
              <ul className="list-disc pl-5 mb-4">
                <li>Audio/video quality and background noise</li>
                <li>Speaker accents or dialects</li>
                <li>Technical or specialized terminology</li>
                <li>Multiple speakers talking simultaneously</li>
                <li>Speech clarity and pronunciation</li>
              </ul>
              
              <p className="mb-4">
                We offer features like custom vocabulary to improve accuracy for specialized terminology. However, we do not guarantee perfect transcription results and recommend that users review and edit transcripts for critical content.
              </p>
              
              <p>
                Variations in transcription accuracy do not qualify for refunds. By using our service, you acknowledge these limitations.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Credit Expiration</h2>
              
              <p className="mb-4">
                Credits purchased on Yolo Transcript do not expire. You can use your credits at any time after purchase, and they will remain in your account until used.
              </p>
              
              <p>
                In the unlikely event that we discontinue our service, we will provide at least 90 days' notice and offer pro-rated refunds for unused credits.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Enterprise and Custom Plans</h2>
              
              <p className="mb-4">
                For enterprise customers or those with custom pricing plans, refund terms may differ from this standard policy. Please refer to your specific contract terms or contact your account manager for details on refund eligibility and process.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Changes to This Policy</h2>
              
              <p>
                We may update this Refund Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date. It is your responsibility to review this Refund Policy periodically for changes.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
              
              <p>
                If you have any questions about this Refund Policy, please contact us at refunds@yolo-transcript.com.
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