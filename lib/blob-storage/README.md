# Vercel Blob Storage Utility

This module provides comprehensive utilities for managing file uploads and storage using Vercel Blob Storage.

## Overview

The blob storage system handles file uploads, deletions, and validations for the Educational Management Platform. It supports PDF, Word documents, and images with a maximum file size of 10MB.

---

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Core Functions](#core-functions)
  - [File Upload](#file-upload)
  - [File Deletion](#file-deletion)
  - [File Validation](#file-validation)
  - [Utility Functions](#utility-functions)
- [Folder Structure](#folder-structure)
- [File Type Support](#file-type-support)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [TypeScript Types](#typescript-types)

---

## Installation

The `@vercel/blob` package is already installed. If you need to reinstall:

```bash
npm install @vercel/blob
```

---

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

Get your token from:
1. Vercel Dashboard → Your Project → Storage → Blob
2. Create new token with read/write access

---

## Core Functions

### File Upload

#### `uploadFile(file, folder, options?)`

Uploads a file to Vercel Blob Storage with automatic validation.

**Parameters:**
- `file` (File): File object to upload
- `folder` (string): Folder path (e.g., "homework/student_123")
- `options?` (object):
  - `maxSizeMB?` (number): Maximum file size in MB (default: 10)
  - `addRandomSuffix?` (boolean): Add random suffix to filename (default: false)
  - `cacheControlMaxAge?` (number): Cache duration in seconds (default: 3600)

**Returns:** Promise<UploadResult>

```typescript
interface UploadResult {
  url: string;           // Full blob URL
  pathname: string;      // Blob pathname
  downloadUrl: string;   // Download URL
  size: number;          // File size in bytes
  uploadedAt: Date;      // Upload timestamp
}
```

**Example:**

```typescript
import { uploadFile } from '@/lib/blob-storage';

// Upload homework file
const result = await uploadFile(file, `homework/${studentId}`);
console.log('File uploaded:', result.url);

// Upload with custom options
const result = await uploadFile(file, `profiles/${userId}`, {
  maxSizeMB: 5,
  addRandomSuffix: true,
  cacheControlMaxAge: 7200 // 2 hours
});
```

**Throws:**
- Error if file validation fails (invalid type or size)
- Error if upload to Vercel Blob fails

---

### File Deletion

#### `deleteFile(url)`

Deletes a file from Vercel Blob Storage.

**Parameters:**
- `url` (string): Full blob URL to delete

**Returns:** Promise<boolean>

**Example:**

```typescript
import { deleteFile } from '@/lib/blob-storage';

// Delete a single file
await deleteFile('https://abc123.public.blob.vercel-storage.com/file.pdf');
```

#### `batchDeleteFiles(urls)`

Deletes multiple files in parallel.

**Parameters:**
- `urls` (string[]): Array of blob URLs to delete

**Returns:** Promise<Array<{ url: string; success: boolean; error?: string }>>

**Example:**

```typescript
import { batchDeleteFiles } from '@/lib/blob-storage';

const urls = [
  'https://abc123.public.blob.vercel-storage.com/file1.pdf',
  'https://abc123.public.blob.vercel-storage.com/file2.pdf',
];

const results = await batchDeleteFiles(urls);
results.forEach(result => {
  if (result.success) {
    console.log(`Deleted: ${result.url}`);
  } else {
    console.error(`Failed: ${result.url} - ${result.error}`);
  }
});
```

---

### File Validation

#### `validateFile(file, maxSizeMB?)`

Validates both file type and size.

**Parameters:**
- `file` (File): File to validate
- `maxSizeMB?` (number): Maximum size in MB (default: 10)

**Returns:** FileValidationResult

```typescript
type FileValidationResult =
  | { valid: true }
  | { valid: false; error: string };
```

**Example:**

```typescript
import { validateFile } from '@/lib/blob-storage';

const validation = validateFile(file);
if (!validation.valid) {
  console.error(validation.error);
  return;
}

// File is valid, proceed with upload
```

#### `validateFileType(file)`

Validates only the file type.

**Example:**

```typescript
import { validateFileType } from '@/lib/blob-storage';

const typeValidation = validateFileType(file);
if (!typeValidation.valid) {
  alert(typeValidation.error);
}
```

#### `validateFileSize(file, maxSizeMB?)`

Validates only the file size.

**Example:**

```typescript
import { validateFileSize } from '@/lib/blob-storage';

const sizeValidation = validateFileSize(file, 5); // Max 5MB
if (!sizeValidation.valid) {
  alert(sizeValidation.error);
}
```

---

### Utility Functions

#### `getFileMetadata(url)`

Retrieves file metadata without downloading.

**Example:**

```typescript
import { getFileMetadata } from '@/lib/blob-storage';

const metadata = await getFileMetadata(blobUrl);
console.log('Content-Type:', metadata.contentType);
console.log('Size:', metadata.size);
```

#### `getPresignedUrl(url)`

Generates a presigned URL for secure access.

**Note:** Vercel Blob URLs are already secure with built-in tokens. This function validates the URL exists.

**Example:**

```typescript
import { getPresignedUrl } from '@/lib/blob-storage';

const presignedUrl = await getPresignedUrl(blobUrl);
// Use presignedUrl for download or display
```

#### `formatFileSize(bytes)`

Formats file size to human-readable string.

**Example:**

```typescript
import { formatFileSize } from '@/lib/blob-storage';

console.log(formatFileSize(1024));        // "1 KB"
console.log(formatFileSize(1048576));     // "1 MB"
console.log(formatFileSize(2500000));     // "2.38 MB"
```

#### Type Checking Functions

```typescript
import { isImageFile, isPDFFile, isWordFile } from '@/lib/blob-storage';

if (isImageFile(file)) {
  // Show image preview
}

if (isPDFFile(file)) {
  // PDF-specific handling
}

if (isWordFile(file)) {
  // Word document handling
}
```

#### `getFileExtension(filename)`

Extracts file extension from filename.

**Example:**

```typescript
import { getFileExtension } from '@/lib/blob-storage';

const ext = getFileExtension('document.pdf'); // ".pdf"
const ext2 = getFileExtension('photo.JPG');   // ".jpg" (lowercase)
```

---

## Folder Structure

The blob storage uses a structured folder hierarchy:

### Homework Files
```
homework/[studentId]/[timestamp]-[filename]
```

Example: `homework/clh1a2b3c/1732752000000-assignment.pdf`

**Features:**
- Timestamp prefix ensures uniqueness
- Prevents filename conflicts
- Easy to query by student

### Profile Pictures
```
profiles/[userId]/[filename]
```

Example: `profiles/clh1a2b3c/avatar.jpg`

**Features:**
- Overwrites existing file with same name
- One profile picture per user

### Shared Resources
```
shared/[teacherId]/[filename]
```

Example: `shared/clh1a2b3c/lecture-notes.pdf`

**Features:**
- Teachers share resources with students
- Organized by teacher

---

## File Type Support

### Supported File Types

| Category | MIME Types | Extensions |
|----------|-----------|------------|
| **PDF** | `application/pdf` | `.pdf` |
| **Word Documents** | `application/msword`<br>`application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `.doc`<br>`.docx` |
| **Images** | `image/jpeg`<br>`image/jpg`<br>`image/png` | `.jpg`<br>`.jpeg`<br>`.png` |

### File Size Limits

- **Default Maximum:** 10MB
- **Configurable:** Can be adjusted per upload
- **Minimum:** File must not be empty (0 bytes)

---

## Usage Examples

### Example 1: Student Homework Upload

```typescript
import { uploadFile, validateFile } from '@/lib/blob-storage';
import { prisma } from '@/lib/prisma';

export async function uploadHomework(
  studentId: string,
  teacherId: string,
  file: File
) {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Upload to blob storage
  const uploadResult = await uploadFile(file, `homework/${studentId}`);

  // Save to database
  const homework = await prisma.homework.create({
    data: {
      studentId,
      teacherId,
      fileUrl: uploadResult.url,
      fileName: file.name,
      fileSize: uploadResult.size,
      status: 'PENDING',
    },
  });

  return homework;
}
```

### Example 2: Profile Picture Update

```typescript
import { uploadFile, deleteFile } from '@/lib/blob-storage';
import { prisma } from '@/lib/prisma';

export async function updateProfilePicture(
  userId: string,
  file: File
) {
  // Get current user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // Delete old profile picture if exists
  if (user?.profilePictureUrl) {
    try {
      await deleteFile(user.profilePictureUrl);
    } catch (error) {
      console.error('Failed to delete old profile picture:', error);
    }
  }

  // Upload new profile picture
  const uploadResult = await uploadFile(file, `profiles/${userId}`, {
    maxSizeMB: 5, // Smaller limit for profile pictures
  });

  // Update user record
  await prisma.user.update({
    where: { id: userId },
    data: {
      profilePictureUrl: uploadResult.url,
    },
  });

  return uploadResult;
}
```

### Example 3: Teacher Shared Resources

```typescript
import { uploadFile, batchDeleteFiles } from '@/lib/blob-storage';

export async function uploadSharedResource(
  teacherId: string,
  file: File
) {
  const uploadResult = await uploadFile(file, `shared/${teacherId}`);

  return uploadResult;
}

export async function deleteOldResources(urls: string[]) {
  const results = await batchDeleteFiles(urls);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return { successful, failed, results };
}
```

### Example 4: Client-Side Upload (Next.js API Route)

```typescript
// app/api/upload/homework/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/blob-storage';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await requireAuth();

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const teacherId = formData.get('teacherId') as string;

  if (!file) {
    return NextResponse.json(
      { error: 'No file provided' },
      { status: 400 }
    );
  }

  try {
    const result = await uploadFile(file, `homework/${session.user.id}`);

    // Save to database
    const homework = await prisma.homework.create({
      data: {
        studentId: session.user.id,
        teacherId,
        fileUrl: result.url,
        fileName: file.name,
        fileSize: result.size,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, homework });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
```

### Example 5: Form Validation (React Component)

```typescript
'use client';

import { useState } from 'react';
import { validateFile, formatFileSize } from '@/lib/blob-storage';

export default function HomeworkUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error);
      setFile(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('teacherId', 'teacher_id_here');

    const response = await fetch('/api/upload/homework', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    // Handle response
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleFileChange}
      />
      {error && <p className="text-red-600">{error}</p>}
      {file && (
        <p className="text-green-600">
          Selected: {file.name} ({formatFileSize(file.size)})
        </p>
      )}
      <button type="submit" disabled={!file}>
        Upload
      </button>
    </form>
  );
}
```

---

## Error Handling

### Common Errors

#### Invalid File Type
```typescript
{
  valid: false,
  error: "Invalid file type: application/zip. Allowed types: PDF, Word documents (.doc, .docx), Images (.jpg, .jpeg, .png)"
}
```

#### File Too Large
```typescript
{
  valid: false,
  error: "File size (15.23MB) exceeds maximum allowed size of 10MB"
}
```

#### Empty File
```typescript
{
  valid: false,
  error: "File is empty (0 bytes)"
}
```

#### Upload Failure
```typescript
throw new Error("Failed to upload file: Network error");
```

### Best Practices

1. **Always validate before uploading:**
   ```typescript
   const validation = validateFile(file);
   if (!validation.valid) {
     return { error: validation.error };
   }
   ```

2. **Handle upload errors gracefully:**
   ```typescript
   try {
     await uploadFile(file, folder);
   } catch (error) {
     console.error('Upload failed:', error);
     // Show user-friendly error message
   }
   ```

3. **Clean up failed uploads:**
   ```typescript
   let uploadResult;
   try {
     uploadResult = await uploadFile(file, folder);
     // Save to database
   } catch (error) {
     // If database save fails, clean up blob
     if (uploadResult) {
       await deleteFile(uploadResult.url);
     }
     throw error;
   }
   ```

---

## TypeScript Types

### Exported Types

```typescript
// Upload result
interface UploadResult {
  url: string;
  pathname: string;
  downloadUrl: string;
  size: number;
  uploadedAt: Date;
}

// Validation result
type FileValidationResult =
  | { valid: true }
  | { valid: false; error: string };

interface FileValidationSuccess {
  valid: true;
}

interface FileValidationError {
  valid: false;
  error: string;
}
```

### Constants

```typescript
import { BLOB_CONSTANTS } from '@/lib/blob-storage';

console.log(BLOB_CONSTANTS.ALLOWED_EXTENSIONS);
// ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']

console.log(BLOB_CONSTANTS.MAX_FILE_SIZE_BYTES);
// 10485760 (10MB)

console.log(BLOB_CONSTANTS.DEFAULT_MAX_SIZE_MB);
// 10
```

---

## Security Considerations

1. **File Type Validation:**
   - Both MIME type and extension are checked
   - Prevents malicious file uploads

2. **File Size Limits:**
   - Prevents resource exhaustion
   - Configurable per upload

3. **Folder Structure:**
   - Organized by user/student ID
   - Prevents unauthorized access

4. **URL Tokens:**
   - Vercel Blob URLs include secure tokens
   - No additional authentication needed for public access

5. **Best Practices:**
   - Validate on both client and server
   - Never trust client-side validation alone
   - Log all upload/delete operations
   - Implement rate limiting for uploads

---

## Performance Tips

1. **Client-Side Validation:**
   ```typescript
   // Validate before sending to server
   const validation = validateFile(file);
   if (!validation.valid) {
     alert(validation.error);
     return; // Don't send request
   }
   ```

2. **Batch Operations:**
   ```typescript
   // Delete multiple files efficiently
   await batchDeleteFiles(urls);
   ```

3. **Caching:**
   ```typescript
   // Set longer cache for static resources
   await uploadFile(file, folder, {
     cacheControlMaxAge: 86400 // 24 hours
   });
   ```

4. **File Size Display:**
   ```typescript
   // Format file sizes for better UX
   const size = formatFileSize(file.size);
   ```

---

## Troubleshooting

### Issue: "BLOB_READ_WRITE_TOKEN not found"

**Solution:** Add token to `.env`:
```bash
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

### Issue: Upload succeeds but file not accessible

**Cause:** Token might be read-only

**Solution:** Create a new token with read/write permissions

### Issue: File type validation fails despite correct type

**Cause:** Browser may report different MIME type

**Solution:** Check `file.type` in console and add to ALLOWED_FILE_TYPES if needed

### Issue: Slow uploads

**Cause:** Large file sizes

**Solution:**
- Compress images before upload
- Reduce maximum file size limit
- Consider implementing progress indicators

---

## Related Documentation

- [Homework API Routes](../../app/api/homework/README.md)
- [File Upload Components](../../components/FileUpload.tsx)
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)

---

**Last Updated:** 2025-11-28
**Module Version:** 1.0.0
