# Homework Management API

This directory contains API routes for homework submission, review, and management.

## Overview

The homework management system allows students to submit homework to teachers, teachers to review and provide feedback, and administrators to manage all submissions. It integrates with Vercel Blob Storage for secure file uploads.

---

## Table of Contents

- [API Endpoints](#api-endpoints)
  - [Upload Homework](#post-apihomeworkupload)
  - [List Homework](#get-apihomework)
  - [Get Single Homework](#get-apihomeworkid)
  - [Review Homework](#patch-apihomeworkidreview)
  - [Delete Homework](#delete-apihomeworkid)
- [Access Control](#access-control)
- [File Handling](#file-handling)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)

---

## API Endpoints

### POST /api/homework/upload

Upload a homework submission.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (File): Homework file (required)
- `studentId` (string): Student user ID (required, CUID format)
- `teacherId` (string): Teacher user ID (required, CUID format)

**Authorization:**
- Students can only upload for themselves
- Admins can upload on behalf of students

**File Validation:**
- **Allowed types:** PDF, Word documents (.doc, .docx), Images (.jpg, .jpeg, .png)
- **Maximum size:** 10MB
- **Storage location:** `homework/[studentId]/[timestamp]-[filename]`

**Example Request:**

```bash
curl -X POST "http://localhost:3000/api/homework/upload" \
  -H "Cookie: session_token=..." \
  -F "file=@homework.pdf" \
  -F "studentId=clh1a2b3c4d5e6f7g8h9i0j1k" \
  -F "teacherId=clh2b3c4d5e6f7g8h9i0j1k2l"
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "homework": {
    "id": "clh3c4d5e6f7g8h9i0j1k2l3m",
    "studentId": "clh1a2b3c4d5e6f7g8h9i0j1k",
    "studentName": "John Doe",
    "teacherId": "clh2b3c4d5e6f7g8h9i0j1k2l",
    "teacherName": "Jane Smith",
    "fileUrl": "https://abc123.public.blob.vercel-storage.com/homework/...",
    "fileName": "homework.pdf",
    "fileSize": 245760,
    "status": "PENDING",
    "submittedAt": "2025-11-28T10:30:00.000Z",
    "updatedAt": "2025-11-28T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing file, invalid file type, file too large, invalid IDs
- `403 Forbidden`: Student trying to upload for another student, inactive account
- `404 Not Found`: Student or teacher not found
- `500 Internal Server Error`: Server error

---

### GET /api/homework

Get homework submissions with filtering and pagination.

**Authentication:** Required

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `studentId` (string, optional): Filter by student user ID
- `teacherId` (string, optional): Filter by teacher user ID
- `status` (string, optional): Filter by status (`PENDING`, `APPROVED`, `REJECTED`, `NEEDS_REVISION`)

**Access Control:**
- **Students:** See only their own homework
- **Teachers:** See homework submitted to them
- **Admins:** See all homework

**Example Request:**

```bash
# Student viewing their homework
curl "http://localhost:3000/api/homework?status=PENDING&page=1&limit=20" \
  -H "Cookie: session_token=..."

# Teacher viewing homework submitted to them
curl "http://localhost:3000/api/homework?status=PENDING" \
  -H "Cookie: session_token=..."

# Admin viewing all homework for a specific student
curl "http://localhost:3000/api/homework?studentId=clh1a2b3c4d5e6f7g8h9i0j1k" \
  -H "Cookie: session_token=..."
```

**Success Response (200 OK):**

```json
{
  "homework": [
    {
      "id": "clh3c4d5e6f7g8h9i0j1k2l3m",
      "studentId": "clh1a2b3c4d5e6f7g8h9i0j1k",
      "studentName": "John Doe",
      "studentEmail": "john.doe@example.com",
      "teacherId": "clh2b3c4d5e6f7g8h9i0j1k2l",
      "teacherName": "Jane Smith",
      "teacherEmail": "jane.smith@example.com",
      "fileUrl": "https://abc123.public.blob.vercel-storage.com/homework/...",
      "fileName": "homework.pdf",
      "fileSize": 245760,
      "status": "PENDING",
      "feedback": null,
      "submittedAt": "2025-11-28T10:30:00.000Z",
      "reviewedAt": null,
      "updatedAt": "2025-11-28T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `403 Forbidden`: Attempting to view unauthorized homework
- `500 Internal Server Error`: Server error

---

### GET /api/homework/[id]

Get a single homework submission with full details.

**Authentication:** Required

**URL Parameters:**
- `id` (string): Homework ID (CUID format)

**Authorization:**
- Students can view their own homework
- Teachers can view homework submitted to them
- Admins can view any homework

**Example Request:**

```bash
curl "http://localhost:3000/api/homework/clh3c4d5e6f7g8h9i0j1k2l3m" \
  -H "Cookie: session_token=..."
```

**Success Response (200 OK):**

```json
{
  "id": "clh3c4d5e6f7g8h9i0j1k2l3m",
  "student": {
    "id": "clh1a2b3c4d5e6f7g8h9i0j1k",
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "teacher": {
    "id": "clh2b3c4d5e6f7g8h9i0j1k2l",
    "name": "Jane Smith",
    "email": "jane.smith@example.com"
  },
  "fileUrl": "https://abc123.public.blob.vercel-storage.com/homework/...",
  "fileName": "homework.pdf",
  "fileSize": 245760,
  "status": "APPROVED",
  "feedback": "Excellent work! Keep it up.",
  "submittedAt": "2025-11-28T10:30:00.000Z",
  "reviewedAt": "2025-11-28T14:15:00.000Z",
  "updatedAt": "2025-11-28T14:15:00.000Z"
}
```

**Error Responses:**
- `403 Forbidden`: No permission to view this homework
- `404 Not Found`: Homework not found
- `500 Internal Server Error`: Server error

---

### PATCH /api/homework/[id]/review

Review a homework submission (Teachers and Admins only).

**Authentication:** Required (Teacher or Admin)

**URL Parameters:**
- `id` (string): Homework ID (CUID format)

**Request Body:**

```json
{
  "status": "APPROVED",
  "feedback": "Great job! Well-structured and thoroughly researched."
}
```

**Body Parameters:**
- `status` (string, required): Review status
  - `APPROVED` - Homework is accepted
  - `REJECTED` - Homework is rejected
  - `NEEDS_REVISION` - Homework needs to be revised and resubmitted
- `feedback` (string, optional): Teacher's feedback (max 2000 characters)

**Authorization:**
- Teachers can only review homework submitted to them
- Admins can review any homework

**Example Request:**

```bash
curl -X PATCH "http://localhost:3000/api/homework/clh3c4d5e6f7g8h9i0j1k2l3m/review" \
  -H "Cookie: session_token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "feedback": "Excellent work! Keep it up."
  }'
```

**Success Response (200 OK):**

```json
{
  "id": "clh3c4d5e6f7g8h9i0j1k2l3m",
  "student": {
    "id": "clh1a2b3c4d5e6f7g8h9i0j1k",
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "teacher": {
    "id": "clh2b3c4d5e6f7g8h9i0j1k2l",
    "name": "Jane Smith",
    "email": "jane.smith@example.com"
  },
  "fileUrl": "https://abc123.public.blob.vercel-storage.com/homework/...",
  "fileName": "homework.pdf",
  "fileSize": 245760,
  "status": "APPROVED",
  "feedback": "Excellent work! Keep it up.",
  "submittedAt": "2025-11-28T10:30:00.000Z",
  "reviewedAt": "2025-11-28T14:15:00.000Z",
  "updatedAt": "2025-11-28T14:15:00.000Z"
}
```

**Notification:**
- A notification is logged (TODO: implement email/in-app notification)

**Error Responses:**
- `400 Bad Request`: Invalid status or feedback
- `403 Forbidden`: Not a teacher/admin, or teacher reviewing homework not submitted to them
- `404 Not Found`: Homework not found
- `500 Internal Server Error`: Server error

---

### DELETE /api/homework/[id]

Delete a homework submission.

**Authentication:** Required

**URL Parameters:**
- `id` (string): Homework ID (CUID format)

**Authorization:**
- Students can delete their own **PENDING** homework only
- Admins can delete any homework

**File Handling:**
- Deletes file from Vercel Blob Storage
- Deletes database record
- Continues with database deletion even if blob deletion fails

**Example Request:**

```bash
curl -X DELETE "http://localhost:3000/api/homework/clh3c4d5e6f7g8h9i0j1k2l3m" \
  -H "Cookie: session_token=..."
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Homework deleted successfully"
}
```

**Error Responses:**
- `403 Forbidden`: Student trying to delete non-pending homework, or unauthorized user
- `404 Not Found`: Homework not found
- `500 Internal Server Error`: Server error

---

## Access Control

### Role-Based Permissions

| Action | Student | Teacher | Admin |
|--------|---------|---------|-------|
| **Upload homework** | Own only | No | Any student |
| **View homework list** | Own only | Submitted to them | All |
| **View single homework** | Own only | Submitted to them | All |
| **Review homework** | No | Submitted to them | All |
| **Delete homework** | Own (PENDING only) | No | All |

### Authorization Matrix

```typescript
// Students
- Can upload homework for themselves
- Can view their own homework
- Can delete their own PENDING homework

// Teachers
- Can view homework submitted to them
- Can review homework submitted to them
- Cannot delete homework

// Admins
- Can upload homework for any student
- Can view all homework
- Can review any homework
- Can delete any homework
```

---

## File Handling

### Supported File Types

| Type | MIME Types | Extensions |
|------|-----------|------------|
| **PDF** | `application/pdf` | `.pdf` |
| **Word** | `application/msword`<br>`application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `.doc`<br>`.docx` |
| **Images** | `image/jpeg`<br>`image/png` | `.jpg`, `.jpeg`<br>`.png` |

### File Size Limits

- **Maximum:** 10MB per file
- **Minimum:** File must not be empty (0 bytes)

### Storage Structure

```
homework/
  └── [studentId]/
      └── [timestamp]-[filename]
```

**Example:**
```
homework/clh1a2b3c4d5e6f7g8h9i0j1k/1732790400000-assignment.pdf
```

**Benefits:**
- Timestamp prevents filename conflicts
- Easy to query by student
- Automatic organization

---

## Usage Examples

### Example 1: Student Uploading Homework (React)

```typescript
'use client';

import { useState } from 'react';

export default function HomeworkUploadForm({ teacherId }: { teacherId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('studentId', 'current-student-id'); // From session
    formData.append('teacherId', teacherId);

    try {
      const response = await fetch('/api/homework/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        alert('Homework uploaded successfully!');
        setFile(null);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button type="submit" disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload Homework'}
      </button>
    </form>
  );
}
```

### Example 2: Teacher Viewing Pending Homework

```typescript
// Server Component
import { requireAuth } from '@/lib/auth';

export default async function TeacherHomeworkPage() {
  const session = await requireAuth();

  const response = await fetch(
    `http://localhost:3000/api/homework?status=PENDING&page=1&limit=20`,
    {
      headers: {
        Cookie: `session_token=${session.token}`,
      },
    }
  );

  const data = await response.json();

  return (
    <div>
      <h1>Pending Homework ({data.pagination.totalCount})</h1>
      <ul>
        {data.homework.map((hw: any) => (
          <li key={hw.id}>
            {hw.studentName} - {hw.fileName}
            <a href={hw.fileUrl} target="_blank">
              Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 3: Teacher Reviewing Homework

```typescript
async function reviewHomework(
  homeworkId: string,
  status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION',
  feedback: string
) {
  const response = await fetch(`/api/homework/${homeworkId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, feedback }),
  });

  const data = await response.json();

  if (response.ok) {
    console.log('Homework reviewed successfully');
    return data;
  } else {
    throw new Error(data.error);
  }
}

// Usage
await reviewHomework(
  'clh3c4d5e6f7g8h9i0j1k2l3m',
  'APPROVED',
  'Excellent work! Well done.'
);
```

### Example 4: Student Deleting Pending Homework

```typescript
async function deleteHomework(homeworkId: string) {
  const response = await fetch(`/api/homework/${homeworkId}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (response.ok) {
    console.log('Homework deleted successfully');
  } else {
    throw new Error(data.error);
  }
}

// Usage
await deleteHomework('clh3c4d5e6f7g8h9i0j1k2l3m');
```

### Example 5: Admin Viewing All Homework for a Student

```typescript
async function getStudentHomework(studentId: string) {
  const response = await fetch(
    `/api/homework?studentId=${studentId}&page=1&limit=50`
  );

  const data = await response.json();

  return data.homework;
}

// Usage
const homework = await getStudentHomework('clh1a2b3c4d5e6f7g8h9i0j1k');
```

---

## Error Handling

### Common Errors

#### Invalid File Type

```json
{
  "error": "Invalid file type: application/zip. Allowed types: PDF, Word documents (.doc, .docx), Images (.jpg, .jpeg, .png)"
}
```

#### File Too Large

```json
{
  "error": "File size (15.23MB) exceeds maximum allowed size of 10MB"
}
```

#### Unauthorized Upload

```json
{
  "error": "Students can only upload homework for themselves"
}
```

#### Student Cannot Delete Reviewed Homework

```json
{
  "error": "You can only delete pending homework"
}
```

#### Teacher Reviewing Wrong Homework

```json
{
  "error": "You can only review homework submitted to you"
}
```

### Best Practices

1. **Always handle file validation on client side:**
   ```typescript
   if (file.size > 10 * 1024 * 1024) {
     alert('File too large');
     return;
   }
   ```

2. **Show upload progress:**
   ```typescript
   const xhr = new XMLHttpRequest();
   xhr.upload.addEventListener('progress', (e) => {
     const percent = (e.loaded / e.total) * 100;
     setProgress(percent);
   });
   ```

3. **Handle network errors:**
   ```typescript
   try {
     await uploadHomework();
   } catch (error) {
     if (error.message.includes('network')) {
       alert('Network error. Please check your connection.');
     }
   }
   ```

---

## Database Schema

### Homework Model

```prisma
model Homework {
  id          String         @id @default(cuid())
  studentId   String
  teacherId   String
  fileUrl     String         // URL to file in Vercel Blob Storage
  fileName    String
  fileSize    Int            // Size in bytes
  status      HomeworkStatus @default(PENDING)
  feedback    String?        // Teacher's feedback
  submittedAt DateTime       @default(now())
  reviewedAt  DateTime?      // When reviewed
  updatedAt   DateTime       @updatedAt

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
  teacher Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@index([teacherId])
  @@index([status])
  @@index([submittedAt])
  @@map("homework")
}

enum HomeworkStatus {
  PENDING
  APPROVED
  REJECTED
  NEEDS_REVISION
}
```

---

## Future Enhancements

### Planned Features

1. **Email Notifications:**
   - Student receives email when homework is reviewed
   - Teacher receives email when homework is submitted

2. **In-App Notifications:**
   - Real-time notifications for homework events
   - Notification center with unread counts

3. **Version History:**
   - Track homework revisions
   - Keep history of previous submissions

4. **Bulk Operations:**
   - Batch approve/reject homework
   - Bulk download for teachers

5. **Comments:**
   - Allow threaded comments on homework
   - Student-teacher discussion

6. **Analytics:**
   - Homework submission statistics
   - Average review time
   - Student performance trends

---

## Related Documentation

- [Blob Storage Utility](../../../../lib/blob-storage/README.md)
- [Authentication](../../../../lib/auth.ts)
- [RBAC (Role-Based Access Control)](../../../../lib/rbac.ts)
- [User Management API](../users/README.md)
- [Student Management API](../students/README.md)
- [Teacher Management API](../teachers/README.md)

---

**Last Updated:** 2025-11-28
**API Version:** 1.0.0
