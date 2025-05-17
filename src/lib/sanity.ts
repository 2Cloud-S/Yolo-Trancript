import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '../sanity/env';
import imageUrlBuilder from '@sanity/image-url';
import { SanityImageSource } from '@sanity/image-url/lib/types/types';

// Initialize the Sanity client
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
  perspective: 'published',
  stega: false,
});

// Initialize the image URL builder
const builder = imageUrlBuilder(client);

// Enhanced image URL builder with proper typing and error handling
export const urlFor = (source: SanityImageSource) => {
  if (!source) return null;
  try {
    return builder.image(source)
      .auto('format')
      .fit('max')
      .quality(80);
  } catch (error) {
    console.error('Error generating image URL:', error);
    return null;
  }
};

// Helper function to get image URL
export const getImageUrl = (image: any) => {
  if (!image) return null;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${image.asset._ref
    .replace('image-', '')
    .replace('-jpg', '.jpg')
    .replace('-png', '.png')
    .replace('-webp', '.webp')}`;
}

// Query to get all blog posts with enhanced image handling
export const getAllPostsQuery = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  categories[]->{title},
  "author": author->{
    name,
    "image": image.asset->url
  },
  "mainImage": mainImage.asset->url,
  "mainImageMetadata": mainImage.asset->metadata
}`;

// Query to get a post by slug with enhanced image handling
export const getPostBySlugQuery = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  body,
  "categories": categories[]->title,
  "author": author->{
    name,
    "image": image.asset->url
  },
  "mainImage": mainImage.asset->url,
  "mainImageMetadata": mainImage.asset->metadata
}`;

// Query to get all post slugs
export const getAllPostSlugsQuery = `*[_type == "post"] {
  "slug": slug.current
}`; 