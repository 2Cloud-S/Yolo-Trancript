import Link from 'next/link';
import UpvoteClubLogo from '@/components/partners/UpvoteClubLogo';
import AssemblyAILogo from '@/components/partners/AssemblyAILogo';
import YoloMascot from '@/components/YoloMascot';

export const metadata = {
  title: 'Partnerships | Yolo Transcript',
  description: 'Our trusted partners who help us deliver the best transcription service.',
};

export default function PartnershipsPage() {
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
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Our Partnerships</h1>
            <p className="text-xl text-gray-600">Collaborating with industry leaders to provide the best transcription service</p>
          </div>

          <div className="space-y-8">
            {/* Upvote Club Card */}
            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-6">
                <UpvoteClubLogo />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Upvote Club</h2>
              <p className="text-gray-600 mb-6">
                A community-driven platform for developers to share and discover the best tools and resources. Through this partnership, we're able to connect with developers and get valuable feedback to improve our service.
              </p>
              <a
                href="https://upvote.club"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:underline"
              >
                Visit Upvote Club
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* AssemblyAI Card */}
            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-6">
                <AssemblyAILogo />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">AssemblyAI</h2>
              <p className="text-gray-600 mb-6">
                Leading provider of AI-powered speech recognition and natural language processing APIs. Our partnership with AssemblyAI enables us to deliver high-quality transcriptions with advanced features like speaker diarization and sentiment analysis.
              </p>
              <a
                href="https://www.assemblyai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:underline"
              >
                Visit AssemblyAI
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Partnership Opportunities */}
            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Want to Partner With Us?</h2>
              <p className="text-gray-600 mb-6">
                We're always looking for new partnerships that can help us better serve our customers. Whether you're a technology provider, content creator, or business looking to enhance your transcription capabilities, we'd love to hear from you.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 border-2 border-gray-900 text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Get in Touch
              </Link>
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