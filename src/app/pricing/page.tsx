'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Info } from 'lucide-react';

export default function PricingPage() {
  const [showPricingInfo, setShowPricingInfo] = useState(false);

  // Define all premium features that will be included in every plan
  const allFeatures = [
    'Premium speaker diarization',
    'Highest accuracy',
    'All export formats',
    'Priority support',
    'Sentiment analysis',
    'Custom vocabulary'
  ];

  const creditPacks = [
    {
      name: 'Starter',
      credits: '50',
      price: '$5',
      hours: '5',
      features: [
        '5 hours of transcription',
        ...allFeatures
      ],
    },
    {
      name: 'Pro',
      credits: '100',
      price: '$9',
      hours: '10',
      features: [
        '10 hours of transcription',
        ...allFeatures
      ],
      popular: true,
    },
    {
      name: 'Creator',
      credits: '250',
      price: '$20',
      hours: '25',
      features: [
        '25 hours of transcription',
        ...allFeatures
      ],
    },
    {
      name: 'Power',
      credits: '500',
      price: '$35',
      hours: '50',
      features: [
        '50 hours of transcription',
        ...allFeatures
      ],
    },
  ];

  const faq = [
    {
      question: "How do credits work?",
      answer: "1 credit equals approximately 6 minutes of transcription time. Credits are deducted from your account balance as you use the service. They never expire, so you can use them at your own pace."
    },
    {
      question: "Do all plans include the same features?",
      answer: "Yes! All plans now include our full suite of premium features including highest accuracy transcription, premium speaker diarization, sentiment analysis, and custom vocabulary. The only difference between plans is the amount of transcription credits you receive."
    },
    {
      question: "Can I upgrade my plan?",
      answer: "Yes, you can purchase additional credit packs at any time. If you find yourself needing more transcription time, simply purchase another credit pack and it will be added to your balance."
    },
    {
      question: "What happens when I run out of credits?",
      answer: "When your credit balance reaches zero, you'll need to purchase more credits to continue using the transcription service. We'll notify you when your balance is running low."
    },
    {
      question: "Are there any hidden fees?",
      answer: "No, our pricing is completely transparent. You only pay for the credit packs you purchase, with no subscription fees or hidden charges."
    },
    {
      question: "Do you offer custom enterprise plans?",
      answer: "Yes, we offer custom plans for businesses with high volume transcription needs. Please contact us for more information about enterprise pricing and features."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#FFD60A]">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">Simple, transparent pricing</h1>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-900">
              Choose the right credit pack for your transcription needs.
            </p>
          </div>
        </div>
      </header>

      <main>
        {/* Credit Packs */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* New Premium Features Banner */}
            <div className="mb-10 bg-gradient-to-r from-purple-100 to-indigo-100 border-2 border-gray-900 rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">🎉 New! All Plans Include Premium Features</h3>
                  <p className="mt-2 text-gray-700">
                    We've upgraded all our plans to include our full suite of premium features! Every plan now includes highest accuracy, premium speaker diarization, sentiment analysis, and custom vocabulary.
                  </p>
                </div>
                <div className="mt-4 md:mt-0 ml-0 md:ml-6">
                  <Link
                    href="#faq"
                    className="inline-flex items-center px-4 py-2 border-2 border-gray-900 rounded-md shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
                  >
                    Learn more
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="mt-10 space-y-4 sm:mt-0 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-4">
              {creditPacks.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-lg bg-white border-2 ${
                    plan.popular ? 'border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] scale-105' : 'border-gray-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2">
                      {plan.credits} credits
                    </div>
                    <p className="mt-8">
                      <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      {plan.hours} hours of transcription
                    </p>
                    <Link
                      href="/auth/register"
                      className={`mt-8 block w-full border-2 border-gray-900 rounded-md py-2 text-sm font-bold text-center ${
                        plan.popular ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Get started
                    </Link>
                  </div>
                  <div className="pt-6 pb-8 px-6 bg-gray-50 rounded-b-lg border-t border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 tracking-wide uppercase">What's included</h4>
                    <ul className="mt-6 space-y-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex space-x-3">
                          <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Details */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">Credit System Explained</h2>
              <p className="mt-4 text-lg text-gray-600">
                Our credit system makes it easy to pay only for what you need, with no monthly commitments.
              </p>
            </div>

            <div className="mt-10 max-w-3xl mx-auto">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg border-2 border-gray-900">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credit Pack
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transcription Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {creditPacks.map((pack) => (
                      <tr key={pack.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pack.name} ({pack.credits} cr)</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pack.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pack.hours} hours</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Credits never expire and can be used at any time. 1 credit = approximately 6 minutes of transcription.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto divide-y-2 divide-gray-200">
              <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
                Frequently asked questions
              </h2>
              <dl className="mt-6 space-y-6 divide-y divide-gray-200">
                {faq.map((faqItem, index) => (
                  <div key={index} className="pt-6">
                    <dt className="text-lg">
                      <button
                        className="text-left w-full flex justify-between items-start text-gray-900"
                      >
                        <span className="font-medium">{faqItem.question}</span>
                      </button>
                    </dt>
                    <dd className="mt-2 pr-12">
                      <p className="text-base text-gray-600">
                        {faqItem.answer}
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-12 bg-[#FFD60A]">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              <span className="block">Ready to start transcribing?</span>
              <span className="block">Get started today.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
                >
                  Get started
                </Link>
              </div>
              <div className="ml-3 inline-flex rounded-md shadow">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50"
                >
                  Contact sales
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 