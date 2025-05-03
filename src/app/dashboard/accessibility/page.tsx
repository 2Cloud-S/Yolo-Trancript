'use client';

import { useState, useEffect } from 'react';
import { 
  Sun,
  Moon,
  Type,
  Contrast,
  Keyboard,
  Volume2,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  darkMode: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

export default function AccessibilityPage() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 16,
    highContrast: false,
    darkMode: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: false,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    // Apply settings to document
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
    document.documentElement.classList.toggle('dark', settings.darkMode);
    document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
    
    // Save settings to localStorage
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
  }, [settings]);

  const handleFontSizeChange = (size: number) => {
    setSettings(prev => ({ ...prev, fontSize: size }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleToggle = (key: keyof AccessibilitySettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const accessibilityFeatures = [
    {
      id: 'text-size',
      title: 'Text Size',
      description: 'Adjust the size of text throughout the application',
      icon: Type,
      control: (
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleFontSizeChange(Math.max(12, settings.fontSize - 2))}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Decrease text size"
          >
            A-
          </button>
          <span className="text-sm">{settings.fontSize}px</span>
          <button
            onClick={() => handleFontSizeChange(Math.min(24, settings.fontSize + 2))}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Increase text size"
          >
            A+
          </button>
        </div>
      ),
    },
    {
      id: 'high-contrast',
      title: 'High Contrast',
      description: 'Increase contrast for better readability',
      icon: Contrast,
      control: (
        <button
          onClick={() => handleToggle('highContrast')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            settings.highContrast ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={settings.highContrast}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.highContrast ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      ),
    },
    {
      id: 'dark-mode',
      title: 'Dark Mode',
      description: 'Switch between light and dark themes',
      icon: settings.darkMode ? Moon : Sun,
      control: (
        <button
          onClick={() => handleToggle('darkMode')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            settings.darkMode ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={settings.darkMode}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.darkMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      ),
    },
    {
      id: 'reduced-motion',
      title: 'Reduced Motion',
      description: 'Minimize animations and transitions',
      icon: Eye,
      control: (
        <button
          onClick={() => handleToggle('reducedMotion')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            settings.reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={settings.reducedMotion}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      ),
    },
    {
      id: 'screen-reader',
      title: 'Screen Reader Support',
      description: 'Optimize for screen reader compatibility',
      icon: Volume2,
      control: (
        <button
          onClick={() => handleToggle('screenReader')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            settings.screenReader ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={settings.screenReader}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.screenReader ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      ),
    },
    {
      id: 'keyboard-navigation',
      title: 'Keyboard Navigation',
      description: 'Enable enhanced keyboard navigation support',
      icon: Keyboard,
      control: (
        <button
          onClick={() => handleToggle('keyboardNavigation')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            settings.keyboardNavigation ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={settings.keyboardNavigation}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.keyboardNavigation ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Accessibility Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Customize your experience to make it more accessible and comfortable to use.
        </p>
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">Settings saved successfully!</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {accessibilityFeatures.map((feature) => (
          <div
            key={feature.id}
            className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              </div>
              <div className="mt-4">
                {feature.control}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Keyboard Shortcuts</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Press <kbd className="px-2 py-1 bg-gray-100 rounded">Tab</kbd> to navigate through elements</li>
                <li>Press <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> to activate buttons and links</li>
                <li>Press <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> to close modals and popups</li>
                <li>Press <kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd> to toggle switches</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 