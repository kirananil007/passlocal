import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import type { Vault, VaultStatus, Folder, Secret } from '../types';

export async function getVaultStatus(): Promise<VaultStatus> {
  return invoke('get_vault_status');
}

export async function setupVault(password: string): Promise<Vault> {
  return invoke('setup_vault', { password });
}

export async function unlockVault(password: string): Promise<Vault> {
  return invoke('unlock_vault', { password });
}

export async function lockVault(): Promise<void> {
  return invoke('lock_vault');
}

export async function getVault(): Promise<Vault> {
  return invoke('get_vault');
}

export async function addFolder(name: string, icon: string): Promise<Folder> {
  return invoke('add_folder', { name, icon });
}

export async function updateFolder(id: string, name: string, icon: string): Promise<Folder> {
  return invoke('update_folder', { id, name, icon });
}

export async function deleteFolder(id: string): Promise<void> {
  return invoke('delete_folder', { id });
}

export async function addSecret(name: string, key: string, value: string, folderId: string): Promise<Secret> {
  return invoke('add_secret', { name, key, value, folderId });
}

export async function updateSecret(id: string, name: string, key: string, value: string, folderId: string): Promise<Secret> {
  return invoke('update_secret', { id, name, key, value, folderId });
}

export async function deleteSecret(id: string): Promise<void> {
  return invoke('delete_secret', { id });
}

export async function copyToClipboard(text: string): Promise<void> {
  await writeText(text);
}
