'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Book, HelpCircle, ArrowRight, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CustomVocabularyManager from '@/components/CustomVocabularyManager';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function CustomVocabularyPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'manager' | 'guide' | 'examples'>('manager');
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Redirect to login if not authenticated
          router.push('/auth/login');
          return;
        }
        
        setUser(user);
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center space-y-4">
        <LoadingSkeleton type="card" className="max-w-md w-full" />
        <LoadingSkeleton type="text" size="lg" count={3} className="max-w-md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Custom Vocabulary</h1>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('manager')}
                className={`${
                  activeTab === 'manager'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Book className="mr-2 h-5 w-5" />
                Vocabulary Manager
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`${
                  activeTab === 'guide'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <HelpCircle className="mr-2 h-5 w-5" />
                How It Works
              </button>
              <button
                onClick={() => setActiveTab('examples')}
                className={`${
                  activeTab === 'examples'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                Examples
              </button>
            </nav>
          </div>
        </div>
        
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'manager' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Manage Your Custom Vocabularies</h2>
              {user && (
                <CustomVocabularyManager userId={user.id} onClose={() => {}} />
              )}
            </div>
          )}
          
          {activeTab === 'guide' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">How Custom Vocabularies Work</h2>
              
              <div className="prose max-w-none">
                <p>
                  Custom vocabularies improve transcription accuracy for specialized terms, proper names, 
                  industry jargon, acronyms, and other words that might be difficult for the AI to recognize correctly.
                </p>
                
                <h3>How it works</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>You create a vocabulary set with specialized terms relevant to your content</li>
                  <li>When you upload a file for transcription, you select which vocabulary to apply</li>
                  <li>The transcription engine gives extra "weight" to recognizing those terms</li>
                  <li>The result is more accurate transcription of domain-specific content</li>
                </ol>
                
                <h3>Best Practices</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Create focused vocabularies for specific domains (medical, legal, technical, etc.)</li>
                  <li>Include full proper names, acronyms, and technical terms</li>
                  <li>Keep vocabularies concise (ideally under 100 terms for best performance)</li>
                  <li>Use the "default" option for vocabularies you use frequently</li>
                  <li>Test and refine your vocabularies based on transcription results</li>
                </ul>
                
                <div className="bg-blue-50 p-4 rounded-lg my-4">
                  <h4 className="text-blue-700 font-medium">Pro Tips</h4>
                  <ul className="list-disc pl-5 text-blue-700 mt-2">
                    <li>For proper names, include both first and last names as separate entries</li>
                    <li>For acronyms, include both the acronym and its expanded form</li>
                    <li>Include common misspellings or alternative pronunciations of difficult terms</li>
                    <li>Add product names, brand names, and company terminology</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg my-4 flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-800 font-medium">Important Notes</h4>
                    <ul className="list-disc pl-5 text-yellow-700 mt-2">
                      <li>Custom vocabularies improve but don't guarantee perfect transcription</li>
                      <li>Terms must be in the language of the audio being transcribed</li>
                      <li>For best results, ensure clear audio quality in your recordings</li>
                      <li>Do not include sensitive personal information in vocabulary sets</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'examples' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Example Vocabularies</h2>
              
              <div className="prose max-w-none">
                <p>
                  Here are some examples of how custom vocabularies can be used in different contexts. 
                  These examples can help you understand how to create effective vocabularies for your own use cases.
                </p>
                
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  {/* Example 1: Medical */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="flex items-center text-lg font-medium text-gray-900">
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-sm mr-2">Medical</span>
                      Medical Terminology
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      For transcribing patient notes, medical lectures, or healthcare discussions.
                    </p>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Sample Terms:</h4>
                      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-1" />
                          hypertension
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-1" />
                          myocardial infarction
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-1" />
                          tachycardia
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-1" />
                          dyspnea
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-1" />
                          atherosclerosis
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-1" />
                          metastasis
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Example 2: Technology */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="flex items-center text-lg font-medium text-gray-900">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm mr-2">Tech</span>
                      Software Development
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      For transcribing technical discussions, code reviews, or programming tutorials.
                    </p>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Sample Terms:</h4>
                      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-blue-500 mr-1" />
                          React.js
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-blue-500 mr-1" />
                          Kubernetes
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-blue-500 mr-1" />
                          PostgreSQL
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-blue-500 mr-1" />
                          API endpoints
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-blue-500 mr-1" />
                          middleware
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-blue-500 mr-1" />
                          authentication
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Example 3: Legal */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="flex items-center text-lg font-medium text-gray-900">
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-sm mr-2">Legal</span>
                      Legal Terminology
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      For transcribing depositions, court proceedings, or legal consultations.
                    </p>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Sample Terms:</h4>
                      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-purple-500 mr-1" />
                          habeas corpus
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-purple-500 mr-1" />
                          voir dire
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-purple-500 mr-1" />
                          prima facie
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-purple-500 mr-1" />
                          pro bono
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-purple-500 mr-1" />
                          subpoena duces tecum
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-purple-500 mr-1" />
                          res judicata
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Example 4: Financial */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="flex items-center text-lg font-medium text-gray-900">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-sm mr-2">Finance</span>
                      Financial Terms
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      For transcribing earnings calls, financial news, or investment discussions.
                    </p>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900">Sample Terms:</h4>
                      <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-yellow-600 mr-1" />
                          EBITDA
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-yellow-600 mr-1" />
                          amortization
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-yellow-600 mr-1" />
                          liquidity ratio
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-yellow-600 mr-1" />
                          derivatives
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-yellow-600 mr-1" />
                          quantitative easing
                        </li>
                        <li className="flex items-center">
                          <Check className="h-4 w-4 text-yellow-600 mr-1" />
                          securitization
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-indigo-800 font-medium">Tips for Using These Examples</h3>
                  <ul className="list-disc pl-5 text-indigo-700 mt-2">
                    <li>Use these examples as starting points; customize with terms specific to your needs</li>
                    <li>Consider creating multiple vocabularies for different contexts rather than one large list</li>
                    <li>Remember that local terminology, company-specific terms, and proper names should be added</li>
                    <li>Review and update your vocabularies periodically as new terms become relevant</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 