/**
 * Vercel Blob Storage Utility Functions
 *
 * Handles file uploads, deletions, and validations for Vercel Blob Storage
 */

import { put, del, head } from '@vercel/blob';

/**
 * Allowed file types for uploads
 */
const ALLOWED_FILE_TYPES = {
  PDF: ['application/pdf'] as string[],
  WORD: [
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  ] as string[],
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png'] as string[],
};

/**
 * File extension mappings
 */
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Default maximum file size in MB
 */
const DEFAULT_MAX_SIZE_MB = 10;

/**
 * Upload result interface
 */
export interface UploadResult {
  url: string;
  pathname: string;
  downloadUrl: string;
  size: number;
  uploadedAt: Date;
}

/**
 * File validation error interface
 */
export interface FileValidationError {
  valid: false;
  error: string;
}

/**
 * File validation success interface
 */
export interface FileValidationSuccess {
  valid: true;
}

/**
 * File validation result type
 */
export type FileValidationResult =
  | FileValidationSuccess
  | FileValidationError;

/**
 * Validate file type
 *
 * Checks if the file type is in the allowed list (PDF, Word, Images)
 *
 * @param file - File object to validate
 * @returns Validation result with error message if invalid
 */
export function validateFileType(file: File): FileValidationResult {
  // Check MIME type
  const allowedMimeTypes = [
    ...ALLOWED_FILE_TYPES.PDF,
    ...ALLOWED_FILE_TYPES.WORD,
    ...ALLOWED_FILE_TYPES.IMAGE,
  ];

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: PDF, Word documents (.doc, .docx), Images (.jpg, .jpeg, .png)`,
    };
  }

  // Additional check for file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
    fileName.endsWith(ext)
  );

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file size
 *
 * Checks if the file size is within the maximum allowed size
 *
 * @param file - File object to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 10MB)
 * @returns Validation result with error message if invalid
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number = DEFAULT_MAX_SIZE_MB
): FileValidationResult {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty (0 bytes)',
    };
  }

  return { valid: true };
}

/**
 * Validate file completely (type and size)
 *
 * @param file - File object to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 10MB)
 * @returns Validation result with error message if invalid
 */
export function validateFile(
  file: File,
  maxSizeMB: number = DEFAULT_MAX_SIZE_MB
): FileValidationResult {
  // Validate type first
  const typeValidation = validateFileType(file);
  if (!typeValidation.valid) {
    return typeValidation;
  }

  // Validate size
  const sizeValidation = validateFileSize(file, maxSizeMB);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  return { valid: true };
}

/**
 * Generate blob path for file upload
 *
 * Creates a structured path based on the folder type
 *
 * Folder structure:
 * - homework/[studentId]/[timestamp]-[filename]
 * - profiles/[userId]/[filename]
 * - shared/[teacherId]/[filename]
 *
 * @param folder - Folder path (e.g., "homework/student_123" or "profiles/user_456")
 * @param filename - Original filename
 * @returns Full blob path
 */
export function generateBlobPath(folder: string, filename: string): string {
  // Sanitize filename - remove special characters except dots, dashes, underscores
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Add timestamp for homework uploads to ensure uniqueness
  if (folder.startsWith('homework/')) {
    const timestamp = Date.now();
    return `${folder}/${timestamp}-${sanitizedFilename}`;
  }

  // For profiles and shared, just use the filename (will overwrite existing)
  return `${folder}/${sanitizedFilename}`;
}

/**
 * Upload file to Vercel Blob Storage
 *
 * Uploads a file to Vercel Blob with automatic validation
 *
 * @param file - File object to upload
 * @param folder - Folder path (e.g., "homework/student_123")
 * @param options - Optional upload options
 * @returns Upload result with URL and metadata
 * @throws Error if validation fails or upload fails
 */
export async function uploadFile(
  file: File,
  folder: string,
  options?: {
    maxSizeMB?: number;
    addRandomSuffix?: boolean;
    cacheControlMaxAge?: number;
  }
): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file, options?.maxSizeMB);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    // Generate blob path
    const pathname = generateBlobPath(folder, file.name);

    // Upload to Vercel Blob
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: options?.addRandomSuffix ?? false,
      cacheControlMaxAge: options?.cacheControlMaxAge ?? 3600, // 1 hour default
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      downloadUrl: blob.downloadUrl,
      size: file.size,
      uploadedAt: new Date(),
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(
      `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete file from Vercel Blob Storage
 *
 * Removes a file from Vercel Blob using its URL
 *
 * @param url - Full blob URL to delete
 * @returns True if deletion was successful
 * @throws Error if deletion fails
 */
export async function deleteFile(url: string): Promise<boolean> {
  if (!url) {
    throw new Error('URL is required for file deletion');
  }

  try {
    await del(url);
    return true;
  } catch (error) {
    console.error('File deletion error:', error);
    throw new Error(
      `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get file metadata from Vercel Blob Storage
 *
 * Retrieves metadata for a blob without downloading the file
 *
 * @param url - Full blob URL
 * @returns Blob metadata
 * @throws Error if file doesn't exist or request fails
 */
export async function getFileMetadata(url: string) {
  if (!url) {
    throw new Error('URL is required to get file metadata');
  }

  try {
    const metadata = await head(url);
    return metadata;
  } catch (error) {
    console.error('File metadata error:', error);
    throw new Error(
      `Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate presigned URL for secure file access
 *
 * Note: Vercel Blob URLs are already public with unique tokens.
 * This function validates the URL and can be extended for additional security.
 *
 * For true presigned URLs with expiration, consider using Vercel Blob's
 * token-based access or implement custom signed URLs.
 *
 * @param url - Blob URL
 * @returns Presigned URL (currently returns the same URL as Vercel Blob handles this)
 */
export async function getPresignedUrl(url: string): Promise<string> {
  if (!url) {
    throw new Error('URL is required to generate presigned URL');
  }

  // Verify the blob exists
  try {
    await head(url);
    return url; // Vercel Blob URLs are already secure with tokens
  } catch (error) {
    throw new Error('File not found or URL is invalid');
  }
}

/**
 * Get file extension from filename
 *
 * @param filename - File name
 * @returns File extension (including dot) or empty string
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filename.slice(lastDotIndex).toLowerCase();
}

/**
 * Check if file is an image
 *
 * @param file - File object
 * @returns True if file is an image
 */
export function isImageFile(file: File): boolean {
  return ALLOWED_FILE_TYPES.IMAGE.includes(file.type);
}

/**
 * Check if file is a PDF
 *
 * @param file - File object
 * @returns True if file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return ALLOWED_FILE_TYPES.PDF.includes(file.type);
}

/**
 * Check if file is a Word document
 *
 * @param file - File object
 * @returns True if file is a Word document
 */
export function isWordFile(file: File): boolean {
  return ALLOWED_FILE_TYPES.WORD.includes(file.type);
}

/**
 * Format file size to human-readable string
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Batch delete files from Vercel Blob Storage
 *
 * @param urls - Array of blob URLs to delete
 * @returns Array of results (success/failure for each URL)
 */
export async function batchDeleteFiles(
  urls: string[]
): Promise<{ url: string; success: boolean; error?: string }[]> {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        await deleteFile(url);
        return { url, success: true };
      } catch (error) {
        return {
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        url: '',
        success: false,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
      };
    }
  });
}

/**
 * Export constants for use in other modules
 */
export const BLOB_CONSTANTS = {
  ALLOWED_FILE_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  DEFAULT_MAX_SIZE_MB,
} as const;
