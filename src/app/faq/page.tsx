'use client';

import { useState } from 'react';
import Link from 'next/link';
import YoloMascot from '@/components/YoloMascot';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Define types for FAQ item
interface FAQItemProps {
  question: string;
  answer: string;
}

// FAQ Item Component with toggle functionality
const FAQItem = ({ question, answer }: FAQItemProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="border-b border-gray-200 py-4">
      <button 
        className="flex justify-between items-center w-full text-left"
        onClick={toggleOpen}
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      
      {isOpen && (
        <div className="mt-3 text-gray-600 prose">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

export default function FAQPage() {
  // FAQ data
  const faqData = [
    {
      question: "What is Yolo Transcript?",
      answer: "Yolo Transcript is a service that automatically converts audio and video files into text transcriptions using advanced AI technology. Our platform is designed to be easy to use, accurate, and affordable."
    },
    {
      question: "What file formats do you support?",
      answer: "We support a wide range of audio and video formats, including MP3, MP4, WAV, AAC, M4A, FLAC, and more. If you have a file format not listed here, feel free to try uploading it or contact our support team for assistance."
    },
    {
      question: "How accurate are the transcriptions?",
      answer: "Our transcription service, powered by AssemblyAI, offers industry-leading accuracy. The actual accuracy depends on factors like audio quality, background noise, accents, and specialized terminology. For most clear audio recordings, you can expect accuracy rates of 90-95% or higher."
    },
    {
      question: "How long does transcription take?",
      answer: "Transcription time depends on the length of your audio or video file and current processing queue. Typically, transcription completes in about 25-50% of the file's actual duration. For example, a 10-minute audio file might be transcribed in 2.5-5 minutes."
    },
    {
      question: "Can I edit my transcriptions?",
      answer: "Yes, once your file is transcribed, you can access the full text in your dashboard. While we don't currently offer a built-in editor, you can easily copy the text to your preferred word processor for editing."
    },
    {
      question: "Do you support multiple languages?",
      answer: "Currently, we offer high-quality transcription for English. We're working on expanding our language support in the near future. Stay tuned for updates on additional languages."
    },
    {
      question: "Is speaker diarization available?",
      answer: "Yes, our service includes speaker diarization, which identifies and labels different speakers in your audio. This feature helps make your transcripts more readable and useful, especially for interviews, meetings, and conversations."
    },
    {
      question: "How secure is my data?",
      answer: "We take data security very seriously. All file uploads and transcriptions are processed over encrypted connections. Your files are stored securely and are only accessible to you. We never share or sell your data to third parties."
    },
    {
      question: "Are there any file size limits?",
      answer: "Free accounts can upload files up to 200MB in size. For our paid plans, the limit increases to 2GB per file. If you need to transcribe larger files, you can split them into smaller segments or contact us for custom solutions."
    },
    {
      question: "What happens if I exceed my monthly transcription limit?",
      answer: "If you reach your plan's monthly limit, you'll need to upgrade to a higher tier plan or wait until your next billing cycle when your transcription minutes reset. We'll notify you when you're approaching your limit."
    },
    {
      question: "How are credits calculated?",
      answer: "We calculate credits based on the duration of your media. 1 credit equals 6 minutes (360 seconds) of audio or video. For example, a 10-minute video would use 2 credits, and a 30-minute podcast would use 5 credits. We always round up to the nearest credit, with a minimum of 1 credit per transcription."
    },
    {
      question: "Do you charge partial credits for short files?",
      answer: "No, we always charge a minimum of 1 credit per transcription, even for files shorter than 6 minutes. For files longer than 6 minutes, we calculate credits based on the exact duration using the formula: Math.ceil(durationInSeconds / 360). This means a 6:01 minute file would use 2 credits."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#FFD60A] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Yolo Transcript</h1>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-900 text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <YoloMascot pose="pointing" size="md" className="mx-auto mb-6" />
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-gray-600">Find answers to common questions about Yolo Transcript</p>
          </div>

          <div className="bg-white p-8 border-2 border-gray-900 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="space-y-2">
              {faqData.map((faq, index) => (
                <FAQItem 
                  key={index} 
                  question={faq.question} 
                  answer={faq.answer} 
                />
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Still have questions?</h3>
              <p className="text-gray-600 mb-4">
                Can't find the answer you're looking for? Please reach out to our customer support team.
              </p>
              <Link 
                href="/contact" 
                className="inline-flex items-center px-4 py-2 border border-gray-900 text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 shadow-[2px_2px_0px_0px_rgba(255,214,10,1)]"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              &copy; 2025 Yolo Transcript. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy-policy" className="text-gray-400 hover:text-white text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-white text-sm">
                Terms of Service
              </Link>
              <Link href="/cookie-policy" className="text-gray-400 hover:text-white text-sm">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 