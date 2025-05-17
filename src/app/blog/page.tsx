import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { client, getAllPostsQuery, urlFor } from '@/lib/sanity';
import { trackEvent } from '@/lib/analytics';
import BlogTracker from '@/components/BlogTracker';

// Define the Post type
interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  publishedAt: string;
  categories: string[];
  author: {
    name: string;
    image?: any;
  };
  mainImage?: any;
}

export const metadata = {
  title: 'Blog | Yolo Transcript',
  description: 'Latest news, updates, and insights about transcription technology and Yolo Transcript',
};

// Set revalidation time to refresh data every 30 seconds
export const revalidate = 30;

// Get blog posts from Sanity
async function getBlogPosts() {
  try {
    const posts = await client.fetch(getAllPostsQuery, {}, {
      next: { revalidate: 30 }
    });
    return posts;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts();
  
  // Extract featured post (first post)
  const featuredPost = posts && posts.length > 0 ? posts[0] : null;
  // Rest of the posts
  const restPosts = posts && posts.length > 1 ? posts.slice(1) : [];
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white">
      <BlogTracker />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-12 pb-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">Yolo Transcript Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Insights, tutorials, and updates on audio transcription and AI technology.
          </p>
        </div>
        
        {/* Featured Post */}
        {featuredPost && (
          <div className="max-w-5xl mx-auto mb-20">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition duration-300 hover:shadow-2xl hover:-translate-y-1">
              <Link href={`/blog/${featuredPost.slug.current}`} className="flex flex-col md:flex-row">
                {featuredPost.mainImage && (
                  <div className="relative w-full md:w-2/5 h-64 md:h-auto">
                    <Image
                      src={urlFor(featuredPost.mainImage)?.width(800).height(600).url() || ''}
                      alt={featuredPost.title}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized={process.env.NODE_ENV === 'development'}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-yellow-500 text-white text-xs uppercase font-semibold px-3 py-1 rounded-full">
                        Featured
                      </span>
                    </div>
                  </div>
                )}
                <div className="p-6 md:w-3/5 flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800 hover:text-yellow-600 transition-colors">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="text-gray-600 mb-4 text-lg line-clamp-3">{featuredPost.excerpt}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {featuredPost.author.image && (
                        <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3 ring-2 ring-gray-100">
                          <Image
                            src={urlFor(featuredPost.author.image)?.width(80).height(80).url() || ''}
                            alt={featuredPost.author.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700">{featuredPost.author.name}</span>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">
                      {format(new Date(featuredPost.publishedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}
        
        {/* Post Grid */}
        <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-4">Latest Articles</h2>
        
        {restPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {restPosts.map((post: Post) => (
              <div key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-all duration-300 flex flex-col h-full border border-gray-100">
                <Link href={`/blog/${post.slug.current}`} className="flex flex-col h-full">
                  {post.mainImage && (
                    <div className="relative h-52 w-full overflow-hidden">
                      <Image
                        src={urlFor(post.mainImage)?.width(600).height(400).url() || ''}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        unoptimized={process.env.NODE_ENV === 'development'}
                      />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-grow">
                    <h2 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-yellow-600 transition-colors">
                      {post.title}
                    </h2>
                    
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">{post.excerpt}</p>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
                      <div className="flex items-center">
                        {post.author.image && (
                          <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2">
                            <Image
                              src={urlFor(post.author.image)?.width(50).height(50).url() || ''}
                              alt={post.author.name}
                              fill
                              className="object-cover"
                              sizes="50px"
                            />
                          </div>
                        )}
                        <span className="text-sm text-gray-700">{post.author.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-lg text-gray-500">No blog posts found. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
} 