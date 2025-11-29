'use client';

/**
 * SharedFilesList Component
 *
 * Table display of teacher's shared files
 * Features: view, edit description, delete
 */

import { useState } from 'react';

interface SharedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  description: string | null;
  uploadedAt: string;
  teacherName: string | null;
}

interface SharedFilesListProps {
  files: SharedFile[];
  onFileDeleted: () => void;
  onFileUpdated: () => void;
}

export default function SharedFilesList({
  files,
  onFileDeleted,
  onFileUpdated,
}: SharedFilesListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Get file icon based on filename
   */
  const getFileIcon = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '🖼️';
    if (['mp4', 'webm', 'mov'].includes(ext || '')) return '🎥';
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    return '📎';
  };

  /**
   * Handle delete file
   */
  const handleDelete = async (fileId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      return;
    }

    setIsDeleting(fileId);

    try {
      const response = await fetch(`/api/shared-files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Échec de la suppression du fichier');
      }

      onFileDeleted();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Erreur lors de la suppression du fichier');
    } finally {
      setIsDeleting(null);
    }
  };

  /**
   * Start editing description
   */
  const startEdit = (file: SharedFile) => {
    setEditingId(file.id);
    setEditDescription(file.description || '');
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditDescription('');
  };

  /**
   * Save edited description
   */
  const saveEdit = async (fileId: string) => {
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/shared-files/${fileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: editDescription }),
      });

      if (!response.ok) {
        throw new Error('Échec de la mise à jour du fichier');
      }

      setEditingId(null);
      setEditDescription('');
      onFileUpdated();
    } catch (error) {
      console.error('Error updating file:', error);
      alert('Erreur lors de la mise à jour du fichier');
    } finally {
      setIsUpdating(false);
    }
  };

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun fichier partagé
        </h3>
        <p className="text-sm text-gray-600">
          Téléchargez votre premier fichier pour le partager avec vos étudiants
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fichier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Taille
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getFileIcon(file.fileName)}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {file.fileName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {editingId === file.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveEdit(file.id)}
                          disabled={isUpdating}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-300"
                        >
                          {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={isUpdating}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      {file.description || (
                        <span className="italic text-gray-400">Aucune description</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{formatDate(file.uploadedAt)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{formatFileSize(file.fileSize)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    <a
                      href={file.fileUrl}
                      download
                      className="text-blue-600 hover:text-blue-900"
                      title="Télécharger"
                    >
                      ⬇️
                    </a>
                    {editingId !== file.id && (
                      <button
                        onClick={() => startEdit(file)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Modifier la description"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={isDeleting === file.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      title="Supprimer"
                    >
                      {isDeleting === file.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
