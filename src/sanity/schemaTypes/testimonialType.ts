import { defineType } from 'sanity';

export default defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    {
      name: 'author',
      type: 'string',
      title: 'Author',
    },
    {
      name: 'review',
      type: 'text',
      title: 'Review',
    },
    {
      name: 'rating',
      type: 'number',
      title: 'Rating',
      validation: Rule => Rule.min(1).max(5),
    },
    {
      name: 'source',
      type: 'string',
      title: 'Source',
      initialValue: 'Google',
    },
    {
      name: 'date',
      type: 'date',
      title: 'Date',
    },
  ],
}); 