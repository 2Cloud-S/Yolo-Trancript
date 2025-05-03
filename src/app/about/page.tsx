import Link from 'next/link';
import YoloMascot from '@/components/YoloMascot';

export default function AboutPage() {
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
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">About Yolo Transcript</h1>
            <p className="text-xl text-gray-600">Transforming how you work with audio and video</p>
          </div>

          <div className="prose prose-lg prose-indigo mx-auto">
            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
              <p className="mb-4">
                Founded in 2024, Yolo Transcript started with a simple mission: to make transcription accessible, accurate, and affordable for everyone.
              </p>
              <p className="mb-4">
                Our team of language enthusiasts and AI experts came together to solve the frustrations we experienced with existing transcription services. The result is a platform that combines cutting-edge AI with a delightful user experience.
              </p>
              <p>
                Today, Yolo Transcript helps thousands of users convert their audio and video content into text, saving time and making content more accessible.
              </p>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Values</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="border-2 border-gray-200 p-4 rounded-lg">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Accuracy</h3>
                  <p className="text-gray-600">We&apos;re committed to providing the most accurate transcriptions using state-of-the-art AI.</p>
                </div>
                
                <div className="border-2 border-gray-200 p-4 rounded-lg">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Accessibility</h3>
                  <p className="text-gray-600">We believe content should be accessible to everyone, regardless of how they consume information.</p>
                </div>
                
                <div className="border-2 border-gray-200 p-4 rounded-lg">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Privacy</h3>
                  <p className="text-gray-600">Your data is yours. We maintain the highest standards of privacy and security.</p>
                </div>
                
                <div className="border-2 border-gray-200 p-4 rounded-lg">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Innovation</h3>
                  <p className="text-gray-600">We continuously improve our technology to provide better results and experiences.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">The Team</h2>
              <p className="mb-6">
                Our diverse team brings together expertise in machine learning, linguistics, design, and customer experience.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="w-24 h-24 bg-[#FFD60A] rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-gray-900">
                    <span className="text-2xl font-bold">AK</span>
                  </div>
                  <h3 className="font-bold text-gray-900">Afnan K.</h3>
                  <p className="text-gray-600 text-sm">Solo Founder & CEO</p>
                </div>
                
       
              </div>
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