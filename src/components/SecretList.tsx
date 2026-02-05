import { SecretCard } from './SecretCard';
import type { Secret, Folder } from '../types';

interface SecretListProps {
  secrets: Secret[];
  folder: Folder | null;
  onAddSecret: () => void;
  onEditSecret: (secret: Secret) => void;
  onDeleteSecret: (secretId: string) => void;
  onEditFolder: () => void;
  onDeleteFolder: () => void;
}

export function SecretList({
  secrets,
  folder,
  onAddSecret,
  onEditSecret,
  onDeleteSecret,
  onEditFolder,
  onDeleteFolder,
}: SecretListProps) {
  if (!folder) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <p>Select a folder to view secrets</p>
      </div>
    );
  }

  const folderSecrets = secrets.filter((s) => s.folder_id === folder.id);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {folder.name}
          </h2>
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {folderSecrets.length} {folderSecrets.length === 1 ? 'secret' : 'secrets'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEditFolder}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Edit folder"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDeleteFolder}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete folder"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={onAddSecret}
            className="ml-2 flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Secret
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {folderSecrets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              No secrets yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Add your first secret to this folder
            </p>
            <button
              onClick={onAddSecret}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Secret
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {folderSecrets.map((secret) => (
              <SecretCard
                key={secret.id}
                secret={secret}
                onEdit={onEditSecret}
                onDelete={onDeleteSecret}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
