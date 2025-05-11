import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Blog Post Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, the blog post you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/blog" 
            className="px-6 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            Browse All Posts
          </Link>
          <Link 
            href="/" 
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
