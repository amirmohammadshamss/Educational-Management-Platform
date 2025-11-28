# Homework Management UI Components

This directory contains React components for homework submission, review, and management in the Educational Management Platform.

## Overview

The homework UI system provides a complete interface for students to upload homework, teachers to review submissions, and both roles to track homework status with feedback.

---

## Table of Contents

- [Components](#components)
  - [HomeworkCard (Shared)](#homeworkcard-shared)
  - [HomeworkUpload (Student)](#homeworkupload-student)
  - [HomeworkList (Student)](#homeworklist-student)
  - [HomeworkReviewPanel (Teacher)](#homeworkreviewpanel-teacher)
- [Features](#features)
- [Usage Examples](#usage-examples)
- [Props Reference](#props-reference)
- [Styling](#styling)

---

## Components

### HomeworkCard (Shared)

**Location:** `components/shared/HomeworkCard.tsx`

Reusable card component for displaying homework submissions with role-based actions.

**Features:**
- File icon based on file type (PDF, Word, Image)
- Color-coded status badges (Pending, Approved, Rejected, Needs Revision)
- Formatted file size and dates
- Download file link
- View feedback button
- Review button (Teacher/Admin)
- Delete button (Student for pending, Admin for all)
- Responsive design

**Props:**
```typescript
interface HomeworkCardProps {
  homework: HomeworkData;
  userRole: 'STUDENT' | 'TEACHER' | 'ADMIN';
  onDelete?: (id: string) => void;
  onReview?: (id: string) => void;
  onViewFeedback?: (homework: HomeworkData) => void;
}
```

**Status Colors:**
- `PENDING` - Blue
- `APPROVED` - Green
- `REJECTED` - Red
- `NEEDS_REVISION` - Yellow

---

### HomeworkUpload (Student)

**Location:** `components/student/HomeworkUpload.tsx`

File upload component for students to submit homework assignments.

**Features:**
- Drag & drop file upload
- Click to browse files
- Real-time file validation (type and size)
- Teacher selection dropdown
- Upload progress indicator
- Success/error notifications
- Allowed file types display
- Loading states
- Automatic form reset on success

**Props:**
```typescript
interface HomeworkUploadProps {
  studentId: string;
  teachers: TeacherOption[];
  onUploadSuccess?: (homework: any) => void;
  onUploadError?: (error: string) => void;
}
```

**Validation:**
- File types: PDF, Word (.doc, .docx), Images (.jpg, .jpeg, .png)
- Maximum size: 10MB
- Client-side validation before upload

**Upload Process:**
1. User selects file (drag & drop or click)
2. File is validated immediately
3. User selects teacher from dropdown
4. Upload button becomes active
5. XMLHttpRequest tracks upload progress
6. Success/error notification displayed

---

### HomeworkList (Student)

**Location:** `components/student/HomeworkList.tsx`

Display and manage student's submitted homework with filtering.

**Features:**
- List all student's homework submissions
- Filter by status
- Color-coded status badges
- View feedback modal
- Delete pending homework
- Download files
- Loading and error states
- Empty state with helpful message
- Responsive card layout

**Props:**
```typescript
interface HomeworkListProps {
  studentId: string;
}
```

**Feedback Modal:**
- Shows full feedback text
- Teacher name and review date
- Status badge
- Close button

**Actions:**
- Download file (all statuses)
- View feedback (if feedback exists)
- Delete (only pending homework)

---

### HomeworkReviewPanel (Teacher)

**Location:** `components/teacher/HomeworkReviewPanel.tsx`

Teacher interface for reviewing and providing feedback on homework submissions.

**Features:**
- Display homework submissions
- Filter by status (default: Pending)
- Review modal with student information
- File download/preview
- Status selection (Approved/Rejected/Needs Revision)
- Feedback textarea (max 2000 characters)
- Submit review
- View previously reviewed homework
- Refresh functionality
- Loading and error states

**Props:**
```typescript
interface HomeworkReviewPanelProps {
  teacherId: string;
}
```

**Review Modal Sections:**
1. **Student Information**
   - Name
   - Submission date
   - File size

2. **File Preview/Download**
   - Opens in new tab

3. **Review Form** (for pending homework)
   - Status selection (radio buttons)
   - Feedback textarea
   - Character count (0/2000)
   - Submit button

4. **View Mode** (for reviewed homework)
   - Shows previously submitted feedback
   - Read-only display

---

## Features

### File Type Icons

The system displays appropriate icons for different file types:
- 📄 PDF files
- 📝 Word documents
- 🖼️ Images
- 📎 Generic files

### Status Badges

Color-coded badges for homework status:

| Status | Color | Meaning |
|--------|-------|---------|
| PENDING | Blue | Awaiting teacher review |
| APPROVED | Green | Accepted by teacher |
| REJECTED | Red | Not accepted |
| NEEDS_REVISION | Yellow | Requires changes |

### Drag & Drop Upload

Students can drag files directly onto the upload zone:
- Visual feedback when dragging over
- Instant validation on drop
- Error messages for invalid files

### Progress Tracking

Real-time upload progress:
- Percentage display
- Progress bar animation
- Prevents multiple uploads

### Responsive Design

All components are responsive:
- Desktop: Full layout with sidebars
- Tablet: Adapted layout
- Mobile: Stacked layout (would need additional media queries)

---

## Usage Examples

### Example 1: Student Homework Page

```typescript
// app/(student)/homework/page.tsx
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import HomeworkUpload from '@/components/student/HomeworkUpload';
import HomeworkList from '@/components/student/HomeworkList';

export default async function StudentHomeworkPage() {
  const session = await requireAuth();

  // Fetch student's assigned teachers
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      teachers: {
        include: { user: true },
      },
    },
  });

  const teachers = student?.teachers.map((t) => ({
    id: t.userId,
    name: t.user.name,
    email: t.user.email,
  })) || [];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">My Homework</h1>

      <HomeworkUpload
        studentId={session.user.id}
        teachers={teachers}
        onUploadSuccess={() => {
          // Optionally refresh the list
          window.location.reload();
        }}
      />

      <HomeworkList studentId={session.user.id} />
    </div>
  );
}
```

### Example 2: Teacher Review Page

```typescript
// app/(teacher)/homework/review/page.tsx
import { requireAuth } from '@/lib/auth';
import HomeworkReviewPanel from '@/components/teacher/HomeworkReviewPanel';

export default async function TeacherReviewPage() {
  const session = await requireAuth();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Review Homework</h1>

      <HomeworkReviewPanel teacherId={session.user.id} />
    </div>
  );
}
```

### Example 3: Admin Homework Management

```typescript
// app/(admin)/homework/page.tsx
import { requireAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import HomeworkCard from '@/components/shared/HomeworkCard';

export default async function AdminHomeworkPage() {
  const session = await requireAuth();

  if (!isAdmin(session.user.role)) {
    return <div>Unauthorized</div>;
  }

  // Fetch all homework
  const response = await fetch('http://localhost:3000/api/homework', {
    headers: { Cookie: `session_token=${session.token}` },
  });
  const data = await response.json();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">All Homework</h1>

      <div className="space-y-4">
        {data.homework.map((hw: any) => (
          <HomeworkCard
            key={hw.id}
            homework={hw}
            userRole="ADMIN"
            onDelete={async (id) => {
              await fetch(`/api/homework/${id}`, { method: 'DELETE' });
              window.location.reload();
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### Example 4: Custom Upload Success Handler

```typescript
'use client';

import { useState } from 'react';
import HomeworkUpload from '@/components/student/HomeworkUpload';

export default function CustomUploadPage({ studentId, teachers }) {
  const [uploadedCount, setUploadedCount] = useState(0);

  return (
    <div>
      <p className="mb-4">Total Uploads: {uploadedCount}</p>

      <HomeworkUpload
        studentId={studentId}
        teachers={teachers}
        onUploadSuccess={(homework) => {
          setUploadedCount((prev) => prev + 1);
          console.log('Homework uploaded:', homework);
          // Custom logic here
        }}
        onUploadError={(error) => {
          console.error('Upload failed:', error);
          // Custom error handling
        }}
      />
    </div>
  );
}
```

---

## Props Reference

### HomeworkData Interface

```typescript
interface HomeworkData {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  status: HomeworkStatus;
  studentName: string;
  teacherName: string;
  submittedAt: string;
  reviewedAt?: string | null;
  feedback?: string | null;
}
```

### TeacherOption Interface

```typescript
interface TeacherOption {
  id: string;
  name: string;
  email: string;
}
```

### HomeworkStatus Enum

```typescript
enum HomeworkStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  NEEDS_REVISION = 'NEEDS_REVISION',
}
```

---

## Styling

### TailwindCSS Classes

All components use TailwindCSS for styling with consistent patterns:

**Color Scheme:**
- Primary: Blue (buttons, links, accents)
- Success: Green (approved, success messages)
- Error: Red (rejected, error messages)
- Warning: Yellow (needs revision)
- Neutral: Gray (borders, backgrounds)

**Common Patterns:**
- Cards: `bg-white rounded-lg shadow-md p-6`
- Buttons: `px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2`
- Inputs: `w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`
- Status badges: `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border`

### Responsive Breakpoints

- `md:` - Tablet (768px)
- `lg:` - Desktop (1024px)

### Custom Styles

Some components include custom styles for:
- Progress bars
- Modal overlays
- Drag & drop zones
- File type icons

---

## Accessibility

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Focus indicators on buttons and inputs
- Modal can be closed with ESC key (browser default)

### Screen Readers

- Semantic HTML elements (button, input, label)
- ARIA labels where needed
- Alt text for icons and images

### Color Contrast

- All text meets WCAG AA standards
- Status colors have sufficient contrast
- Disabled states are clearly indicated

---

## Error Handling

### Upload Errors

```typescript
// File too large
"File size (15.23MB) exceeds maximum allowed size of 10MB"

// Invalid file type
"Invalid file type: application/zip. Allowed types: PDF, Word documents (.doc, .docx), Images (.jpg, .jpeg, .png)"

// Network error
"Network error occurred during upload"
```

### Review Errors

```typescript
// Missing feedback
"Please provide feedback for the student"

// Server error
"Failed to submit review"
```

### Loading States

All components handle:
- Initial loading
- Data fetching
- Form submission
- Empty states

---

## Performance Considerations

### Optimization Techniques

1. **Client-Side Validation**
   - Validate files before upload
   - Prevent unnecessary API calls

2. **Progress Tracking**
   - XMLHttpRequest for native progress events
   - Prevents UI blocking

3. **Conditional Rendering**
   - Only render modals when open
   - Lazy load large lists

4. **Debouncing**
   - Filter changes (if implemented)
   - Search inputs (if implemented)

### Bundle Size

- HomeworkCard: ~7KB
- HomeworkUpload: ~10KB
- HomeworkList: ~9KB
- HomeworkReviewPanel: ~18KB

**Total:** ~44KB (uncompressed)

---

## Testing Recommendations

### Unit Tests

```typescript
// Test file validation
test('validates file type correctly', () => {
  const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
  const result = validateFile(pdfFile);
  expect(result.valid).toBe(true);
});

// Test status badge colors
test('renders correct status badge color', () => {
  const { container } = render(
    <HomeworkCard homework={mockHomework} userRole="STUDENT" />
  );
  expect(container.querySelector('.bg-blue-100')).toBeInTheDocument();
});
```

### Integration Tests

```typescript
// Test upload flow
test('uploads file successfully', async () => {
  render(<HomeworkUpload studentId="123" teachers={mockTeachers} />);

  const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
  const input = screen.getByLabelText(/select file/i);

  fireEvent.change(input, { target: { files: [file] } });

  const teacherSelect = screen.getByLabelText(/select teacher/i);
  fireEvent.change(teacherSelect, { target: { value: 'teacher-1' } });

  const submitButton = screen.getByText(/upload homework/i);
  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText(/uploaded successfully/i)).toBeInTheDocument();
  });
});
```

---

## Future Enhancements

### Planned Features

1. **File Preview**
   - In-browser PDF viewer
   - Image preview modal
   - Word document preview

2. **Batch Operations**
   - Bulk approve/reject
   - Batch download

3. **Notifications**
   - Real-time updates
   - Toast notifications
   - Email notifications

4. **Advanced Filtering**
   - Date range picker
   - Multiple status selection
   - Sort options

5. **Comments**
   - Threaded comments
   - @mentions
   - Comment notifications

6. **Version History**
   - Track revisions
   - Compare versions
   - Restore previous versions

---

## Related Documentation

- [Homework API Documentation](../../app/api/homework/README.md)
- [Blob Storage Utility](../../lib/blob-storage/README.md)
- [Authentication](../../lib/auth.ts)
- [RBAC](../../lib/rbac.ts)

---

**Last Updated:** 2025-11-28
**Component Version:** 1.0.0
