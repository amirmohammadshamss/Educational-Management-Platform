'use client';

/**
 * Student Resources Page
 *
 * Interface for students to view and download shared resources
 */

import { useEffect, useState } from 'react';
import ResourcesGallery from '@/components/student/ResourcesGallery';

interface SharedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  description: string | null;
  uploadedAt: string;
  teacherName: string | null;
  teacherId: string;
}

interface Teacher {
  id: string;
  name: string;
}

export default function StudentResourcesPage() {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
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

        // Extract unique teachers from files
        const uniqueTeachers = new Map<string, string>();
        data.files.forEach((file: SharedFile) => {
          if (file.teacherId && file.teacherName) {
            uniqueTeachers.set(file.teacherId, file.teacherName);
          }
        });

        const teachersList = Array.from(uniqueTeachers.entries()).map(([id, name]) => ({
          id,
          name,
        }));

        setTeachers(teachersList);
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
            Consultez et téléchargez les ressources partagées par vos enseignants
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Chargement des ressources...</p>
          </div>
        ) : (
          <ResourcesGallery files={files} teachers={teachers} />
        )}
      </div>
    </div>
  );
}
