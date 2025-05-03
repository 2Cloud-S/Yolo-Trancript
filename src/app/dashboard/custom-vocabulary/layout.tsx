import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Custom Vocabulary Manager | Yolo Transcript',
  description: 'Create and manage custom vocabularies to improve transcription accuracy for specialized terms, industry jargon, acronyms, and proper names.',
  openGraph: {
    title: 'Custom Vocabulary Manager | Yolo Transcript',
    description: 'Improve transcription accuracy with custom vocabularies for specialized terms and industry jargon.',
    images: ['/images/custom-vocabulary-og.png'],
  },
};

export default function CustomVocabularyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 