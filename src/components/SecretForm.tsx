import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import type { Secret, Folder } from '../types';

interface SecretFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, key: string, value: string, folderId: string) => Promise<void>;
  folders: Folder[];
  currentFolderId: string;
  secret?: Secret | null;
}

export function SecretForm({
  isOpen,
  onClose,
  onSubmit,
  folders,
  currentFolderId,
  secret,
}: SecretFormProps) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [folderId, setFolderId] = useState(currentFolderId);
  const [showValue, setShowValue] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!secret;

  useEffect(() => {
    if (isOpen) {
      if (secret) {
        setName(secret.name);
        setKey(secret.key || '');
        setValue(secret.value);
        setFolderId(secret.folder_id);
      } else {
        setName('');
        setKey('');
        setValue('');
        setFolderId(currentFolderId);
      }
      setShowValue(false);
      setError('');
    }
  }, [isOpen, secret, currentFolderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!value) {
      setError('Value is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(name.trim(), key.trim(), value, folderId);
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to save secret');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Secret' : 'Add Secret'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            placeholder="e.g., GitHub Token"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Key
          </label>
          <input
            id="key"
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono"
            placeholder="e.g., GITHUB_TOKEN"
          />
        </div>

        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Value
          </label>
          <div className="relative">
            <input
              id="value"
              type={showValue ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-2.5 pr-12 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono"
              placeholder="Enter secret value"
            />
            <button
              type="button"
              onClick={() => setShowValue(!showValue)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showValue ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="folder" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Folder
          </label>
          <select
            id="folder"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          >
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Saving...' : isEditing ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
