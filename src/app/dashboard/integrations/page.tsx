'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Cloud,
  HardDrive,
  Database,
  Server,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface Integration {
  id: string;
  provider: string;
  status: 'connected' | 'disconnected';
  connected_at?: string;
  last_sync?: string;
  settings?: {
    auto_save: boolean;
    folder_path?: string;
    sync_frequency?: string;
    tokens?: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
  };
}

function IntegrationsContent() {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showFuturePopup, setShowFuturePopup] = useState(false);
  const [futureProvider, setFutureProvider] = useState<string>('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    
    if (error) {
      setError(decodeURIComponent(error));
    } else if (success) {
      setError(null);
    }
    
    fetchIntegrations();
  }, [searchParams]);

  const availableIntegrations = [
    {
      id: 'google-drive',
      name: 'Google Drive',
      icon: HardDrive,
      description: 'Save transcriptions directly to your Google Drive',
      features: ['Auto-save transcriptions', 'Custom folder structure', 'Real-time sync'],
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ]
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      icon: Database,
      description: 'Store your transcriptions in Dropbox',
      features: ['Direct file upload', 'Version history', 'Team sharing'],
      scopes: ['files.metadata.readwrite', 'files.content.write']
    },
    {
      id: 'onedrive',
      name: 'OneDrive',
      icon: Server,
      description: 'Integrate with Microsoft OneDrive',
      features: ['Cloud storage', 'Office integration', 'Cross-platform sync'],
      scopes: ['Files.ReadWrite', 'offline_access']
    },
    {
      id: 'box',
      name: 'Box',
      icon: Cloud,
      description: 'Enterprise-grade cloud storage with Box',
      features: ['Secure storage', 'Advanced permissions', 'Workflow automation'],
      scopes: ['base_preview', 'base_upload', 'item_upload']
    }
  ];

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      console.log(`🔍 [integrations page] Fetching integrations for user: ${user.id}`);
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error(`❌ [integrations page] Error fetching integrations: ${error.message}`);
        throw error;
      }

      console.log(`✅ [integrations page] Found ${data?.length || 0} integrations`);
      if (data && data.length > 0) {
        console.log(`🔍 [integrations page] Integration providers: ${data.map(i => i.provider).join(', ')}`);
      }

      setIntegrations(data || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      setError('Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      const integration = availableIntegrations.find(i => i.id === provider);
      if (!integration) throw new Error('Integration not found');

      // Show popup for future integrations
      if (provider !== 'google-drive') {
        setFutureProvider(integration.name);
        setShowFuturePopup(true);
        return;
      }

      // Generate a random state for security
      const state = Math.random().toString(36).substring(7);
      
      // Store state in localStorage for verification
      localStorage.setItem('oauth_state', state);

      let authUrl = '';
      switch (provider) {
        case 'google-drive':
          window.location.href = `/api/integrations/google-drive`;
          return;
        default:
          throw new Error('Provider not implemented');
      }

      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      setError('Failed to connect to ' + provider);
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    try {
      // Revoke OAuth tokens if they exist
      if (integration.settings?.tokens) {
        switch (integration.provider) {
          case 'google_drive':
            await fetch('/api/integrations/google-drive/disconnect', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: integration.settings.tokens.access_token,
              }),
            });
            break;
          // Add other providers here
        }
      }

      await fetchIntegrations();
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      setError('Failed to disconnect from ' + integration.provider);
    }
  };

  const handleUpdateSettings = async (integration: Integration, settings: any) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({ settings })
        .eq('id', integration.id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      await fetchIntegrations();
      setSelectedIntegration(null);
    } catch (error) {
      console.error('Error updating integration settings:', error);
      setError('Failed to update settings');
    }
  };

  const handleSync = async (integration: Integration) => {
    try {
      // Implement sync logic for each provider
      switch (integration.provider) {
        case 'google_drive':
          // Check if token needs refresh
          if (integration.settings?.tokens?.expires_at && 
              Date.now() >= integration.settings.tokens.expires_at) {
            const response = await fetch('/api/integrations/google-drive/refresh-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                refresh_token: integration.settings.tokens.refresh_token,
              }),
            });

            const tokens = await response.json();
            if (!response.ok) throw new Error('Failed to refresh token');

            // Update the integration with new tokens
            await handleUpdateSettings(integration, {
              ...integration.settings,
              tokens: {
                ...integration.settings.tokens,
                access_token: tokens.access_token,
                expires_at: Date.now() + (tokens.expires_in * 1000),
              }
            });
          }

          // Get the latest files that need to be synced
          const { data: files } = await supabase
            .from('transcriptions')
            .select('*')
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .is('synced_to_drive', false)
            .limit(5);
          
          if (!files || files.length === 0) {
            setInfo('No new files to sync with Google Drive');
            return;
          }
          
          // Sync each file to Google Drive
          for (const file of files) {
            try {
              // Log the file information for debugging
              console.log(`Preparing to sync file: ${JSON.stringify({
                id: file.id,
                file_name: file.file_name,
                transcription_text: file.transcription_text ? `${file.transcription_text.substring(0, 50)}...` : null
              })}`);
              
              // Make sure we have content to sync
              if (!file.transcription_text) {
                console.log(`Skipping file ${file.id} - No transcription text available`);
                continue;
              }
              
              // Create a Blob from the transcription text
              const transcriptionBlob = new Blob([file.transcription_text], { type: 'text/plain' });
              
              // Convert the Blob to a base64 string for sending to the API
              const reader = new FileReader();
              const textBase64 = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(transcriptionBlob);
              });
              
              // Get the filename from the record or generate one
              const fileName = file.file_name || `transcript_${file.id}.txt`;
              
              const syncResponse = await fetch('/api/integrations/google-drive/sync', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  fileId: file.id,
                  fileName: fileName,
                  fileType: 'text/plain',
                  fileUrl: textBase64
                }),
              });
              
              if (!syncResponse.ok) {
                const errorData = await syncResponse.json();
                console.error(`Error syncing file ${file.id}:`, errorData);
                throw new Error(errorData.error || 'Failed to sync file with Google Drive');
              }
              
              // Mark file as synced
              await supabase
                .from('transcriptions')
                .update({ synced_to_drive: true })
                .eq('id', file.id);
                
              console.log(`Successfully synced file: ${file.id}`);
            } catch (error) {
              console.error(`Error syncing file ${file.id}:`, error);
              // Continue with the next file instead of stopping the entire process
            }
          }

          // Update last sync time
          await handleUpdateSettings(integration, {
            ...integration.settings,
            last_sync: new Date().toISOString()
          });
          
          setInfo(`Successfully synced ${files.length} files to Google Drive`);
          break;
        // Add other providers here
      }

      await fetchIntegrations();
    } catch (error) {
      console.error('Error syncing integration:', error);
      setError(`Error syncing integration: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {info && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{info}</p>
            </div>
          </div>
        </div>
      )}

      {/* Future Integration Popup */}
      {showFuturePopup && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Coming Soon!
              </h3>
              <button
                onClick={() => setShowFuturePopup(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {futureProvider} integration is coming soon! We're working hard to bring you more cloud storage options.
                Stay tuned for updates.
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setShowFuturePopup(false)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Integrations</h1>
        <p className="mt-2 text-sm text-gray-600">
          Connect your cloud storage services to automatically save and sync your transcriptions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {availableIntegrations.map((integration) => {
          const connectedIntegration = integrations.find(i => i.provider === integration.id.replace('-', '_'));
          const isConnected = connectedIntegration?.status === 'connected';

          return (
            <div
              key={integration.id}
              className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <integration.icon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{integration.name}</h3>
                      <p className="text-sm text-gray-500">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {isConnected ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        <XCircle className="h-4 w-4 mr-1" />
                        Disconnected
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
                  <ul className="space-y-2">
                    {integration.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  {isConnected ? (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setSelectedIntegration(connectedIntegration)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </button>
                      <button
                        onClick={() => handleSync(connectedIntegration)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync
                      </button>
                      <button
                        onClick={() => handleDisconnect(connectedIntegration)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration.id)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Cloud className="h-4 w-4 mr-2" />
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Settings Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedIntegration.provider} Settings
                </h3>
                <button
                  onClick={() => setSelectedIntegration(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedIntegration.settings?.auto_save}
                      onChange={(e) => handleUpdateSettings(selectedIntegration, {
                        ...selectedIntegration.settings,
                        auto_save: e.target.checked
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Auto-save transcriptions</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Folder Path
                  </label>
                  <input
                    type="text"
                    value={selectedIntegration.settings?.folder_path}
                    onChange={(e) => handleUpdateSettings(selectedIntegration, {
                      ...selectedIntegration.settings,
                      folder_path: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="/Transcriptions"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sync Frequency
                  </label>
                  <select
                    value={selectedIntegration.settings?.sync_frequency}
                    onChange={(e) => handleUpdateSettings(selectedIntegration, {
                      ...selectedIntegration.settings,
                      sync_frequency: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="realtime">Real-time</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div>Loading integrations...</div>}>
      <IntegrationsContent />
    </Suspense>
  );
} 