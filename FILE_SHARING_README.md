# File Sharing System Documentation

This module provides a comprehensive file sharing system for teachers to upload and share educational resources with students.

## Features

### Teacher Features
- 📤 Upload files (PDF, DOCX, images, videos)
- 📝 Add descriptions to files
- ✏️ Edit file descriptions
- 🗑️ Delete files
- 📊 View all uploaded files in a table
- 🖱️ Drag & drop file upload
- 📈 Upload progress tracking

### Student Features
- 📥 View and download all shared resources
- 🔍 Search by filename or description
- 👨‍🏫 Filter by teacher
- 📅 Sort by date or name
- 🎨 Grid or list view mode
- 📱 Mobile-responsive interface

## Database Schema

The file sharing system uses the `SharedFile` model in Prisma:

```prisma
model SharedFile {
  id          String   @id @default(cuid())
  teacherId   String
  fileName    String
  fileUrl     String   // URL to Vercel Blob Storage
  fileSize    Int      // File size in bytes
  description String?
  uploadedAt  DateTime @default(now())

  teacher Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### POST /api/shared-files

Upload a new file to share with students.

**Authorization:** Teacher or Admin only

**Request:** `multipart/form-data`
- `file` (File, required) - The file to upload
- `description` (string, optional) - File description

**File Constraints:**
- Max size: 50MB
- Allowed types: PDF, DOCX, JPG, JPEG, PNG, GIF, WEBP, MP4, WEBM, MOV

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "file-id",
    "fileName": "document.pdf",
    "fileUrl": "https://...",
    "fileSize": 1234567,
    "description": "Course materials",
    "uploadedAt": "2024-11-29T...",
    "teacherName": "Marie Martin",
    "teacherId": "teacher-id"
  }
}
```

### GET /api/shared-files

Get all shared files with filtering.

**Authorization:** All authenticated users

**Query Parameters:**
- `teacherId` (string, optional) - Filter by teacher user ID
- `search` (string, optional) - Search in filename and description

**Access Rules:**
- Teachers see only their own files
- Students see all files
- Admins see all files

**Response:**
```json
{
  "files": [
    {
      "id": "file-id",
      "fileName": "document.pdf",
      "fileUrl": "https://...",
      "fileSize": 1234567,
      "description": "Course materials",
      "uploadedAt": "2024-11-29T...",
      "teacherName": "Marie Martin",
      "teacherId": "teacher-id"
    }
  ]
}
```

### GET /api/shared-files/[id]

Get a single file's details.

**Authorization:** All authenticated users

**Response:**
```json
{
  "file": {
    "id": "file-id",
    "fileName": "document.pdf",
    "fileUrl": "https://...",
    "fileSize": 1234567,
    "description": "Course materials",
    "uploadedAt": "2024-11-29T...",
    "teacherName": "Marie Martin",
    "teacherId": "teacher-id"
  }
}
```

### PATCH /api/shared-files/[id]

Update a file's description.

**Authorization:** File owner (teacher) or Admin

**Request:**
```json
{
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "file": { /* updated file object */ }
}
```

### DELETE /api/shared-files/[id]

Delete a shared file.

**Authorization:** File owner (teacher) or Admin

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Note:** This also deletes the file from Vercel Blob Storage.

## Pages

### Teacher Resources Page
**Route:** `/teacher/resources`

**Features:**
- Upload new files with drag & drop
- View all uploaded files in a table
- Edit file descriptions inline
- Delete files with confirmation
- File icons based on type
- Formatted file sizes and dates

### Student Resources Page
**Route:** `/student/resources`

**Features:**
- View all shared resources
- Grid or list view toggle
- Search by filename/description
- Filter by teacher
- Sort by newest, oldest, or name
- Download files
- Mobile-responsive cards

## Components

### FileUploadForm
**Location:** `components/teacher/FileUploadForm.tsx`

Teacher component for uploading files.

**Props:**
```typescript
interface FileUploadFormProps {
  onUploadSuccess: () => void; // Callback when upload succeeds
}
```

**Features:**
- Drag & drop zone
- File validation (type and size)
- Upload progress bar
- Description textarea
- Success/error messages
- File preview with icon

**Usage:**
```tsx
import FileUploadForm from '@/components/teacher/FileUploadForm';

<FileUploadForm onUploadSuccess={refreshFiles} />
```

### SharedFilesList
**Location:** `components/teacher/SharedFilesList.tsx`

Teacher component to manage uploaded files.

**Props:**
```typescript
interface SharedFilesListProps {
  files: SharedFile[];
  onFileDeleted: () => void;   // Callback when file is deleted
  onFileUpdated: () => void;   // Callback when file is updated
}
```

**Features:**
- Table view of files
- Inline description editing
- Download, edit, delete actions
- File icons and formatted metadata
- Empty state message

**Usage:**
```tsx
import SharedFilesList from '@/components/teacher/SharedFilesList';

<SharedFilesList
  files={files}
  onFileDeleted={refreshFiles}
  onFileUpdated={refreshFiles}
/>
```

### ResourcesGallery
**Location:** `components/student/ResourcesGallery.tsx`

Student component to browse and download files.

**Props:**
```typescript
interface ResourcesGalleryProps {
  files: SharedFile[];
  teachers: Array<{ id: string; name: string }>;
}
```

**Features:**
- Grid/list view toggle
- Search filtering
- Teacher dropdown filter
- Sort options (newest, oldest, name)
- Responsive cards with file info
- Download buttons

