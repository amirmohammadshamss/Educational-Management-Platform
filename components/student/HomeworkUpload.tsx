'use client';

/**
 * HomeworkUpload Component
 *
 * File upload component for students to submit homework
 * Features: drag & drop, validation, progress indicator, teacher selection
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { validateFile, formatFileSize } from '@/lib/blob-storage';

/**
 * Teacher option interface
 */
interface TeacherOption {
  id: string;
  name: string;
  email: string;
}

/**
 * Component props
 */
interface HomeworkUploadProps {
  studentId: string;
  teachers: TeacherOption[];
  onUploadSuccess?: (homework: any) => void;
  onUploadError?: (error: string) => void;
}

/**
 * Allowed file types for display
 */
const ALLOWED_FILE_TYPES = [
  { type: 'PDF', extensions: '.pdf' },
  { type: 'Word Documents', extensions: '.doc, .docx' },
  { type: 'Images', extensions: '.jpg, .jpeg, .png' },
];

/**
 * HomeworkUpload Component
 */
export default function HomeworkUpload({
  studentId,
  teachers,
  onUploadSuccess,
  onUploadError,
}: HomeworkUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection
   */
  const handleFileSelect = (file: File) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
    setSuccess(null);
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  /**
   * Handle drag leave
   */
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  /**
   * Handle file drop
   */
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!selectedTeacherId) {
      setError('Please select a teacher');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('studentId', studentId);
      formData.append('teacherId', selectedTeacherId);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const data = JSON.parse(xhr.responseText);
          setSuccess('Homework uploaded successfully!');
          setSelectedFile(null);
          setSelectedTeacherId('');
          setUploadProgress(0);

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

          if (onUploadSuccess) {
            onUploadSuccess(data.homework);
          }
        } else {
          const data = JSON.parse(xhr.responseText);
          const errorMessage = data.error || 'Upload failed';
          setError(errorMessage);

          if (onUploadError) {
            onUploadError(errorMessage);
          }
        }
        setUploading(false);
      });

      // Handle error
      xhr.addEventListener('error', () => {
        const errorMessage = 'Network error occurred during upload';
        setError(errorMessage);
        setUploading(false);

        if (onUploadError) {
          onUploadError(errorMessage);
        }
      });

      // Send request
      xhr.open('POST', '/api/homework/upload');
      xhr.send(formData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setUploading(false);

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  /**
   * Clear selected file
   */
  const handleClearFile = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Upload Homework
      </h2>

      <form onSubmit={handleSubmit}>
        {/* File dropzone */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="text-4xl">📎</div>
                <p className="text-lg font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-600">
                  {formatFileSize(selectedFile.size)}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">📁</div>
                <p className="text-lg font-medium text-gray-700">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-gray-500">Maximum file size: 10MB</p>
              </div>
            )}
          </div>

          {/* Allowed file types */}
          <div className="mt-3">
            <p className="text-xs text-gray-600 font-medium mb-1">
              Allowed file types:
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              {ALLOWED_FILE_TYPES.map((type) => (
                <li key={type.type}>
                  • {type.type}: {type.extensions}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Teacher selection */}
        <div className="mb-6">
          <label
            htmlFor="teacher-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Teacher
          </label>
          <select
            id="teacher-select"
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={uploading}
          >
            <option value="">-- Choose a teacher --</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.email})
              </option>
            ))}
          </select>
        </div>

        {/* Upload progress */}
        {uploading && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Uploading...
              </span>
              <span className="text-sm font-medium text-gray-700">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!selectedFile || !selectedTeacherId || uploading}
          className="w-full px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {uploading ? 'Uploading...' : 'Upload Homework'}
        </button>
      </form>
    </div>
  );
}
