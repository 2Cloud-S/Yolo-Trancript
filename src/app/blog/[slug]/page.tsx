import Image from 'next/image';
import Link from 'next/link';
import { PortableText } from '@portabletext/react';
import { format } from 'date-fns';
import { client, getPostBySlugQuery, getAllPostSlugsQuery, urlFor } from '@/lib/sanity';
import { notFound } from 'next/navigation';
import React from 'react';
import BlogPostTracker from '@/components/BlogPostTracker';

interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt?: string;
  body: any[];
  categories: string[];
  author: {
    name: string;
    image?: any;
  };
  mainImage?: any;
}

interface Params {
  slug: string;
}

// Configure Portable Text components
const ptComponents = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset?._ref) {
        return null;
      }
      return (
        <figure className="my-10">
          <div className="relative w-full h-96 md:h-[500px] overflow-hidden rounded-lg">
            <Image
              src={urlFor(value)?.width(1200).height(800).url() || ''}
              alt={value.alt || 'Blog post image'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </div>
          {value.alt && (
            <figcaption className="mt-2 text-center text-sm text-gray-500 italic">
              {value.alt}
            </figcaption>
          )}
        </figure>
      );
    },
  },
  marks: {
    link: ({ children, value }: any) => {
      const rel = !value.href.startsWith('/') ? 'noreferrer noopener' : undefined;
      return (
        <a 
          href={value.href} 
          rel={rel} 
          className="text-yellow-600 hover:text-yellow-700 font-medium hover:underline decoration-2 underline-offset-2 transition-colors"
          target={!value.href.startsWith('/') ? '_blank' : undefined}
        >
          {children}
        </a>
      );
    },
    strong: ({ children }: any) => <strong className="font-bold text-gray-900">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-gray-800">{children}</em>,
  },
  block: {
    h1: ({ children }: any) => <h1 className="text-3xl font-bold mt-10 mb-4 text-gray-900">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-bold mt-8 mb-3 text-gray-900">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-bold mt-6 mb-2 text-gray-900">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-lg font-bold mt-4 mb-2 text-gray-900">{children}</h4>,
    normal: ({ children }: any) => <p className="mb-5 text-lg leading-relaxed text-gray-700">{children}</p>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-yellow-500 pl-6 py-1 my-8 text-xl font-serif italic text-gray-700 bg-yellow-50 rounded-r-lg">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => <ul className="list-disc pl-8 mb-6 space-y-2 text-gray-700">{children}</ul>,
    number: ({ children }: any) => <ol className="list-decimal pl-8 mb-6 space-y-2 text-gray-700">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: any) => <li className="text-lg">{children}</li>,
    number: ({ children }: any) => <li className="text-lg">{children}</li>,
  },
};

// Define the params type as a Promise
type ParamsType = Promise<{ slug: string }>;

// Generate metadata for the page
export async function generateMetadata({ params }: { params: ParamsType }) {
  const { slug } = await params;
  const post = await getPost({ slug });
  
  if (!post) {
    return {
      title: 'Post Not Found | Yolo Transcript Blog',
      description: 'The requested blog post could not be found.',
    };
  }
  
  const mainImageUrl = post.mainImage ? urlFor(post.mainImage)?.width(1200).height(630).url() : null;
  
  return {
    title: `${post.title} | Yolo Transcript Blog`,
    description: post.excerpt || `Read ${post.title} on the Yolo Transcript blog`,
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read ${post.title} on the Yolo Transcript blog`,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: mainImageUrl ? [mainImageUrl] : [],
    },
  };
}

// Generate static paths for all blog posts
export async function generateStaticParams() {
  const slugs = await client.fetch(getAllPostSlugsQuery);
  return slugs.map((slug: { slug: string }) => ({ slug: slug.slug }));
}

// Fetch the blog post data
async function getPost(params: Params): Promise<Post | null> {
  try {
    return await client.fetch(getPostBySlugQuery, { slug: params.slug });
  } catch (error) {
    console.error(`Error fetching post with slug "${params.slug}":`, error);
    return null;
  }
}

// Define the component props with the Promise-based params type
type Props = {
  params: ParamsType;
};

export default async function BlogPostPage({ params }: Props) {
  // Await the params before using them
  const { slug } = await params;
  const post = await getPost({ slug });
  
  if (!post) {
    notFound();
  }
  
  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Post Header */}
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">{post.title}</h1>
            
            {post.excerpt && (
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {post.excerpt}
              </p>
            )}
            
            <div className="flex items-center mb-8">
              {post.author.image && (
                <div className="relative h-14 w-14 rounded-full overflow-hidden mr-4 ring-2 ring-yellow-50">
                  <Image
                    src={urlFor(post.author.image)?.width(100).height(100).url() || ''}
                    alt={post.author.name}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-800">{post.author.name}</p>
                <p className="text-sm text-gray-500">
                  Published on {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
            
            {post.categories?.length > 0 && (
              <div className="mb-10">
                {post.categories.map((category) => (
                  <span 
                    key={category} 
                    className="inline-block bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full mr-2"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Featured Image */}
          {post.mainImage && (
            <div className="relative w-full h-96 md:h-[600px] mb-12 rounded-xl overflow-hidden">
              <Image
                src={urlFor(post.mainImage)?.width(1600).height(900).url() || ''}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 1600px"
              />
            </div>
          )}
          
          {/* Post Content */}
          <div className="prose prose-lg max-w-none">
            <PortableText value={post.body || []} components={ptComponents} />
          </div>
          
          {/* Author Bio Card */}
          <div className="bg-yellow-50 rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 border border-yellow-100">
            {post.author.image && (
              <div className="relative h-20 w-20 flex-shrink-0 rounded-full overflow-hidden ring-4 ring-white">
                <Image
                  src={urlFor(post.author.image).width(200).height(200).url()}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold mb-2 text-gray-900">About {post.author.name}</h3>
              <p className="text-gray-700">
                Writer at Yolo Transcript. Passionate about AI technology and its applications in audio transcription.
              </p>
            </div>
          </div>
          
          {/* Post Navigation */}
          <div className="mt-10 flex justify-center">
            <Link 
              href="/blog" 
              className="inline-flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Back to All Articles</span>
            </Link>
          </div>
          
          <BlogPostTracker slug={slug} title={post.title} />
        </div>
      </div>
    </div>
  );
} 