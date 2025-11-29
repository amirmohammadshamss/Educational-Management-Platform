'use client';

/**
 * ResourcesGallery Component
 *
 * Card-based display of shared resources for students
 * Features: search, filter, sort, download
 */

import { useState, useMemo } from 'react';

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

interface ResourcesGalleryProps {
  files: SharedFile[];
  teachers: Array<{ id: string; name: string }>;
}

type SortOption = 'newest' | 'oldest' | 'name';

export default function ResourcesGallery({ files, teachers }: ResourcesGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
   * Get file icon and color based on filename
   */
  const getFileStyle = (fileName: string): { icon: string; color: string } => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || ''))
      return { icon: '🖼️', color: 'bg-purple-100 text-purple-800' };
    if (['mp4', 'webm', 'mov'].includes(ext || ''))
      return { icon: '🎥', color: 'bg-red-100 text-red-800' };
    if (ext === 'pdf') return { icon: '📄', color: 'bg-red-100 text-red-800' };
    if (['doc', 'docx'].includes(ext || ''))
      return { icon: '📝', color: 'bg-blue-100 text-blue-800' };
    return { icon: '📎', color: 'bg-gray-100 text-gray-800' };
  };

  /**
   * Filter and sort files
   */
  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        (file) =>
          file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.teacherName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by teacher
    if (selectedTeacher !== 'all') {
      result = result.filter((file) => file.teacherId === selectedTeacher);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
        break;
      case 'name':
        result.sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
    }

    return result;
  }, [files, searchQuery, selectedTeacher, sortBy]);

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Rechercher par nom ou description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Teacher Filter */}
          <div>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les enseignants</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Plus récents</option>
              <option value="oldest">Plus anciens</option>
              <option value="name">Nom A-Z</option>
            </select>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
                }`}
                title="Grille"
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 border-l border-gray-300 ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'
                }`}
                title="Liste"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          {filteredFiles.length} ressource{filteredFiles.length !== 1 ? 's' : ''} trouvée{filteredFiles.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune ressource trouvée
          </h3>
          <p className="text-sm text-gray-600">
            {searchQuery || selectedTeacher !== 'all'
              ? 'Essayez de modifier vos filtres de recherche'
              : 'Les enseignants n\'ont pas encore partagé de ressources'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => {
            const { icon, color } = getFileStyle(file.fileName);
            return (
              <div
                key={file.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Card Header */}
                <div className={`${color} p-6 flex items-center justify-center`}>
                  <span className="text-6xl">{icon}</span>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate" title={file.fileName}>
                    {file.fileName}
                  </h3>

                  {file.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {file.description}
                    </p>
                  )}

                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <span className="mr-4">👤 {file.teacherName || 'Enseignant'}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>📅 {formatDate(file.uploadedAt)}</span>
                    <span>📦 {formatFileSize(file.fileSize)}</span>
                  </div>

                  <a
                    href={file.fileUrl}
                    download
                    className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Télécharger
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredFiles.map((file) => {
              const { icon } = getFileStyle(file.fileName);
              return (
                <div key={file.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <span className="text-4xl">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {file.fileName}
                        </h3>
                        {file.description && (
                          <p className="text-sm text-gray-600 mb-2">{file.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>👤 {file.teacherName || 'Enseignant'}</span>
                          <span>📅 {formatDate(file.uploadedAt)}</span>
                          <span>📦 {formatFileSize(file.fileSize)}</span>
                        </div>
                      </div>
                    </div>
                    <a
                      href={file.fileUrl}
                      download
                      className="ml-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                    >
                      Télécharger
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
