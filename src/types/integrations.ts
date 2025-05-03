export interface Integration {
  id: string;
  user_id: string;
  provider: 'google_drive' | 'dropbox' | 'onedrive' | 'box';
  status: 'connected' | 'disconnected';
  connected_at: string | null;
  last_sync: string | null;
  settings?: {
    auto_save: boolean;
    folder_path: string;
    sync_frequency: 'realtime' | 'daily' | 'weekly';
    tokens?: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
  };
  created_at: string;
  updated_at: string;
} 