import Link from 'next/link';
import { client } from '@/sanity/lib/client';
import YoloMascot from '@/components/YoloMascot';

const TESTIMONIALS_QUERY = `*[_type == "testimonial"] | order(date desc){
  _id, author, review, rating, source, date
}`;

export default async function TestimonialsPage() {
  const testimonials = await client.fetch(TESTIMONIALS_QUERY);

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
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Customer Testimonials</h1>
            <p className="text-xl text-gray-600">What our users say about us</p>
          </div>

          <div className="space-y-8">
            {testimonials.map((t: any) => (
              <div key={t._id} className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center mb-4">
                  <span className="text-yellow-500 mr-2 text-xl">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span>
                  <span className="text-sm text-gray-500 ml-auto">{t.source}</span>
                </div>
                <blockquote className="text-lg text-gray-800 italic mb-4">"{t.review}"</blockquote>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">{t.author}</span>
                  <span className="text-sm text-gray-500">{t.date ? new Date(t.date).toLocaleDateString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
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