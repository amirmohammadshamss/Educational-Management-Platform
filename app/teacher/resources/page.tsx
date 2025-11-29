'use client';

/**
 * Teacher Resources Page
 *
 * Interface for teachers to upload and manage shared files
 */

import { useEffect, useState } from 'react';
import FileUploadForm from '@/components/teacher/FileUploadForm';
import SharedFilesList from '@/components/teacher/SharedFilesList';

interface SharedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  description: string | null;
  uploadedAt: string;
  teacherName: string | null;
}

export default function TeacherResourcesPage() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch shared files
   */
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/shared-files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch files on mount
   */
  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ressources partagées</h1>
          <p className="mt-2 text-sm text-gray-600">
            Téléchargez et partagez des fichiers avec vos étudiants
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <FileUploadForm onUploadSuccess={fetchFiles} />
          </div>

          {/* Files List */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Mes fichiers ({files.length})
              </h2>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Chargement...</p>
              </div>
            ) : (
              <SharedFilesList
                files={files}
                onFileDeleted={fetchFiles}
                onFileUpdated={fetchFiles}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
