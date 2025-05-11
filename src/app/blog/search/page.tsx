'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { client, getAllPostsQuery, urlFor } from '@/lib/sanity';
import { trackEvent } from '@/lib/analytics';

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt?: string;
  categories: { title: string }[];
  author: {
    name: string;
    image?: any;
  };
  mainImage?: any;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    // Track search event
    trackEvent('blog_search_results_view', 'content', query);

    async function fetchPosts() {
      try {
        setIsLoading(true);
        const allPosts = await client.fetch(getAllPostsQuery);
        
        // Simple search that looks for the query in title or excerpt
        const filteredPosts = allPosts.filter((post: Post) => {
          const titleMatch = post.title?.toLowerCase().includes(query.toLowerCase());
          const excerptMatch = post.excerpt?.toLowerCase().includes(query.toLowerCase());
          return titleMatch || excerptMatch;
        });
        
        setPosts(filteredPosts);
      } catch (err) {
        console.error('Error searching posts:', err);
        setError('Failed to search blog posts. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPosts();
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">
            {query ? `Search Results for "${query}"` : 'Search Results'}
          </h1>
          <div className="w-16 h-1 bg-yellow-500 mx-auto mb-6"></div>
          {!isLoading && posts.length > 0 && (
            <p className="text-lg text-gray-600">
              Found {posts.length} {posts.length === 1 ? 'result' : 'results'}
            </p>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative w-16 h-16">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-t-yellow-500 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600">Searching for "{query}"...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-600 text-lg font-medium">{error}</p>
            <Link href="/blog" className="mt-6 inline-block px-5 py-2.5 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors">
              Return to Blog
            </Link>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white shadow-sm rounded-xl p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No Results Found</h2>
            <p className="text-gray-500 text-lg mb-8">
              No blog posts found matching "{query}". Try different keywords or check for typos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/blog" className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Browse All Posts
              </Link>
              <button 
                onClick={() => window.history.back()} 
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <>            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link 
                  href={`/blog/${post.slug.current}`}
                  key={post._id} 
                  className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full border border-gray-100"
                >
                  {post.mainImage ? (
                    <div className="relative h-56 w-full overflow-hidden">
                      <Image
                        src={urlFor(post.mainImage).width(600).height(400).url()}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      
                      {/* Overlay with publish date */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <span className="text-white text-sm font-medium opacity-90">
                          {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-100 h-40 flex items-center justify-center">
                      <span className="text-yellow-800 text-xl font-serif italic">Yolo Transcript</span>
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-yellow-600 transition-colors">
                      {post.title}
                    </h2>
                    
                    {post.excerpt && (
                      <p className="text-gray-600 mb-5 line-clamp-3 flex-grow">{post.excerpt}</p>
                    )}
                    
                    <div className="flex items-center mt-auto pt-4 border-t border-gray-100">
                      {post.author.image ? (
                        <div className="flex items-center">
                          <div className="relative h-8 w-8 rounded-full overflow-hidden mr-3 ring-2 ring-gray-100">
                            <Image
                              src={urlFor(post.author.image).width(50).height(50).url()}
                              alt={post.author.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{post.author.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-700">{post.author.name}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <Link 
                href="/blog" 
                className="inline-flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
              >
                <span>View All Posts</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 