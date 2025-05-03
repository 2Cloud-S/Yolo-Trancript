'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Bell, Lock, User, Eye, EyeOff, Save, Key } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const [showAccountSection, setShowAccountSection] = useState(true);
  const [showPrivacySection, setShowPrivacySection] = useState(false);
  
  // Account Settings state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Privacy & Security state
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load user data on component mount
  useEffect(() => {
    async function loadUserData() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setEmail(data.user.email || '');
        // Try to get user metadata if available
        const metadata = data.user.user_metadata;
        if (metadata && metadata.full_name) {
          setFullName(metadata.full_name);
        }
      }
    }
    
    loadUserData();
  }, []);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      
      if (error) throw error;
      
      setMessage({ 
        text: 'Profile updated successfully!', 
        type: 'success' 
      });
    } catch (error: any) {
      setMessage({ 
        text: error.message || 'Failed to update profile', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ 
        text: 'New passwords do not match', 
        type: 'error' 
      });
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ 
        text: 'Password updated successfully!', 
        type: 'success' 
      });
    } catch (error: any) {
      setMessage({ 
        text: error.message || 'Failed to update password', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const showAccountSectionHandler = () => {
    setShowAccountSection(true);
    setShowPrivacySection(false);
  };

  const showPrivacySectionHandler = () => {
    setShowPrivacySection(true);
    setShowAccountSection(false);
  };

  const settings = [
    {
      name: 'Account Settings',
      description: 'Manage your account preferences and profile information',
      icon: User,
      action: showAccountSectionHandler
    },
    {
      name: 'Notifications',
      description: 'Coming Soon - Configure how you receive notifications',
      icon: Bell,
      comingSoon: true,
      action: () => {}
    },
    {
      name: 'Privacy & Security',
      description: 'Manage your privacy settings and security preferences',
      icon: Lock,
      action: showPrivacySectionHandler
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>

        {/* Custom placeholder styling */}
        <style jsx global>{`
          ::placeholder {
            color: #9ca3af;
            opacity: 0.8;
            font-style: italic;
          }
        `}</style>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {settings.map((setting) => {
            const Icon = setting.icon;
            return (
              <button
                key={setting.name}
                onClick={setting.action}
                disabled={setting.comingSoon}
                className={`relative text-left rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm ${
                  setting.comingSoon 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      {setting.name}
                      {setting.comingSoon && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Coming Soon
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Message display */}
        {message.text && (
          <div className={`mt-6 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <p>{message.text}</p>
          </div>
        )}

        {/* Account Settings Section */}
        {showAccountSection && (
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Account Settings</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Update your personal information</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={fullName}
                    placeholder="Enter your full name"
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600 sm:text-sm"
                    value={email}
                    placeholder="Your email address will appear here"
                    disabled
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>
                
                <div>
              <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
              </button>
            </div>
              </form>
            </div>
          </div>
        )}

        {/* Privacy & Security Section */}
        {showPrivacySection && (
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Privacy & Security</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your security preferences</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">Current Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="current-password"
                      className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={currentPassword}
                      placeholder="Enter your current password"
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
            </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="new-password"
                      className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newPassword}
                      placeholder="Enter a new password"
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
            </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirm-password"
                      className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={confirmPassword}
                      placeholder="Confirm your new password"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {newPassword !== confirmPassword && confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                  )}
            </div>

                <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                      <Key className="h-5 w-5 text-gray-400" />
                      <span className="ml-3 text-sm font-medium text-gray-700">Two-Factor Authentication</span>
              </div>
              <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Coming Soon
              </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 ml-8">
                    Enhance your account security with two-factor authentication (2FA).
                  </p>
            </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
              </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 