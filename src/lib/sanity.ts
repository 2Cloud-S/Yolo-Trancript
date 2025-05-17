import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId } from '../sanity/env';
import imageUrlBuilder from '@sanity/image-url';

// Initialize the Sanity client
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
  perspective: 'published',
  stega: false,
});

// Helper function to generate image URLs
const builder = imageUrlBuilder(client);
export const urlFor = (source: any) => {
  if (!source) return null;
  return builder.image(source)
    .auto('format')
    .fit('max')
    .quality(80)
    .width(1920)
    .height(1080);
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

// Query to get all blog posts
export const getAllPostsQuery = `*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  categories[]->{title},
  "author": author->{name, image},
  mainImage {
    asset->,
    hotspot,
    crop
  }
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
  mainImage {
    asset->,
    hotspot,
    crop
  }
}`;

// Query to get all post slugs
export const getAllPostSlugsQuery = `*[_type == "post"] {
  "slug": slug.current
}`; 