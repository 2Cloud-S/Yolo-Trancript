'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

export default function BlogSearch() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      // Track search event
      trackEvent('blog_search', 'content', query);
      
      // Navigate to search results
      router.push(`/blog/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full md:w-auto">
      <div className={`relative flex items-center transition-all duration-200 ${isFocused ? 'scale-105' : ''}`}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search articles..."
          className="w-full md:w-72 px-4 py-2.5 pl-10 bg-gray-100 border border-transparent rounded-full text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
          aria-label="Search blog posts"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2} 
            stroke="currentColor" 
            className={`w-4 h-4 ${isFocused ? 'text-yellow-600' : 'text-gray-500'} transition-colors duration-200`}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" 
            />
          </svg>
        </div>
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-10 text-gray-500 hover:text-gray-700"
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 p-1.5 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
          aria-label="Search"
          disabled={!query.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </form>
  );
} 