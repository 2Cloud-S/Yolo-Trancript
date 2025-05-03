'use client';

import { useState } from 'react';
import { Book, Settings as SettingsIcon, X } from 'lucide-react';
import CustomVocabularyManager from './CustomVocabularyManager';

interface UserSettingsProps {
  userId: string;
}

export default function UserSettings({ userId }: UserSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'vocabulary' | 'account'>('vocabulary');
  
  if (!userId) return null;
  
  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center text-gray-600 hover:text-gray-900"
        title="Settings"
      >
        <SettingsIcon className="h-5 w-5" />
      </button>
      
      {/* Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex h-[600px]">
              {/* Sidebar */}
              <div className="w-48 bg-gray-50 border-r p-4">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('vocabulary')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                      activeTab === 'vocabulary' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Book className="mr-3 h-5 w-5" />
                    Custom Vocabulary
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('account')}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                      activeTab === 'account' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <SettingsIcon className="mr-3 h-5 w-5" />
                    Account
                  </button>
                </nav>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-auto p-6">
                {activeTab === 'vocabulary' && (
                  <div className="h-full">
                    <div className="prose prose-sm mb-4">
                      <h3>Custom Vocabulary</h3>
                      <p>
                        Create custom vocabularies to improve transcription accuracy for domain-specific
                        content, technical terms, or proper names that may be difficult to transcribe.
                      </p>
                    </div>
                    
                    <CustomVocabularyManager
                      userId={userId}
                      onClose={() => {}}
                    />
                  </div>
                )}
                
                {activeTab === 'account' && (
                  <div className="prose prose-sm">
                    <h3>Account Settings</h3>
                    <p>
                      Account settings will be available in a future update.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 