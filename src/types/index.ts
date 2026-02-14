export interface Secret {
  id: string;
  name: string;
  key: string;
  value: string;
  folder_id: string;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface Vault {
  folders: Folder[];
  secrets: Secret[];
  version: number;
}

export interface VaultStatus {
  exists: boolean;
  unlocked: boolean;
}

export interface CommandError {
  message: string;
}

export type AppScreen = 'loading' | 'setup' | 'unlock' | 'main';
