import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { SecretList } from './SecretList';
import { SecretForm } from './SecretForm';
import { FolderForm } from './FolderForm';
import { ConfirmDialog } from './ConfirmDialog';
import * as api from '../lib/api';
import type { Vault, Secret, Folder } from '../types';

interface LayoutProps {
  vault: Vault;
  onVaultUpdate: (vault: Vault) => void;
  onLock: () => void;
}

export function Layout({ vault, onVaultUpdate, onLock }: LayoutProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    vault.folders[0]?.id || null
  );

  // Modal states
  const [secretFormOpen, setSecretFormOpen] = useState(false);
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  // Confirm dialog states
  const [deleteSecretId, setDeleteSecretId] = useState<string | null>(null);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);

  const selectedFolder = vault.folders.find((f) => f.id === selectedFolderId) || null;

  // Secret handlers
  const handleAddSecret = () => {
    setEditingSecret(null);
    setSecretFormOpen(true);
  };

  const handleEditSecret = (secret: Secret) => {
    setEditingSecret(secret);
    setSecretFormOpen(true);
  };

  const handleSecretSubmit = async (name: string, key: string, value: string, notes: string, folderId: string) => {
    if (editingSecret) {
      const updated = await api.updateSecret(editingSecret.id, name, key, value, notes, folderId);
      onVaultUpdate({
        ...vault,
        secrets: vault.secrets.map((s) => (s.id === updated.id ? updated : s)),
      });
    } else {
      const newSecret = await api.addSecret(name, key, value, notes, folderId);
      onVaultUpdate({
        ...vault,
        secrets: [...vault.secrets, newSecret],
      });
    }
  };

  const handleDeleteSecret = async () => {
    if (!deleteSecretId) return;
    await api.deleteSecret(deleteSecretId);
    onVaultUpdate({
      ...vault,
      secrets: vault.secrets.filter((s) => s.id !== deleteSecretId),
    });
    setDeleteSecretId(null);
  };

  // Folder handlers
  const handleAddFolder = () => {
    setEditingFolder(null);
    setFolderFormOpen(true);
  };

  const handleEditFolder = () => {
    if (selectedFolder) {
      setEditingFolder(selectedFolder);
      setFolderFormOpen(true);
    }
  };

  const handleFolderSubmit = async (name: string, icon: string) => {
    if (editingFolder) {
      const updated = await api.updateFolder(editingFolder.id, name, icon);
      onVaultUpdate({
        ...vault,
        folders: vault.folders.map((f) => (f.id === updated.id ? updated : f)),
      });
    } else {
      const newFolder = await api.addFolder(name, icon);
      onVaultUpdate({
        ...vault,
        folders: [...vault.folders, newFolder],
      });
      setSelectedFolderId(newFolder.id);
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderId) return;

    // Get the vault state after deletion
    await api.deleteFolder(deleteFolderId);
    const updatedVault = await api.getVault();
    onVaultUpdate(updatedVault);

    // Select another folder
    if (selectedFolderId === deleteFolderId) {
      setSelectedFolderId(updatedVault.folders[0]?.id || null);
    }
    setDeleteFolderId(null);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar
        folders={vault.folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onAddFolder={handleAddFolder}
        onLock={onLock}
      />

      <SecretList
        secrets={vault.secrets}
        folder={selectedFolder}
        onAddSecret={handleAddSecret}
        onEditSecret={handleEditSecret}
        onDeleteSecret={(id) => setDeleteSecretId(id)}
        onEditFolder={handleEditFolder}
        onDeleteFolder={() => selectedFolderId && setDeleteFolderId(selectedFolderId)}
      />

      {/* Secret Form Modal */}
      <SecretForm
        isOpen={secretFormOpen}
        onClose={() => {
          setSecretFormOpen(false);
          setEditingSecret(null);
        }}
        onSubmit={handleSecretSubmit}
        folders={vault.folders}
        currentFolderId={selectedFolderId || vault.folders[0]?.id || ''}
        secret={editingSecret}
      />

      {/* Folder Form Modal */}
      <FolderForm
        isOpen={folderFormOpen}
        onClose={() => {
          setFolderFormOpen(false);
          setEditingFolder(null);
        }}
        onSubmit={handleFolderSubmit}
        folder={editingFolder}
      />

      {/* Delete Secret Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteSecretId}
        onClose={() => setDeleteSecretId(null)}
        onConfirm={handleDeleteSecret}
        title="Delete Secret"
        message="Are you sure you want to delete this secret? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* Delete Folder Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteFolderId}
        onClose={() => setDeleteFolderId(null)}
        onConfirm={handleDeleteFolder}
        title="Delete Folder"
        message="Are you sure you want to delete this folder? Secrets in this folder will be moved to another folder."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