**Usage:**
```tsx
import ResourcesGallery from '@/components/student/ResourcesGallery';

<ResourcesGallery
  files={files}
  teachers={teachers}
/>
```

## Usage Examples

### Example 1: Upload a File (Teacher)

```typescript
// In a React component
const handleUpload = async (file: File, description?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  if (description) {
    formData.append('description', description);
  }

  const response = await fetch('/api/shared-files', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (response.ok) {
    console.log('File uploaded:', data.file);
  }
};
```

### Example 2: Fetch Files (Student)

```typescript
// Fetch all shared files
const fetchFiles = async () => {
  const response = await fetch('/api/shared-files');
  const data = await response.json();
  return data.files;
};

// Filter by teacher
const fetchTeacherFiles = async (teacherId: string) => {
  const response = await fetch(`/api/shared-files?teacherId=${teacherId}`);
  const data = await response.json();
  return data.files;
};

// Search files
const searchFiles = async (query: string) => {
  const response = await fetch(`/api/shared-files?search=${encodeURIComponent(query)}`);
  const data = await response.json();
  return data.files;
};
```

### Example 3: Update File Description (Teacher)

```typescript
const updateDescription = async (fileId: string, description: string) => {
  const response = await fetch(`/api/shared-files/${fileId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });

  const data = await response.json();
  if (response.ok) {
    console.log('Description updated:', data.file);
  }
};
```

### Example 4: Delete File (Teacher/Admin)

```typescript
const deleteFile = async (fileId: string) => {
  if (!confirm('Are you sure you want to delete this file?')) {
    return;
  }

  const response = await fetch(`/api/shared-files/${fileId}`, {
    method: 'DELETE',
  });

  const data = await response.json();
  if (response.ok) {
    console.log('File deleted successfully');
  }
};
```

## File Type Support

### Documents
- **PDF** (`.pdf`) - `application/pdf`
- **Word** (`.doc`, `.docx`) - `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### Images
- **JPEG** (`.jpg`, `.jpeg`) - `image/jpeg`
- **PNG** (`.png`) - `image/png`
- **GIF** (`.gif`) - `image/gif`
- **WebP** (`.webp`) - `image/webp`

### Videos
- **MP4** (`.mp4`) - `video/mp4`
- **WebM** (`.webm`) - `video/webm`
- **QuickTime** (`.mov`) - `video/quicktime`

**Maximum file size:** 50MB

## File Storage

Files are stored in **Vercel Blob Storage** with the following configuration:

```typescript
const blob = await put(fileName, file, {
  access: 'public',
  addRandomSuffix: true,
});
```

- **Access:** Public (allows direct download links)
- **Random suffix:** Prevents filename collisions
- **Auto-deletion:** Files are deleted from blob storage when record is deleted

## Security Considerations

### Authentication & Authorization
- All endpoints require authentication
- Teachers can only manage their own files
- Admins can manage all files
- Students can only view and download (no upload/edit/delete)

### File Validation
- File type validation on client and server
- File size limit enforcement (50MB)
- Sanitized file names
- Secure blob storage URLs

### Best Practices
1. Always validate file type before upload
2. Check file size before allowing upload
3. Use HTTPS for all file downloads
4. Implement virus scanning in production
5. Set appropriate CORS headers
6. Monitor blob storage usage

## Performance Optimization

### Client-Side
- Image lazy loading for file previews
- Pagination for large file lists
- Debounced search input
- Optimistic UI updates

### Server-Side
- Indexed database queries (teacherId, uploadedAt)
- Efficient file streaming
- CDN caching for blob storage
- Query result pagination

### Blob Storage
- Use CDN for file delivery
- Set appropriate cache headers
- Compress files before upload
- Use progressive loading for large files

## Customization

### Change Maximum File Size

Edit `app/api/shared-files/route.ts`:

```typescript
const maxSize = 100 * 1024 * 1024; // 100MB
```

Also update `components/teacher/FileUploadForm.tsx`:

```typescript
const maxSize = 100 * 1024 * 1024; // 100MB
```

### Add New File Types

Edit `app/api/shared-files/route.ts`:

```typescript
const allowedTypes = [
  // ... existing types
  'application/zip', // ZIP files
  'text/plain',      // Text files
];
```

Also update the file input accept attribute in `FileUploadForm.tsx`:

```typescript
accept=".pdf,.doc,.docx,...,.zip,.txt"
```

### Change File Icons

Edit the `getFileIcon()` or `getFileStyle()` functions in components:

```typescript
const getFileIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📕'; // Custom PDF icon
  // ...
};
```

## Troubleshooting

### Upload fails with "File too large"
- Check file size is under 50MB
- Verify blob storage quota
- Check network timeout settings

### File not appearing after upload
- Verify database record was created
- Check blob storage upload succeeded
- Ensure teacher relationship exists
- Refresh the file list

### Download not working
- Verify blob URL is accessible
- Check CORS settings
- Ensure file exists in blob storage
- Verify user authentication

### Drag & drop not working
- Check browser compatibility
- Verify file type is allowed
- Ensure drag handlers are attached
- Check for JavaScript errors

## Future Enhancements

- [ ] File categorization/tagging
- [ ] Download count tracking
- [ ] File versioning
- [ ] Bulk file upload
- [ ] Shared folders/collections
- [ ] File expiration dates
- [ ] Student file upload (assignments)
- [ ] File preview (PDF, images)
- [ ] Advanced search with filters
- [ ] File sharing analytics

---

**Last Updated:** 2024-11-29
**Version:** 1.0.0
