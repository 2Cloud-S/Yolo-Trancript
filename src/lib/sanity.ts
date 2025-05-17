import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';

// Initialize the Sanity client
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03',
  useCdn: process.env.NODE_ENV === 'production',
  perspective: 'published',
  stega: false,
});

// Helper function to generate image URLs
const builder = imageUrlBuilder(client);
export const urlFor = (source: any) => builder.image(source).auto('format').fit('max');

// Query to get all blog posts
export const getAllPostsQuery = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  categories[]->{title},
  "author": author->{name, image},
  mainImage
}`;

// Query to get a post by slug
export const getPostBySlugQuery = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  body,
  "categories": categories[]->title,
  "author": author->{name, image},
  mainImage
}`;

// Query to get all post slugs
export const getAllPostSlugsQuery = `*[_type == "post"] {
  "slug": slug.current
}`; 