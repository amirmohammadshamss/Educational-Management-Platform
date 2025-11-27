# Educational Management Platform - Project Tasks & Prompts

**Project Name**: Educational Management Platform
**Technology Stack**: Next.js, TypeScript, Prisma, Vercel Postgres, TailwindCSS
**Deployment**: Vercel (Full Stack)

---

## Phase 1: Project Setup & Infrastructure

### Task 1.1: Initialize Next.js Project
**Priority**: Critical
**Dependencies**: None
**Estimated Time**: 30 minutes

**Prompt**:
```
Create a new Next.js 14+ project with TypeScript and TailwindCSS for an Educational Management Platform.

Requirements:
- Use App Router (not Pages Router)
- Enable TypeScript with strict mode
- Configure TailwindCSS with custom theme
- Set up the following folder structure:
  /app
    /(admin)
    /(teacher)
    /(student)
    /api
      /auth
      /bookings
      /students
      /teachers
      /homework
      /cron
  /components
    /ui
    /admin
    /teacher
    /student
    /shared
  /lib
  /prisma
  /types
  /hooks
  /utils

- Add .env.example file with placeholders for all required environment variables
- Configure next.config.js for optimal performance
- Set up .gitignore properly
```

---

### Task 1.2: Setup Prisma with Database Schema
**Priority**: Critical
**Dependencies**: Task 1.1
**Estimated Time**: 45 minutes

**Prompt**:
```
Set up Prisma ORM for the Educational Management Platform with Vercel Postgres.

Requirements:
1. Install Prisma and Prisma Client
2. Initialize Prisma with PostgreSQL provider
3. Create the complete database schema in prisma/schema.prisma with these models:
   - User (id, email, name, passwordHash, role, active, createdAt, updatedAt)
   - Role enum (SUPER_ADMIN, ADMIN, TEACHER, STUDENT)
   - Teacher (id, userId, createdAt, updatedAt)
   - Student (id, userId, governmentId, totalAllowedHours, usedHours, createdAt, updatedAt)
   - StudentTeacher (id, studentId, teacherId, assignedAt) - many-to-many
   - Booking (id, studentId, teacherId, date, duration, source, status, createdAt, updatedAt)
   - Homework (id, studentId, teacherId, fileUrl, fileName, fileSize, status, feedback, submittedAt, reviewedAt, updatedAt)
   - HomeworkStatus enum (PENDING, APPROVED, REJECTED, NEEDS_REVISION)
   - SyncLog (id, source, status, message, lastSyncTime, createdAt)

4. Set up proper relationships between models
5. Create a lib/prisma.ts file with Prisma Client singleton pattern
6. Generate Prisma Client
```

---

### Task 1.3: Configure Environment Variables
**Priority**: Critical
**Dependencies**: Task 1.2
**Estimated Time**: 15 minutes

**Prompt**:
```
Set up environment variables for the Educational Management Platform.

Create a .env.local file with these variables:
- DATABASE_URL (Vercel Postgres connection string)
- DIRECT_URL (Direct Postgres connection for migrations)
- NEXTAUTH_SECRET (random secure string)
- NEXTAUTH_URL (http://localhost:3000 for dev)
- JWT_SECRET (random secure string)
- JWT_EXPIRATION (7d)
- BOOKING_API_URL (placeholder for external booking API)
- BOOKING_API_KEY (placeholder)
- GOVERNMENT_API_URL (placeholder for French government API)
- GOVERNMENT_API_KEY (placeholder)
- BLOB_READ_WRITE_TOKEN (Vercel Blob storage token)
- CRON_SECRET (random secure string for cron job authentication)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD (email configuration)

Also update .env.example with all these variables (without values).
```

---

## Phase 2: Authentication & Authorization

### Task 2.1: Implement NextAuth.js Setup
**Priority**: Critical
**Dependencies**: Task 1.2, 1.3
**Estimated Time**: 1.5 hours

**Prompt**:
```
Implement NextAuth.js authentication for the Educational Management Platform.

Requirements:
1. Install next-auth and bcryptjs
2. Create app/api/auth/[...nextauth]/route.ts with:
   - Credentials provider for email/password login
   - Custom authorize function that checks user credentials against database
   - JWT callback to include user role in token
   - Session callback to include role in session
   - Custom pages for signin, error

3. Create lib/auth.ts with:
   - Helper function to get current user session
   - Helper function to hash passwords
   - Helper function to verify passwords
   - Type definitions for extended session

4. Add middleware.ts to protect routes based on user roles:
   - /admin/* requires ADMIN or SUPER_ADMIN role
   - /teacher/* requires TEACHER role
   - /student/* requires STUDENT role

5. Create types/next-auth.d.ts to extend NextAuth types with custom user properties
```

---

### Task 2.2: Create Login & Authentication UI
**Priority**: Critical
**Dependencies**: Task 2.1
**Estimated Time**: 2 hours

**Prompt**:
```
Create the login and authentication UI components for the Educational Management Platform.

Requirements:
1. Create app/login/page.tsx with:
   - Email and password input fields
   - Form validation using react-hook-form and zod
   - Error handling and display
   - Loading states
   - "Forgot Password" link
   - Clean, professional design with TailwindCSS

2. Create components/auth/LoginForm.tsx as reusable component

3. Create app/forgot-password/page.tsx for password recovery

4. Create components/auth/ProtectedRoute.tsx wrapper component

5. Add proper TypeScript types for all auth-related components

6. Implement client-side session management with useSession hook

7. Create components/auth/UserMenu.tsx for displaying logged-in user info and logout
```

---

### Task 2.3: Create Role-Based Access Control (RBAC) Utilities
**Priority**: Critical
**Dependencies**: Task 2.1
**Estimated Time**: 1 hour

**Prompt**:
```
Implement Role-Based Access Control utilities for the Educational Management Platform.

Requirements:
1. Create lib/rbac.ts with:
   - Function to check if user has required role
   - Function to check if user can access specific resource
   - Permission constants for each role
   - Helper functions for role comparisons

2. Create hooks/useAuth.ts with:
   - useAuth hook that returns current user and role
   - useRequireAuth hook that redirects if not authenticated
   - useRequireRole hook that redirects if user doesn't have required role

3. Create components/auth/RoleGuard.tsx component that:
   - Accepts required roles as prop
   - Shows children only if user has required role
   - Shows access denied message otherwise

4. Add comprehensive TypeScript types for all RBAC functions
```

---

## Phase 3: Database Operations & API Routes

### Task 3.1: Create User Management API Routes
**Priority**: High
**Dependencies**: Task 2.3
**Estimated Time**: 2 hours

**Prompt**:
```
Create API routes for user management in the Educational Management Platform.

Requirements:
Create the following API routes in /app/api:

1. POST /api/users - Create new user
   - Accept: name, email, password, role
   - Hash password before storing
   - Create User and corresponding Teacher/Student record
   - Return user data without password

2. GET /api/users - Get all users (Admin only)
   - Support pagination (page, limit)
   - Support filtering by role
   - Support search by name or email
   - Return users with role information

3. GET /api/users/[id] - Get single user
   - Return user with related Teacher or Student data
   - Include assigned students for teachers
   - Include assigned teachers for students

4. PATCH /api/users/[id] - Update user
   - Allow updating name, email, active status
   - Validate user has permission to update

5. DELETE /api/users/[id] - Soft delete user (set active: false)
   - Admin only
   - Also deactivate related Teacher/Student records

All routes should:
- Include proper authentication checks
- Include role-based authorization
- Return appropriate HTTP status codes
- Include error handling with descriptive messages
- Use TypeScript with proper types
```

---

### Task 3.2: Create Student Management API Routes
**Priority**: High
**Dependencies**: Task 3.1
**Estimated Time**: 2 hours

**Prompt**:
```
Create API routes for student management in the Educational Management Platform.

Requirements:
Create the following API routes in /app/api/students:

1. GET /api/students - Get all students
   - Support pagination
   - Support search by name, email, governmentId
   - Include total hours and used hours
   - Calculate remaining hours
   - Admin and Teacher access

2. GET /api/students/[id] - Get single student
   - Include user data
   - Include assigned teachers
   - Include booking history
   - Include homework submissions
   - Calculate total used hours from bookings

3. PATCH /api/students/[id] - Update student
   - Allow updating governmentId, totalAllowedHours
   - Admin only for hours modification
   - Validate data

4. POST /api/students/[id]/assign-teacher - Assign teacher to student
   - Create StudentTeacher relationship
   - Prevent duplicate assignments
   - Teacher or Admin access

5. DELETE /api/students/[id]/teachers/[teacherId] - Remove teacher assignment
   - Delete StudentTeacher relationship
   - Admin or Teacher access

6. GET /api/students/[id]/hours - Get student hours breakdown
   - Return totalAllowedHours, usedHours, remainingHours
   - Include breakdown by teacher
   - Include recent bookings

All routes should include proper authentication, authorization, validation, and error handling.
```

---

### Task 3.3: Create Teacher Management API Routes
**Priority**: High
**Dependencies**: Task 3.1
**Estimated Time**: 1.5 hours

**Prompt**:
```
Create API routes for teacher management in the Educational Management Platform.

Requirements:
Create the following API routes in /app/api/teachers:

1. GET /api/teachers - Get all teachers
   - Support pagination
   - Support search by name or email
   - Include student count for each teacher
   - Admin access

2. GET /api/teachers/[id] - Get single teacher
   - Include user data
   - Include assigned students list
   - Include booking statistics
   - Include homework review statistics

3. GET /api/teachers/[id]/students - Get teacher's assigned students
   - Return all students assigned to this teacher
   - Include student hours information
   - Include recent bookings for each student
   - Teacher can access own, Admin can access any

4. POST /api/teachers/[id]/students/[studentId] - Assign student to teacher
   - Teacher can assign students to themselves
   - Admin can assign to any teacher
   - Prevent duplicate assignments

5. GET /api/teachers/[id]/schedule - Get teacher's schedule
   - Return all bookings for the teacher
   - Support date range filtering
   - Include student information for each booking

All routes should include proper authentication, authorization, and error handling.
```

---

### Task 3.4: Create Booking Management API Routes
**Priority**: High
**Dependencies**: Task 3.2, 3.3
**Estimated Time**: 2 hours

**Prompt**:
```
Create API routes for booking management in the Educational Management Platform.

Requirements:
Create the following API routes in /app/api/bookings:

1. GET /api/bookings - Get all bookings
   - Support pagination
   - Support filtering by date range, student, teacher, status
   - Include student and teacher data
   - Admin access for all, Teacher/Student see only their own

2. GET /api/bookings/[id] - Get single booking
   - Include full student and teacher information
   - Authorization check (Admin, or involved Teacher/Student)

3. POST /api/bookings - Create manual booking
   - Accept: studentId, teacherId, date, duration
   - Validate student has enough remaining hours
   - Validate date is in the future
   - Set source as "manual"
   - Admin or Teacher can create

4. PATCH /api/bookings/[id] - Update booking
   - Allow updating date, duration, status
   - Recalculate student hours if duration changes
   - Admin only

5. DELETE /api/bookings/[id] - Delete booking
   - Soft delete by setting status to "cancelled"
   - Recalculate student used hours
   - Admin only

6. GET /api/bookings/today - Get today's bookings
   - Return all bookings for current date
   - Include student and teacher info
   - Dashboard endpoint

All routes should include proper validation, authentication, and authorization.
```

---

## Phase 4: External API Integration

### Task 4.1: Implement Booking API Integration
**Priority**: High
**Dependencies**: Task 3.4
**Estimated Time**: 2 hours

**Prompt**:
```
Create integration with external Booking API for the Educational Management Platform.

Requirements:
1. Create lib/integrations/booking-api.ts with:
   - Function to fetch all bookings from external API
   - Function to fetch bookings by date range
   - Function to fetch bookings for specific student
   - Proper error handling and retry logic
   - TypeScript types for API responses
   - Request timeout handling (30 seconds)

2. Create app/api/integrations/booking-sync/route.ts:
   - Fetch bookings from external API
   - Transform API response to match database schema
   - Upsert bookings to database (update if exists, create if new)
   - Update student usedHours based on booking duration
   - Create SyncLog entry with status and message
   - Handle errors gracefully
   - Return sync summary (total processed, new, updated, errors)

3. Add proper authentication for external API calls

4. Implement data mapping from external format to internal format

5. Add validation for incoming booking data

Note: For development, create a mock API response structure since the actual API is not available yet.
```

---

### Task 4.2: Implement Government API Integration
**Priority**: High
**Dependencies**: Task 3.2
**Estimated Time**: 2 hours

**Prompt**:
```
Create integration with French Government API for authorized training hours.

Requirements:
1. Create lib/integrations/government-api.ts with:
   - Function to fetch authorized hours for all students
   - Function to fetch hours for specific student by governmentId
   - Proper authentication with API key
   - Error handling and retry logic
   - TypeScript types for API responses
   - Handle rate limiting

2. Create app/api/integrations/government-sync/route.ts:
   - Fetch student authorized hours from government API
   - Match students by governmentId
   - Update student totalAllowedHours in database
   - Create SyncLog entry with results
   - Handle students not found in government system
   - Return sync summary

3. Add validation to ensure:
   - governmentId exists before syncing
   - Hours are positive numbers
   - Data is properly formatted

4. Implement error handling for:
   - API unavailable
   - Invalid credentials
   - Student not found
   - Data format errors

Note: Create mock API structure for development since actual API is not available.
```

---

### Task 4.3: Create Sync Logs & Monitoring
**Priority**: Medium
**Dependencies**: Task 4.1, 4.2
**Estimated Time**: 1 hour

**Prompt**:
```
Create sync logging and monitoring system for API integrations.

Requirements:
1. Create app/api/sync-logs/route.ts:
   - GET endpoint to retrieve sync logs
   - Support filtering by source (BOOKING_API, GOVERNMENT_API)
   - Support filtering by status (SUCCESS, ERROR)
   - Support date range filtering
   - Include pagination
   - Admin only access

2. Create lib/sync-logger.ts with utility functions:
   - logSyncStart(source, details)
   - logSyncSuccess(source, summary)
   - logSyncError(source, error)
   - getSyncStatus(source) - returns last sync time and status

3. Create components/admin/SyncLogsTable.tsx:
   - Display sync logs in a table
   - Show source, status, message, timestamp
   - Color code by status (green=success, red=error)
   - Add filter controls
   - Add pagination

4. Create app/api/sync-logs/latest/route.ts:
   - Return latest sync status for each source
   - Used for dashboard display
```

---

## Phase 5: Homework Management

### Task 5.1: Setup Vercel Blob Storage
**Priority**: High
**Dependencies**: Task 1.3
**Estimated Time**: 45 minutes

**Prompt**:
```
Set up Vercel Blob Storage for file uploads in the Educational Management Platform.

Requirements:
1. Install @vercel/blob package

2. Create lib/blob-storage.ts with utility functions:
   - uploadFile(file: File, folder: string) - uploads to Vercel Blob
   - deleteFile(url: string) - deletes from Vercel Blob
   - getPresignedUrl(url: string) - generates presigned URL for secure access
   - validateFileType(file: File) - checks if file type is allowed
   - validateFileSize(file: File, maxSizeMB: number) - checks file size

3. Allowed file types:
   - PDF (.pdf)
   - Word documents (.doc, .docx)
   - Images (.jpg, .jpeg, .png)

4. Maximum file size: 10MB

5. Folder structure in Blob:
   - homework/[studentId]/[timestamp]-[filename]
   - profiles/[userId]/[filename]
   - shared/[teacherId]/[filename]

6. Add proper TypeScript types for all functions

7. Include error handling for upload failures
```

---

### Task 5.2: Create Homework Upload API
**Priority**: High
**Dependencies**: Task 5.1
**Estimated Time**: 2 hours

**Prompt**:
```
Create API routes for homework submission and management.

Requirements:
Create the following API routes in /app/api/homework:

1. POST /api/homework/upload - Upload homework
   - Accept multipart/form-data with file
   - Accept studentId, teacherId in form data
   - Validate file type and size
   - Upload to Vercel Blob Storage
   - Create Homework record in database with fileUrl, fileName, fileSize
   - Set status to PENDING
   - Student can only upload for themselves
   - Return homework record with upload URL

2. GET /api/homework - Get homework submissions
   - Support filtering by studentId, teacherId, status
   - Include student and teacher information
   - Teachers see homework submitted to them
   - Students see their own homework
   - Admin sees all
   - Support pagination

3. GET /api/homework/[id] - Get single homework submission
   - Include full details
   - Include file URL for download
   - Authorization check

4. PATCH /api/homework/[id]/review - Review homework
   - Accept status (APPROVED, REJECTED, NEEDS_REVISION)
   - Accept optional feedback text
   - Set reviewedAt timestamp
   - Teacher or Admin only
   - Send notification to student

5. DELETE /api/homework/[id] - Delete homework
   - Delete file from Blob Storage
   - Delete database record
   - Student can delete own pending homework
   - Admin can delete any

All routes should include proper file handling, validation, and security checks.
```

---

### Task 5.3: Create Homework UI Components
**Priority**: High
**Dependencies**: Task 5.2
**Estimated Time**: 3 hours

**Prompt**:
```
Create UI components for homework management in the Educational Management Platform.

Requirements:
1. Create components/student/HomeworkUpload.tsx:
   - File upload dropzone with drag & drop
   - File type and size validation
   - Upload progress indicator
   - Teacher selection dropdown
   - Submit button with loading state
   - Success/error notifications
   - List of allowed file types

2. Create components/student/HomeworkList.tsx:
   - Display student's submitted homework
   - Show file name, teacher, submission date, status
   - Color-coded status badges
   - View feedback button
   - Delete option for pending homework
   - Download file link
   - Filter by status

3. Create components/teacher/HomeworkReviewPanel.tsx:
   - Display homework submissions for review
   - File preview/download
   - Student information display
   - Review form with status selection (Approve/Reject/Needs Revision)
   - Feedback text area
   - Submit review button
   - Filter by student, status, date

4. Create components/shared/HomeworkCard.tsx:
   - Reusable card component for homework display
   - Show file icon based on type
   - Display metadata (student, teacher, date, status)
   - Action buttons based on user role

All components should:
- Use TailwindCSS for styling
- Include proper TypeScript types
- Handle loading and error states
- Be responsive for desktop and tablet
```

---

## Phase 6: Admin Dashboard

### Task 6.1: Create Admin Dashboard Overview
**Priority**: High
**Dependencies**: Task 3.4, 4.3
**Estimated Time**: 3 hours

**Prompt**:
```
Create the main admin dashboard with statistics and overview.

Requirements:
1. Create app/(admin)/dashboard/page.tsx:
   - Display key metrics cards:
     * Total active students
     * Total active teachers
     * Total bookings this month
     * Completed lessons today
     * Pending homework reviews
   - Today's bookings table
   - Recent sync logs widget
   - System status indicators
   - Quick action buttons (Add User, Sync APIs, View Reports)

2. Create components/admin/MetricCard.tsx:
   - Reusable card for displaying metrics
   - Icon, title, value, trend indicator
   - Optional link to detailed view

3. Create components/admin/TodaysBookings.tsx:
   - Table showing today's bookings
   - Columns: Time, Student, Teacher, Duration, Status
   - Sort by time
   - Limit to next 10 bookings
   - "View All" link

4. Create components/admin/RecentSyncLogs.tsx:
   - Show last 5 sync attempts
   - Display source, status, time
   - Color-coded status indicators
   - "View All Logs" link

5. Create app/api/dashboard/stats/route.ts:
   - Aggregate and return dashboard statistics
   - Calculate metrics from database
   - Cache results for performance
   - Admin only access

All components should use modern, clean design with TailwindCSS and be fully responsive.
```

---

### Task 6.2: Create User Management Interface (Admin)
**Priority**: High
**Dependencies**: Task 3.1, 6.1
**Estimated Time**: 4 hours

**Prompt**:
```
Create comprehensive user management interface for administrators.

Requirements:
1. Create app/(admin)/users/page.tsx:
   - Data table with all users
   - Columns: Name, Email, Role, Status (Active/Inactive), Created Date, Actions
   - Search by name or email
   - Filter by role
   - Filter by active status
   - Sort by any column
   - Pagination (20 per page)
   - "Add New User" button
   - Bulk actions (activate/deactivate selected)

2. Create app/(admin)/users/new/page.tsx:
   - Form to create new user
   - Fields: Name, Email, Password, Confirm Password, Role
   - Conditional fields based on role:
     * If STUDENT: governmentId (optional), totalAllowedHours
     * If TEACHER: no additional fields
   - Form validation with error messages
   - Submit button with loading state
   - Cancel button

3. Create app/(admin)/users/[id]/page.tsx:
   - View/Edit user details
   - Display all user information
   - Edit mode toggle
   - Update user form
   - Activate/Deactivate button
   - Delete user button with confirmation
   - View related data (bookings, homework, etc.)
   - For students: show assigned teachers, hours breakdown
   - For teachers: show assigned students count

4. Create components/admin/UserTable.tsx:
   - Reusable data table component
   - Include sorting, filtering, pagination
   - Row actions dropdown (View, Edit, Activate/Deactivate, Delete)
   - Responsive design

5. Create components/admin/UserForm.tsx:
   - Reusable form for create/edit user
   - Form validation with react-hook-form and zod
   - Proper TypeScript types

Use shadcn/ui or similar component library for tables, forms, and dialogs.
```

---

### Task 6.3: Create Student Assignment Interface (Admin)
**Priority**: High
**Dependencies**: Task 3.2, 3.3, 6.2
**Estimated Time**: 2 hours

**Prompt**:
```
Create interface for managing student-teacher assignments.

Requirements:
1. Create app/(admin)/assignments/page.tsx:
   - Two-column layout: Students list | Teachers list
   - Drag-and-drop interface to assign students to teachers
   - Or click-based selection with "Assign" button
   - Show existing assignments with ability to remove
   - Filter students by assigned/unassigned status
   - Search students and teachers
   - Visual indicators for assignment status

2. Create components/admin/AssignmentManager.tsx:
   - Left panel: List of students with assignment count
   - Right panel: Teacher selection and their current students
   - Assignment action buttons
   - Bulk assignment capability
   - Success/error notifications

3. Create components/admin/StudentAssignmentCard.tsx:
   - Display student info
   - Show assigned teachers (with remove option)
   - "Assign New Teacher" button
   - Show student's total hours and usage

4. Create components/admin/TeacherAssignmentCard.tsx:
   - Display teacher info
   - List all assigned students
   - Student count badge
   - Add students button

5. Add API route PATCH /api/admin/assignments/bulk:
   - Accept array of student-teacher assignments
   - Create multiple StudentTeacher records
   - Return success/failure for each

Ensure smooth UX with loading states and confirmations for bulk operations.
```

---

### Task 6.4: Create Reports & Analytics Interface
**Priority**: Medium
**Dependencies**: Task 3.4, 6.1
**Estimated Time**: 4 hours

**Prompt**:
```
Create reporting and analytics interface for administrators.

Requirements:
1. Create app/(admin)/reports/page.tsx:
   - Report type selector (Bookings, Hours, Teacher Performance, Student Progress)
   - Date range picker
   - Filter options (by teacher, student, status)
   - "Generate Report" button
   - Display report results in table/charts
   - Export buttons (Excel, PDF)

2. Create components/admin/BookingsReport.tsx:
   - Table of bookings for selected period
   - Group by day/week/month options
   - Show total hours, number of sessions
   - Student and teacher breakdown
   - Visual chart (bar/line chart)

3. Create components/admin/HoursReport.tsx:
   - Student hours utilization report
   - Show: totalAllowed, used, remaining, percentage
   - Sort by different metrics
   - Identify students running low on hours
   - Export to Excel

4. Create components/admin/TeacherPerformanceReport.tsx:
   - Number of sessions per teacher
   - Total hours taught
   - Number of unique students
   - Homework review statistics
   - Average feedback response time

5. Create app/api/reports/[type]/route.ts:
   - Generate reports based on type
   - Accept date range and filters
   - Return aggregated data
   - Support export formats

6. Install and use chart library (recharts or chart.js) for visualizations

7. Implement Excel export using exceljs library

8. Implement PDF export using jsPDF library

All reports should be printable and shareable.
```

---

## Phase 7: Teacher Panel

### Task 7.1: Create Teacher Dashboard
**Priority**: High
**Dependencies**: Task 3.3, 3.4
**Estimated Time**: 2.5 hours

**Prompt**:
```
Create dashboard for teachers in the Educational Management Platform.

Requirements:
1. Create app/(teacher)/dashboard/page.tsx:
   - Welcome message with teacher name
   - Today's schedule widget (upcoming classes)
   - Assigned students count card
   - Pending homework reviews count card
   - Quick actions: View Schedule, View Students, Review Homework
   - Recent activity feed

2. Create components/teacher/TodaySchedule.tsx:
   - List of today's bookings
   - Show time, student name, duration
   - Countdown to next class
   - Mark as completed option
   - "View Full Schedule" link

3. Create components/teacher/PendingHomeworkWidget.tsx:
   - Count of pending homework submissions
   - List of recent submissions (last 5)
   - Quick review button for each
   - "View All Homework" link

4. Create components/teacher/AssignedStudentsWidget.tsx:
   - Total count of assigned students
   - List view with student names and hours remaining
   - "View All Students" link
   - Quick filters (low hours, many pending homework)

5. Create app/api/teacher/dashboard/route.ts:
   - Fetch teacher-specific dashboard data
   - Get today's bookings
   - Get pending homework count
   - Get assigned students summary
   - Teacher can only access own data

Design should be clean, professional, and easy to navigate.
```

---

### Task 7.2: Create Teacher Schedule Management
**Priority**: High
**Dependencies**: Task 7.1
**Estimated Time**: 3 hours

**Prompt**:
```
Create schedule management interface for teachers.

Requirements:
1. Create app/(teacher)/schedule/page.tsx:
   - Calendar view of all bookings
   - Month/Week/Day view toggle
   - Today button to jump to current date
   - Booking details on click
   - Filter by student
   - Color coding by status (scheduled, completed, cancelled)

2. Create components/teacher/ScheduleCalendar.tsx:
   - Interactive calendar component
   - Display bookings as events
   - Click to view booking details
   - Navigate between months/weeks
   - Highlight today's date
   - Mobile-responsive view

3. Create components/teacher/BookingDetailsModal.tsx:
   - Modal/drawer showing booking details
   - Student information
   - Date, time, duration
   - Status
   - Notes/comments section
   - Close button

4. Create components/teacher/ScheduleListView.tsx:
   - Alternative list view of bookings
   - Group by date
   - Show all booking details in rows
   - Better for mobile devices

5. Install calendar library (react-big-calendar or fullcalendar) for calendar view

6. Add date range selector to filter schedule

Teachers should be able to easily view their upcoming and past bookings.
```

---

### Task 7.3: Create Teacher Students Management
**Priority**: High
**Dependencies**: Task 3.2, 7.1
**Estimated Time**: 3 hours

**Prompt**:
```
Create student management interface for teachers.

Requirements:
1. Create app/(teacher)/students/page.tsx:
   - View all students (unassigned)
   - Assign students to teacher's list
   - View assigned students with details
   - Search and filter students
   - Student hours information
   - Recent bookings for each student

2. Create components/teacher/AllStudentsList.tsx:
   - Table/grid of all students in the system
   - Quick view of student info
   - "Assign to My List" button for each student
   - Search by name
   - Filter by hours availability
   - Show if already assigned to teacher

3. Create components/teacher/MyStudentsList.tsx:
   - List of teacher's assigned students
   - Student cards with key information:
     * Name, email
     * Total hours, used hours, remaining hours
     * Progress bar for hours usage
     * Recent booking count
     * Pending homework count
   - Click to view student details
   - Remove student from list option

4. Create app/(teacher)/students/[id]/page.tsx:
   - Detailed student view
   - All student information
   - Hours breakdown and usage chart
   - Complete booking history with this teacher
   - All homework submissions
   - Add notes about student

5. Create components/teacher/StudentHoursChart.tsx:
   - Visual representation of student's hours
   - Pie or donut chart showing used vs remaining
   - Warning if student is running low (<20% remaining)

Teachers should be able to easily track and manage their students' progress.
```

---

### Task 7.4: Create Teacher Homework Review Interface
**Priority**: High
**Dependencies**: Task 5.3, 7.1
**Estimated Time**: 2.5 hours

**Prompt**:
```
Create homework review interface for teachers.

Requirements:
1. Create app/(teacher)/homework/page.tsx:
   - Tabs: Pending Review | Reviewed | All
   - Filter by student
   - Filter by submission date
   - Sort options (newest first, oldest first)
   - Bulk review options

2. Create components/teacher/HomeworkReviewQueue.tsx:
   - List of pending homework submissions
   - Homework cards showing:
     * Student name and photo
     * Submission date
     * File name and type
     * File size
   - Quick review button
   - Mark as reviewed without feedback option
   - Batch select for bulk actions

3. Create components/teacher/HomeworkReviewModal.tsx:
   - Full-screen or large modal for reviewing homework
   - File viewer/downloader
   - Student information sidebar
   - Review form:
     * Status selector (Approve, Reject, Needs Revision)
     * Feedback text area with rich text editor
     * Grading options (optional)
   - Submit review button
   - Next/Previous homework navigation

4. Create components/teacher/ReviewedHomeworkList.tsx:
   - List of already reviewed homework
   - Show student, date reviewed, status, feedback
   - Option to edit review
   - Filter and search

5. Add notification system to alert student when homework is reviewed

6. Implement file preview for common formats (PDF, images) using react-pdf or similar

Teachers should be able to efficiently review and provide feedback on homework.
```

---

## Phase 8: Student Panel

### Task 8.1: Create Student Dashboard
**Priority**: High
**Dependencies**: Task 3.2, 3.4
**Estimated Time**: 2 hours

**Prompt**:
```
Create dashboard for students in the Educational Management Platform.

Requirements:
1. Create app/(student)/dashboard/page.tsx:
   - Welcome message with student name
   - Hours summary card (total, used, remaining)
   - Visual progress bar for hours
   - Upcoming classes widget
   - Homework status widget
   - Quick actions: View Schedule, Submit Homework, View Resources

2. Create components/student/HoursSummaryCard.tsx:
   - Large display of remaining hours
   - Total allowed hours
   - Used hours
   - Circular progress indicator
   - Warning if < 20% remaining
   - "View Details" link

3. Create components/student/UpcomingClassesWidget.tsx:
   - Next 5 upcoming bookings
   - Show date, time, teacher, duration
   - Countdown to next class
   - "View Full Schedule" link

4. Create components/student/HomeworkStatusWidget.tsx:
   - Count of pending homework submissions
   - Count of reviewed homework
   - Recent feedback highlights
   - "Submit New Homework" button
   - "View All Homework" link

5. Create app/api/student/dashboard/route.ts:
   - Fetch student-specific dashboard data
   - Get hours summary
   - Get upcoming bookings
   - Get homework statistics
   - Student can only access own data

Design should be student-friendly, clear, and motivating.
```

---

### Task 8.2: Create Student Schedule View
**Priority**: High
**Dependencies**: Task 8.1
**Estimated Time**: 2 hours

**Prompt**:
```
Create schedule viewing interface for students.

Requirements:
1. Create app/(student)/schedule/page.tsx:
   - Calendar view of student's bookings
   - Month/Week/Day view options
   - Can only view own bookings
   - Upcoming vs Past tabs
   - Booking details on click
   - Teacher information

2. Create components/student/StudentScheduleCalendar.tsx:
   - Calendar displaying student's bookings
   - Different colors for upcoming vs completed
   - Click to view details
   - Mobile-friendly design

3. Create components/student/BookingCard.tsx:
   - Card showing booking details:
     * Date and time
     * Teacher name and contact
     * Duration
     * Status
     * Location (if applicable)
   - Download/print booking confirmation

4. Create components/student/UpcomingBookingsList.tsx:
   - Simple list view of upcoming bookings
   - Sorted by date (nearest first)
   - Add to calendar button (iCal/Google Calendar)

5. Create components/student/PastBookingsList.tsx:
   - List of completed bookings
   - Show date, teacher, duration
   - Total hours calculation

Students should easily see their schedule and plan their time.
```

---

### Task 8.3: Create Student Homework Submission Interface
**Priority**: High
**Dependencies**: Task 5.3, 8.1
**Estimated Time**: 2.5 hours

**Prompt**:
```
Create homework submission and tracking interface for students.

Requirements:
1. Create app/(student)/homework/page.tsx:
   - Tabs: Submit New | Pending Review | Reviewed
   - Submit new homework section always visible
   - List of all submissions below

2. Create components/student/HomeworkSubmissionForm.tsx:
   - Teacher selection dropdown (from assigned teachers)
   - File upload with drag & drop
   - File type and size validation
   - Assignment title/description field
   - Submit button with loading state
   - Upload progress bar
   - Success confirmation message

3. Create components/student/MyHomeworkList.tsx:
   - All homework submissions by student
   - Cards/rows showing:
     * Submission date
     * Teacher name
     * File name
     * Status (Pending/Approved/Rejected/Needs Revision)
     * Feedback (if reviewed)
   - Status badges with colors
   - Download submitted file
   - View feedback button

4. Create components/student/HomeworkFeedbackModal.tsx:
   - Modal showing homework review details
   - Display teacher's feedback
   - Show review date
   - Status indicator
   - Download file button
   - Submit revision button (if status is Needs Revision)

5. Create components/student/HomeworkNotifications.tsx:
   - Bell icon with badge count
   - Dropdown showing new feedback notifications
   - Mark as read functionality

Students should find it easy to submit homework and track feedback.
```

---

### Task 8.4: Create Student Profile & Settings
**Priority**: Medium
**Dependencies**: Task 8.1
**Estimated Time**: 2 hours

**Prompt**:
```
Create profile and settings interface for students.

Requirements:
1. Create app/(student)/profile/page.tsx:
   - View/Edit profile information
   - Profile photo upload
   - Personal information (name, email, government ID)
   - Hours information (read-only)
   - Assigned teachers list (read-only)
   - Account statistics (total bookings, homework submitted)

2. Create components/student/ProfileForm.tsx:
   - Editable fields: name
   - Read-only fields: email, role, governmentId, hours
   - Profile photo upload/change
   - Save changes button
   - Cancel button

3. Create app/(student)/settings/page.tsx:
   - Change password form
   - Email notification preferences
   - Language preference (French/English)
   - Time zone setting
   - Save settings button

4. Create components/student/ChangePasswordForm.tsx:
   - Current password field
   - New password field
   - Confirm new password field
   - Password strength indicator
   - Form validation
   - Submit button

5. Create components/student/NotificationSettings.tsx:
   - Toggle switches for different notification types:
     * Email on homework review
     * Email for upcoming classes (24h before)
     * Email for new shared files
   - Save preferences

6. Create app/api/student/profile/route.ts:
   - PATCH endpoint to update profile
   - Validation for allowed fields
   - Student can only update own profile

7. Create app/api/student/change-password/route.ts:
   - POST endpoint to change password
   - Verify current password
   - Hash and save new password

Students should be able to manage their profile and account settings.
```

---

## Phase 9: Cron Jobs & Automation

### Task 9.1: Create Booking API Sync Cron Job
**Priority**: Critical
**Dependencies**: Task 4.1
**Estimated Time**: 1.5 hours

**Prompt**:
```
Implement automated daily synchronization with the Booking API using Vercel Cron.

Requirements:
1. Create app/api/cron/sync-bookings/route.ts:
   - GET endpoint for cron execution
   - Verify request is from Vercel Cron using CRON_SECRET
   - Call booking API integration function
   - Process and store all bookings
   - Update student used hours
   - Create sync log entry
   - Handle errors gracefully
   - Return sync summary

2. Create vercel.json in project root:
   - Add cron job configuration:
     * Path: /api/cron/sync-bookings
     * Schedule: "0 2 * * *" (daily at 2 AM UTC)

3. Add authentication check:
   - Verify Authorization header matches CRON_SECRET
   - Return 401 if unauthorized

4. Implement idempotency:
   - Use booking ID to prevent duplicate entries
   - Update existing bookings if they exist
   - Only create new if booking doesn't exist

5. Add comprehensive error handling:
   - Try-catch for API calls
   - Detailed error logging
   - Continue processing on individual booking errors
   - Return summary of success/failure

6. Add alerting:
   - Log critical errors
   - Send email notification if sync fails (optional)

Test locally by calling the endpoint manually with correct authorization.
```

---

### Task 9.2: Create Government API Sync Cron Job
**Priority**: Critical
**Dependencies**: Task 4.2
**Estimated Time**: 1.5 hours

**Prompt**:
```
Implement automated daily synchronization with the Government API using Vercel Cron.

Requirements:
1. Create app/api/cron/sync-government-hours/route.ts:
   - GET endpoint for cron execution
   - Verify CRON_SECRET authorization
   - Fetch student hours from government API
   - Update student totalAllowedHours in database
   - Match by governmentId
   - Create sync log entry
   - Handle students not found
   - Return sync summary

2. Update vercel.json:
   - Add cron job configuration:
     * Path: /api/cron/sync-government-hours
     * Schedule: "0 3 * * *" (daily at 3 AM UTC, after booking sync)

3. Implement logic:
   - Fetch all students with governmentId from database
   - For each student, fetch authorized hours from API
   - Update totalAllowedHours if different
   - Track changes in sync log
   - Handle API rate limiting

4. Error handling:
   - Continue processing other students if one fails
   - Log which students failed to sync
   - Return detailed summary

5. Validation:
   - Ensure hours are positive numbers
   - Check for reasonable values (e.g., max 10000 hours)
   - Log anomalies

6. Add dry-run mode for testing:
   - Query parameter ?dryRun=true
   - Show what would be updated without committing

Test the endpoint manually before deploying to production.
```

---

### Task 9.3: Create Hours Calculation Cron Job
**Priority**: High
**Dependencies**: Task 9.1, 9.2
**Estimated Time**: 1 hour

**Prompt**:
```
Create automated calculation of student used hours based on bookings.

Requirements:
1. Create app/api/cron/calculate-hours/route.ts:
   - GET endpoint for cron execution
   - Verify CRON_SECRET authorization
   - For each student:
     * Sum all booking durations with status 'completed'
     * Update student usedHours field
     * Calculate remainingHours (totalAllowed - used)
   - Create sync log entry
   - Return calculation summary

2. Update vercel.json:
   - Add cron job configuration:
     * Path: /api/cron/calculate-hours
     * Schedule: "0 4 * * *" (daily at 4 AM UTC, after both syncs)

3. Implement efficient calculation:
   - Use database aggregation (Prisma groupBy or raw SQL)
   - Batch update students
   - Handle students with no bookings

4. Add warnings:
   - Identify students with < 20% hours remaining
   - Log students who exceeded their hours
   - Optional: send notifications

5. Create app/api/cron/trigger-all/route.ts:
   - Manual trigger for all cron jobs in sequence
   - Admin only access
   - Used for testing and on-demand syncs
   - Return combined summary

6. Add monitoring:
   - Track execution time
   - Log number of students processed
   - Alert if execution takes too long

This ensures student hours are always accurate and up-to-date.
```

---

## Phase 10: Notifications & Email

### Task 10.1: Setup Email Service
**Priority**: Medium
**Dependencies**: Task 1.3
**Estimated Time**: 1 hour

**Prompt**:
```
Set up email service for the Educational Management Platform.

Requirements:
1. Install nodemailer package

2. Create lib/email/mailer.ts:
   - Configure nodemailer with SMTP settings
   - Create sendEmail function with parameters:
     * to: string (email address)
     * subject: string
     * html: string (HTML content)
     * text: string (plain text alternative)
   - Add error handling and retry logic
   - Add email queue for rate limiting (optional)

3. Create lib/email/templates.ts with email templates:
   - welcomeEmail(userName, userRole)
   - passwordResetEmail(userName, resetLink)
   - homeworkReviewedEmail(studentName, teacherName, status, feedback)
   - classReminderEmail(studentName, teacherName, date, time)
   - lowHoursWarningEmail(studentName, remainingHours)
   - assignmentNotificationEmail(studentName, teacherName)

4. Each template should:
   - Have proper HTML structure
   - Include platform branding
   - Be mobile-responsive
   - Have clear call-to-action buttons
   - Include plain text version

5. Create lib/email/send-notification.ts:
   - Wrapper function for different notification types
   - Check user notification preferences before sending
   - Log all sent emails

6. Add TypeScript types for all email functions

For development, consider using a service like Mailtrap or Ethereal for testing.
```

---

### Task 10.2: Implement Notification System
**Priority**: Medium
**Dependencies**: Task 10.1
**Estimated Time**: 2 hours

**Prompt**:
```
Create in-app notification system for the Educational Management Platform.

Requirements:
1. Create Prisma model for Notification:
   - id, userId, type, title, message, isRead, link, createdAt
   - Add to schema.prisma and run migration

2. Create app/api/notifications/route.ts:
   - GET: Fetch user's notifications
   - Support pagination
   - Filter by read/unread
   - Sort by date (newest first)

3. Create app/api/notifications/[id]/read/route.ts:
   - PATCH: Mark notification as read
   - User can only mark own notifications

4. Create app/api/notifications/mark-all-read/route.ts:
   - PATCH: Mark all user's notifications as read

5. Create lib/notifications/create-notification.ts:
   - Function to create notifications in database
   - Types: HOMEWORK_REVIEWED, CLASS_REMINDER, LOW_HOURS, ASSIGNMENT, SYSTEM
   - Also send email if user preferences allow

6. Create components/shared/NotificationBell.tsx:
   - Bell icon with unread count badge
   - Dropdown showing recent notifications
   - Mark as read on click
   - "View All" link
   - Real-time updates using polling or websockets

7. Create app/(dashboard)/notifications/page.tsx:
   - Full notifications page
   - List all notifications
   - Filter by type and read status
   - Mark all as read button
   - Delete notification option

8. Trigger notifications for:
   - Homework reviewed by teacher → notify student
   - Homework submitted by student → notify teacher
   - Class in 24 hours → notify student
   - Hours < 20% remaining → notify student and admin
   - New student assigned → notify teacher

Notifications improve user engagement and keep everyone informed.
```

---

## Phase 11: Shared Resources & File Management

### Task 11.1: Create File Sharing System
**Priority**: Medium
**Dependencies**: Task 5.1
**Estimated Time**: 2.5 hours

**Prompt**:
```
Create file sharing system for teachers to share resources with students.

Requirements:
1. Create Prisma model for SharedFile:
   - id, teacherId, fileName, fileUrl, fileSize, description, uploadedAt
   - Add to schema.prisma and run migration

2. Create app/api/shared-files/route.ts:
   - POST: Teacher uploads file to share
   - GET: Get all shared files (teachers see own, students see all)
   - Support filtering by teacher
   - Support search by filename

3. Create app/api/shared-files/[id]/route.ts:
   - GET: Get single file details
   - DELETE: Teacher deletes own file, Admin deletes any

4. Create app/(teacher)/resources/page.tsx:
   - Teacher interface to upload and manage shared files
   - Upload form with file and description
   - List of teacher's uploaded files
   - Edit description
   - Delete file option
   - Download count (optional)

5. Create components/teacher/FileUploadForm.tsx:
   - File upload with drag & drop
   - Description text area
   - File type validation (PDF, DOCX, images, videos)
   - Max 50MB file size
   - Upload progress
   - Success confirmation

6. Create components/teacher/SharedFilesList.tsx:
   - Table of teacher's shared files
   - Columns: File Name, Description, Upload Date, Size, Actions
   - Download, Edit, Delete actions

7. Create app/(student)/resources/page.tsx:
   - Student interface to view and download shared resources
   - Grid or list view of all shared files
   - Filter by teacher
   - Search by filename or description
   - Download button

8. Create components/student/ResourcesGallery.tsx:
   - Card-based display of shared resources
   - File icon based on type
   - Teacher name
   - Description preview
   - Download button
   - Sort options (newest, oldest, name)

This enables teachers to share study materials and resources with students.
```

---

## Phase 12: Testing & Quality Assurance

### Task 12.1: Write Unit Tests
**Priority**: High
**Dependencies**: All previous tasks
**Estimated Time**: 4 hours

**Prompt**:
```
Write unit tests for critical functions in the Educational Management Platform.

Requirements:
1. Install testing libraries:
   - Jest
   - React Testing Library
   - @testing-library/jest-dom
   - ts-jest

2. Configure Jest:
   - Create jest.config.js
   - Set up test environment
   - Configure module aliases
   - Set up test database

3. Write tests for lib/ functions:
   - lib/auth.ts: Test password hashing, verification
   - lib/rbac.ts: Test role checking functions
   - lib/blob-storage.ts: Test file validation functions
   - lib/email/templates.ts: Test email template generation
   - lib/sync-logger.ts: Test logging functions

4. Write tests for API routes (using MSW for mocking):
   - /api/users: Test CRUD operations
   - /api/students: Test student management
   - /api/teachers: Test teacher management
   - /api/bookings: Test booking operations
   - /api/homework: Test homework upload and review

5. Write tests for components:
   - components/auth/LoginForm.tsx
   - components/admin/UserForm.tsx
   - components/teacher/HomeworkReviewModal.tsx
   - components/student/HomeworkSubmissionForm.tsx

6. Test coverage goals:
   - Utilities: 90%+
   - API routes: 80%+
   - Components: 70%+

7. Create test utilities in __tests__/utils/:
   - Mock data generators
   - Test helpers
   - Database seeders

8. Add npm scripts:
   - "test": Run all tests
   - "test:watch": Watch mode
   - "test:coverage": Generate coverage report

Focus on testing business logic and critical user flows.
```

---

### Task 12.2: Write Integration Tests
**Priority**: Medium
**Dependencies**: Task 12.1
**Estimated Time**: 3 hours

**Prompt**:
```
Write integration tests for key user flows in the Educational Management Platform.

Requirements:
1. Install Playwright or Cypress for E2E testing

2. Set up test environment:
   - Configure test database
   - Create seed data script
   - Set up test user accounts

3. Write integration tests for:

   A. Authentication Flow:
   - User login with valid credentials
   - User login with invalid credentials
   - Password reset flow
   - Session persistence
   - Logout

   B. Admin Workflows:
   - Create new user (student, teacher, admin)
   - Edit user information
   - Assign student to teacher
   - View dashboard statistics
   - Generate reports
   - Trigger manual sync

   C. Teacher Workflows:
   - View assigned students
   - Assign new student to list
   - View schedule
   - Review homework submission
   - Upload shared resource

   D. Student Workflows:
   - View dashboard and hours
   - View schedule
   - Submit homework
   - View homework feedback
   - Download shared resources

4. Test data consistency:
   - After creating booking, verify student hours updated
   - After homework review, verify student receives notification
   - After sync, verify data is correctly updated

5. Test error handling:
   - Invalid form submissions
   - Unauthorized access attempts
   - File upload errors
   - API failures

6. Add npm scripts:
   - "test:e2e": Run E2E tests
   - "test:e2e:ui": Run tests in UI mode

Integration tests ensure the entire system works together correctly.
```

---

### Task 12.3: Implement Error Handling & Logging
**Priority**: High
**Dependencies**: All previous tasks
**Estimated Time**: 2 hours

**Prompt**:
```
Implement comprehensive error handling and logging throughout the application.

Requirements:
1. Install logging library (winston or pino)

2. Create lib/logger.ts:
   - Configure logger with different levels (error, warn, info, debug)
   - Different transports for development vs production
   - File logging for production
   - Console logging for development
   - Structured logging with context

3. Create lib/error-handler.ts:
   - Custom error classes:
     * ValidationError
     * AuthenticationError
     * AuthorizationError
     * NotFoundError
     * DatabaseError
     * ExternalAPIError
   - Error formatting function
   - Error response builder for API routes

4. Create middleware/error-middleware.ts:
   - Global error handler for API routes
   - Log all errors
   - Return appropriate status codes and messages
   - Hide sensitive info in production

5. Update all API routes:
   - Wrap logic in try-catch blocks
   - Use custom error classes
   - Log errors with context
   - Return user-friendly error messages

6. Create components/shared/ErrorBoundary.tsx:
   - React Error Boundary component
   - Catch and display UI errors gracefully
   - Log errors to logging service
   - Show user-friendly error message
   - Provide reload/retry option

7. Wrap main app in ErrorBoundary:
   - Update app/layout.tsx

8. Create app/error.tsx and app/global-error.tsx:
   - Next.js error pages
   - User-friendly error display
   - Option to go back or go home

9. Add error tracking service (optional):
   - Sentry integration
   - Capture and track errors in production
   - Alert on critical errors

10. Create lib/api-response.ts:
    - Standardized API response format
    - Success response helper
    - Error response helper

Proper error handling improves user experience and makes debugging easier.
```

---

## Phase 13: Performance Optimization

### Task 13.1: Implement Caching Strategy
**Priority**: Medium
**Dependencies**: All Phase 3 tasks
**Estimated Time**: 2 hours

**Prompt**:
```
Implement caching strategy to improve application performance.

Requirements:
1. Install @vercel/kv for Redis-compatible caching (optional but recommended)

2. Create lib/cache.ts:
   - Functions for get, set, delete from cache
   - TTL (time-to-live) configuration
   - Cache key generation utilities
   - Fallback to in-memory cache if KV not available

3. Implement caching for:
   - Dashboard statistics (TTL: 5 minutes)
   - User sessions (TTL: 24 hours)
   - Student hours calculations (TTL: 1 hour)
   - Sync logs latest status (TTL: 10 minutes)
   - Teacher's assigned students list (TTL: 30 minutes)

4. Add cache invalidation:
   - When user is updated, invalidate user cache
   - When booking is created, invalidate student hours cache
   - When homework is reviewed, invalidate student homework cache
   - When sync runs, invalidate sync logs cache

5. Implement React Query for client-side caching:
   - Install @tanstack/react-query
   - Create lib/react-query.ts with QueryClient configuration
   - Wrap app in QueryClientProvider
   - Set stale times and cache times
   - Enable refetch on window focus

6. Update API route handlers to use cache:
   - Check cache before database query
   - Return cached data if available and fresh
   - Update cache after mutations

7. Add cache warming for frequently accessed data:
   - Pre-populate cache for dashboard on sync completion

8. Add cache headers for static assets:
   - Configure next.config.js for optimal caching

This will significantly reduce database load and improve response times.
```

---

### Task 13.2: Optimize Database Queries
**Priority**: High
**Dependencies**: All database-related tasks
**Estimated Time**: 2 hours

**Prompt**:
```
Optimize database queries for better performance.

Requirements:
1. Add database indexes in schema.prisma:
   - User: email, role, active
   - Student: governmentId, userId
   - Teacher: userId
   - Booking: studentId, teacherId, date, status
   - Homework: studentId, teacherId, status
   - SyncLog: source, status, createdAt
   - StudentTeacher: studentId, teacherId

2. Run migration to create indexes

3. Optimize queries using Prisma:
   - Use select to fetch only needed fields
   - Use include carefully to avoid over-fetching
   - Implement pagination for all list queries
   - Use cursor-based pagination for large datasets

4. Replace N+1 queries with batch queries:
   - When fetching students with teachers, use include
   - When fetching bookings with student and teacher data, use include
   - Batch homework queries when loading lists

5. Create database views for complex queries (using raw SQL):
   - Student hours summary view
   - Teacher performance metrics view
   - Booking statistics view

6. Implement query result pagination:
   - Default page size: 20
   - Max page size: 100
   - Return total count for pagination UI

7. Add database query logging in development:
   - Enable Prisma query logging
   - Monitor slow queries (> 100ms)
   - Optimize identified slow queries

8. Use transactions for multi-step operations:
   - Creating user with teacher/student record
   - Booking creation with hours update
   - Bulk student-teacher assignments

9. Consider read replicas for reporting queries (future optimization)

Optimized queries will make the application fast and scalable.
```

---

### Task 13.3: Implement Code Splitting & Lazy Loading
**Priority**: Medium
**Dependencies**: All component tasks
**Estimated Time**: 1.5 hours

**Prompt**:
```
Implement code splitting and lazy loading to improve initial page load time.

Requirements:
1. Use Next.js dynamic imports for large components:
   - Calendar components
   - Chart components
   - File upload components
   - Rich text editors
   - PDF viewers

2. Create loading components for lazy-loaded modules:
   - components/shared/LoadingSpinner.tsx
   - components/shared/SkeletonLoader.tsx
   - components/shared/ComponentLoader.tsx

3. Implement lazy loading for routes:
   - Use loading.tsx files in app router
   - Create skeleton UIs for each route
   - Show loading states during navigation

4. Optimize images:
   - Use Next.js Image component everywhere
   - Set appropriate sizes and quality
   - Use modern formats (WebP)
   - Implement lazy loading for images

5. Split vendor code:
   - Configure next.config.js to split large dependencies
   - Separate chart libraries
   - Separate date libraries

6. Preload critical resources:
   - Fonts
   - Critical CSS
   - Above-the-fold images

7. Implement route prefetching:
   - Use Next.js Link component with prefetch
   - Prefetch on hover for improved perceived performance

8. Optimize bundle size:
   - Use tree-shaking
   - Remove unused dependencies
   - Use lighter alternatives where possible
   - Analyze bundle with @next/bundle-analyzer

9. Create loading states for async operations:
   - Button loading states
   - Form submission loading
   - Data fetching loading
   - File upload progress

This will make the application feel fast and responsive.
```

---

## Phase 14: Security Hardening

### Task 14.1: Implement Security Best Practices
**Priority**: Critical
**Dependencies**: All previous tasks
**Estimated Time**: 2.5 hours

**Prompt**:
```
Implement security best practices throughout the Educational Management Platform.

Requirements:
1. Input validation and sanitization:
   - Install zod for schema validation
   - Create validation schemas for all API inputs
   - Sanitize user inputs to prevent XSS
   - Validate file uploads (type, size, content)

2. Implement rate limiting:
   - Install rate-limit library
   - Create lib/rate-limit.ts
   - Apply rate limiting to:
     * Login endpoint (5 attempts per 15 min)
     * Password reset (3 attempts per hour)
     * File upload (10 per hour)
     * API endpoints (100 per minute)

3. Add CSRF protection:
   - Use Next.js built-in CSRF tokens
   - Validate tokens on state-changing requests

4. Implement Content Security Policy:
   - Configure CSP headers in next.config.js
   - Allow only trusted sources
   - Block inline scripts except trusted ones

5. Secure headers:
   - Add security headers middleware:
     * X-Frame-Options: DENY
     * X-Content-Type-Options: nosniff
     * Referrer-Policy: strict-origin-when-cross-origin
     * Permissions-Policy

6. SQL Injection prevention:
   - Use Prisma parameterized queries (already done)
   - Avoid raw SQL where possible
   - Validate and sanitize raw SQL inputs

7. File upload security:
   - Validate file types using file signatures, not just extensions
   - Scan files for malware (using ClamAV or similar)
   - Store files with random names
   - Serve files from separate domain (Vercel Blob does this)

8. Authentication security:
   - Enforce strong password policy:
     * Minimum 8 characters
     * Require uppercase, lowercase, number, special char
   - Implement password strength meter
   - Add account lockout after failed attempts
   - Use secure password hashing (bcrypt with salt)

9. Session security:
   - Use secure, httpOnly cookies
   - Implement session timeout (24 hours)
   - Regenerate session on login
   - Clear session on logout

10. API security:
    - Validate JWT tokens on every request
    - Check token expiration
    - Implement refresh tokens
    - Use HTTPS only (Vercel handles this)

11. Create security.ts utility:
    - Input sanitization functions
    - Password validation
    - File validation
    - Security logging

12. Add security logging:
    - Log failed login attempts
    - Log unauthorized access attempts
    - Log suspicious activities
    - Alert admins on security events

Security is critical for protecting user data and maintaining trust.
```

---

### Task 14.2: Implement Data Privacy & GDPR Compliance
**Priority**: High
**Dependencies**: Task 14.1
**Estimated Time**: 2 hours

**Prompt**:
```
Implement data privacy features and GDPR compliance for the Educational Management Platform.

Requirements:
1. Create privacy policy and terms of service:
   - Add privacy policy page
   - Add terms of service page
   - Require acceptance on first login

2. Implement data access request:
   - Create app/api/gdpr/data-export/route.ts
   - Allow users to download all their data
   - Export in JSON format
   - Include all user data (profile, bookings, homework, etc.)

3. Implement right to be forgotten:
   - Create app/api/gdpr/delete-account/route.ts
   - Anonymize user data instead of hard delete
   - Keep records for legal/audit purposes
   - Remove personally identifiable information

4. Data minimization:
   - Only collect necessary data
   - Review all form fields
   - Remove optional fields that aren't used

5. Consent management:
   - Add cookie consent banner
   - Store consent preferences
   - Allow users to change preferences
   - Don't use non-essential cookies without consent

6. Create Prisma model for ConsentLog:
   - Track user consent for different purposes
   - Store consent timestamp
   - Allow withdrawal of consent

7. Data encryption:
   - Ensure sensitive data is encrypted at rest (Vercel Postgres handles this)
   - Use HTTPS for all connections (Vercel handles this)
   - Encrypt backup files

8. Access logging:
   - Log who accessed what data and when
   - Create audit trail for sensitive operations
   - Retain logs for compliance period

9. Create settings page for privacy:
   - app/(dashboard)/privacy-settings/page.tsx
   - Allow users to:
     * View data being collected
     * Export their data
     * Delete their account
     * Manage consent preferences

10. Add data retention policy:
    - Delete old sync logs after 90 days
    - Archive old bookings after 2 years
    - Define retention for each data type

11. Create privacy documentation:
    - Document what data is collected
    - Document why it's collected
    - Document how long it's retained
    - Document who has access

GDPR compliance is essential for operating in the EU, especially France.
```

---

## Phase 15: Deployment & DevOps

### Task 15.1: Setup Vercel Deployment
**Priority**: Critical
**Dependencies**: All previous tasks
**Estimated Time**: 1.5 hours

**Prompt**:
```
Set up deployment pipeline with Vercel for the Educational Management Platform.

Requirements:
1. Initialize Git repository:
   - git init
   - Create .gitignore (exclude node_modules, .env*, .next, etc.)
   - Make initial commit

2. Create GitHub repository:
   - Push code to GitHub
   - Set up main branch as default
   - Create development branch

3. Connect to Vercel:
   - Sign up/login to Vercel
   - Import project from GitHub
   - Configure project settings

4. Setup Vercel Postgres:
   - Create Postgres database in Vercel dashboard
   - Copy DATABASE_URL and DIRECT_URL
   - Add to Vercel environment variables

5. Setup Vercel Blob Storage:
   - Enable Blob storage in Vercel dashboard
   - Copy BLOB_READ_WRITE_TOKEN
   - Add to Vercel environment variables

6. Configure environment variables in Vercel:
   - Add all required variables for production
   - Set different values for preview/production
   - Use Vercel secrets for sensitive values

7. Configure build settings:
   - Build command: npm run build
   - Output directory: .next
   - Install command: npm install
   - Node version: 20.x

8. Setup database migrations:
   - Add postinstall script to run Prisma generate
   - Add build script to run migrations
   - Create migration workflow

9. Configure vercel.json:
   - Add cron jobs configuration
   - Add redirect rules if needed
   - Configure headers

10. Deploy to preview:
    - Push to development branch
    - Verify preview deployment works
    - Test all features

11. Deploy to production:
    - Merge to main branch
    - Verify production deployment
    - Test critical user flows

12. Setup custom domain (optional):
    - Add domain in Vercel dashboard
    - Configure DNS
    - Enable automatic HTTPS

13. Create deployment documentation:
    - Document deployment process
    - Document environment variables
    - Document rollback procedure
```

---

### Task 15.2: Setup CI/CD Pipeline
**Priority**: Medium
**Dependencies**: Task 15.1, 12.1, 12.2
**Estimated Time**: 2 hours

**Prompt**:
```
Set up CI/CD pipeline with GitHub Actions for automated testing and deployment.

Requirements:
1. Create .github/workflows/ci.yml:
   - Run on pull requests
   - Checkout code
   - Setup Node.js
   - Install dependencies
   - Run linting (ESLint)
   - Run type checking (TypeScript)
   - Run unit tests
   - Run build
   - Upload coverage reports

2. Create .github/workflows/test.yml:
   - Run integration tests
   - Setup test database
   - Seed test data
   - Run E2E tests
   - Report results

3. Create .github/workflows/deploy-preview.yml:
   - Run on push to development branch
   - Run tests
   - Deploy to Vercel preview
   - Comment deployment URL on PR

4. Create .github/workflows/deploy-production.yml:
   - Run on push to main branch
   - Run full test suite
   - Deploy to Vercel production
   - Run smoke tests on production
   - Notify team of deployment

5. Setup branch protection rules:
   - Require PR reviews before merging to main
   - Require CI checks to pass
   - Prevent direct pushes to main

6. Setup code quality checks:
   - Install ESLint and Prettier
   - Create .eslintrc.json configuration
   - Create .prettierrc configuration
   - Add pre-commit hooks with husky

7. Create lint-staged configuration:
   - Run ESLint on staged JS/TS files
   - Run Prettier on staged files
   - Run type checking

8. Add npm scripts:
   - "lint": Run ESLint
   - "format": Run Prettier
   - "type-check": Run TypeScript compiler
   - "validate": Run lint, format, type-check, and test

9. Setup code coverage reporting:
   - Use Codecov or Coveralls
   - Upload coverage on CI runs
   - Add coverage badge to README

10. Create deployment checklist:
    - Pre-deployment tests
    - Database backup
    - Deployment steps
    - Post-deployment verification
    - Rollback procedure

Automated CI/CD ensures code quality and smooth deployments.
```

---

### Task 15.3: Setup Monitoring & Analytics
**Priority**: Medium
**Dependencies**: Task 15.1
**Estimated Time**: 1.5 hours

**Prompt**:
```
Set up monitoring and analytics for the Educational Management Platform.

Requirements:
1. Enable Vercel Analytics:
   - Install @vercel/analytics
   - Add Analytics component to app/layout.tsx
   - Track page views and performance metrics

2. Enable Vercel Speed Insights:
   - Install @vercel/speed-insights
   - Add SpeedInsights component to app/layout.tsx
   - Monitor Core Web Vitals

3. Setup error tracking with Sentry:
   - Create Sentry account and project
   - Install @sentry/nextjs
   - Run Sentry wizard: npx @sentry/wizard -i nextjs
   - Configure sentry.client.config.ts
   - Configure sentry.server.config.ts
   - Test error reporting

4. Setup application monitoring:
   - Create health check endpoint: app/api/health/route.ts
   - Return status of database, external APIs, storage
   - Use for uptime monitoring

5. Setup uptime monitoring:
   - Use UptimeRobot or similar service
   - Monitor /api/health every 5 minutes
   - Alert on downtime via email/SMS

6. Create admin monitoring dashboard:
   - app/(admin)/monitoring/page.tsx
   - Display key metrics:
     * API response times
     * Error rates
     * Active users
     * Database performance
     * Cron job status
   - Real-time or near real-time updates

7. Setup custom analytics events:
   - Track important user actions:
     * User registration
     * Homework submission
     * Booking creation
     * File downloads
   - Use Vercel Analytics or custom solution

8. Create app/api/metrics/route.ts:
   - Return application metrics
   - Protected endpoint (admin only)
   - Metrics:
     * Total users by role
     * Active users (logged in last 7 days)
     * Bookings this month
     * Homework submissions this month
     * API sync success rate

9. Setup performance monitoring:
   - Monitor API endpoint response times
   - Set up alerts for slow endpoints (> 1s)
   - Monitor database query times

10. Create alerting rules:
    - Alert on error rate > 5%
    - Alert on API downtime
    - Alert on failed cron jobs
    - Alert on low disk space (Vercel handles this)

11. Setup logging aggregation:
    - Use Vercel Logs or external service (Axiom, Datadog)
    - Collect all application logs
    - Set up log search and filtering
    - Set retention policy

12. Create monitoring documentation:
    - Document all monitoring tools
    - Document alert thresholds
    - Document escalation procedures
    - Document how to investigate issues

Monitoring ensures you know about issues before users report them.
```

---

## Phase 16: Documentation & Training

### Task 16.1: Create Technical Documentation
**Priority**: Medium
**Dependencies**: All previous tasks
**Estimated Time**: 3 hours

**Prompt**:
```
Create comprehensive technical documentation for the Educational Management Platform.

Requirements:
1. Create README.md in project root:
   - Project overview
   - Features list
   - Technology stack
   - Prerequisites
   - Installation instructions
   - Environment variables guide
   - Running locally
   - Running tests
   - Deployment instructions
   - Contributing guidelines
   - License

2. Create ARCHITECTURE.md:
   - System architecture diagram
   - Technology choices and rationale
   - Folder structure explanation
   - Data flow diagrams
   - API architecture
   - Database schema overview
   - External integrations

3. Create API_DOCUMENTATION.md:
   - List all API endpoints
   - Request/response formats
   - Authentication requirements
   - Error codes and handling
   - Rate limiting information
   - Code examples for each endpoint

4. Create DATABASE_SCHEMA.md:
   - Detailed explanation of each model
   - Relationships between models
   - Indexes and why they exist
   - Migration strategy
   - Backup and restore procedures

5. Create DEPLOYMENT.md:
   - Step-by-step deployment guide
   - Environment setup
   - Database migration process
   - Vercel configuration
   - Domain setup
   - SSL certificate setup
   - Monitoring setup
   - Rollback procedures

6. Create CONTRIBUTING.md:
   - How to contribute
   - Code style guide
   - Git workflow (branching, PRs)
   - Testing requirements
   - Documentation requirements
   - Review process

7. Create docs/ folder with:
   - docs/development-setup.md
   - docs/testing-guide.md
   - docs/troubleshooting.md
   - docs/security.md
   - docs/performance.md

8. Add inline code documentation:
   - JSDoc comments for all functions
   - Explain complex logic
   - Document API routes with examples
   - Document component props with TypeScript

9. Create a changelog (CHANGELOG.md):
   - Version history
   - Features added
   - Bugs fixed
   - Breaking changes

10. Generate API documentation:
    - Use tool like Swagger/OpenAPI
    - Auto-generate from route handlers
    - Include interactive API explorer

Good documentation helps developers understand and maintain the codebase.
```

---

### Task 16.2: Create User Documentation & Help Center
**Priority**: Medium
**Dependencies**: All user-facing features
**Estimated Time**: 3 hours

**Prompt**:
```
Create user documentation and help center for the Educational Management Platform.

Requirements:
1. Create help center structure:
   - app/help/page.tsx - Help center home
   - app/help/[category]/page.tsx - Category pages
   - app/help/[category]/[article]/page.tsx - Article pages

2. Create help articles for each user role:

   For Students:
   - Getting started guide
   - How to view your schedule
   - How to submit homework
   - How to view homework feedback
   - How to check remaining hours
   - How to download shared resources
   - How to update your profile
   - How to change your password

   For Teachers:
   - Getting started guide
   - How to view your schedule
   - How to manage your students
   - How to assign students to your list
   - How to review homework
   - How to share resources with students
   - How to view student progress

   For Admins:
   - Getting started guide
   - How to create users
   - How to assign students to teachers
   - How to manage bookings
   - How to run API syncs
   - How to generate reports
   - How to view system logs
   - How to manage user permissions

3. Create components/help/HelpSearch.tsx:
   - Search box for help articles
   - Real-time search results
   - Keyboard navigation

4. Create components/help/ArticleCard.tsx:
   - Display help article preview
   - Show category, title, excerpt
   - Read time estimate

5. Add contextual help throughout the app:
   - Tooltip icons with help text
   - "Learn more" links to relevant help articles
   - First-time user tooltips/tours

6. Create FAQ page:
   - app/faq/page.tsx
   - Common questions and answers
   - Accordion-style Q&A

7. Create video tutorials (optional):
   - Record screen demonstrations
   - Upload to YouTube or Vimeo
   - Embed in help articles

8. Create printable user guides:
   - PDF guides for each user role
   - Step-by-step with screenshots
   - Available for download

9. Create app/help/contact/page.tsx:
   - Contact form for support
   - Email support
   - Expected response time

10. Add in-app feedback widget:
    - components/shared/FeedbackWidget.tsx
    - Quick feedback on any page
    - "Was this helpful?" buttons
    - Bug report form

11. Create onboarding tour:
    - First-time user guide
    - Highlight key features
    - Interactive walkthrough
    - Use library like react-joyride

12. Multi-language support:
    - All documentation in French and English
    - Language switcher
    - Use i18n library (next-intl)

Comprehensive user documentation reduces support requests and improves adoption.
```

---

### Task 16.3: Create Admin Training Materials
**Priority**: Low
**Dependencies**: Task 16.2
**Estimated Time**: 2 hours

**Prompt**:
```
Create training materials for administrators of the Educational Management Platform.

Requirements:
1. Create training presentation:
   - Overview of the platform
   - Key features and capabilities
   - User roles and permissions
   - Daily administrative tasks
   - Monthly administrative tasks
   - Best practices
   - Common issues and solutions

2. Create admin handbook (PDF):
   - Complete guide to admin functions
   - Screenshots and step-by-step instructions
   - Reference guide for all features
   - Troubleshooting section
   - Contact information

3. Create quick reference guides:
   - One-page cheat sheets
   - Common tasks with steps
   - Keyboard shortcuts
   - Tips and tricks

4. Create video training series:
   - Introduction to the platform (10 min)
   - User management (15 min)
   - Managing assignments (10 min)
   - Running syncs and reports (15 min)
   - Monitoring and maintenance (10 min)

5. Create training exercises:
   - Hands-on practice scenarios
   - Example tasks to complete
   - Answer key for verification

6. Create test environment guide:
   - How to access test environment
   - Sample data available
   - How to reset test environment
   - Safe environment for practice

7. Create system administration guide:
   - Database backup procedures
   - User permission management
   - Security best practices
   - Performance monitoring
   - Troubleshooting common issues

8. Create emergency procedures document:
   - What to do if system is down
   - How to contact technical support
   - How to communicate with users
   - Rollback procedures

9. Create data management guide:
   - How to export data
   - How to import data (if applicable)
   - Data retention policies
   - GDPR compliance procedures

10. Create app/(admin)/training/page.tsx:
    - Access to all training materials
    - Embedded videos
    - Downloadable PDFs
    - Links to external resources

Well-trained administrators ensure smooth platform operation.
```

---

## Phase 17: Final Polish & Launch Preparation

### Task 17.1: UI/UX Polish & Accessibility
**Priority**: High
**Dependencies**: All UI tasks
**Estimated Time**: 3 hours

**Prompt**:
```
Polish the user interface and ensure accessibility compliance.

Requirements:
1. Accessibility audit and fixes:
   - Run Lighthouse accessibility audit
   - Add alt text to all images
   - Ensure proper heading hierarchy (h1, h2, h3)
   - Add ARIA labels where needed
   - Ensure keyboard navigation works everywhere
   - Test with screen reader (NVDA, JAWS, or VoiceOver)
   - Ensure color contrast meets WCAG AA standards
   - Add focus indicators for keyboard navigation

2. Responsive design review:
   - Test on mobile devices (phone, tablet)
   - Fix any layout issues
   - Ensure touch targets are large enough (min 44x44px)
   - Test landscape and portrait orientations
   - Ensure text is readable without zooming

3. Cross-browser testing:
   - Test on Chrome, Firefox, Safari, Edge
   - Fix any browser-specific issues
   - Add polyfills if needed
   - Test on different OS (Windows, macOS, Linux)

4. Loading states and transitions:
   - Add loading spinners for all async operations
   - Smooth page transitions
   - Skeleton screens for slow-loading content
   - Progress bars for file uploads
   - Optimistic updates where appropriate

5. Error states and empty states:
   - User-friendly error messages
   - Empty state designs for tables/lists
   - Helpful messages when no data exists
   - Illustrations for empty states (optional)

6. Micro-interactions:
   - Button hover effects
   - Form input focus effects
   - Success animations
   - Toast notifications
   - Smooth scrolling

7. Typography and spacing:
   - Consistent font sizes and weights
   - Proper line heights and letter spacing
   - Consistent spacing throughout
   - Readable paragraph widths

8. Color scheme and branding:
   - Consistent color palette
   - Proper use of brand colors
   - Good contrast between text and background
   - Color coding with additional indicators (not color alone)

9. Icons and imagery:
   - Consistent icon set throughout
   - Appropriate icon sizes
   - High-quality images
   - Optimized image sizes

10. Performance polish:
    - Lazy load images and heavy components
    - Optimize bundle size
    - Minimize layout shifts
    - Fast Time to Interactive (TTI)

11. Create components/shared/Toast.tsx:
    - Global toast notification system
    - Success, error, warning, info variants
    - Auto-dismiss with timer
    - Stack multiple toasts

12. Add global loading bar:
    - NProgress or similar
    - Show during page navigation
    - Show during API calls

A polished UI creates a professional impression and improves user satisfaction.
```

---

### Task 17.2: Security Audit & Penetration Testing
**Priority**: Critical
**Dependencies**: Task 14.1, 14.2
**Estimated Time**: 3 hours

**Prompt**:
```
Conduct security audit and penetration testing of the Educational Management Platform.

Requirements:
1. Automated security scanning:
   - Run npm audit to check for vulnerable dependencies
   - Fix all high and critical vulnerabilities
   - Run OWASP ZAP or similar security scanner
   - Review and fix identified issues

2. Manual security testing:
   - Test authentication bypass attempts
   - Test authorization (access resources belonging to other users)
   - Test SQL injection on all inputs
   - Test XSS on all inputs
   - Test CSRF protection
   - Test file upload vulnerabilities
   - Test API rate limiting
   - Test session management

3. Penetration testing checklist:
   - Can student access admin routes?
   - Can student view other students' data?
   - Can teacher view data for students not assigned to them?
   - Can users access API endpoints without authentication?
   - Can users modify others' data?
   - Can users upload malicious files?
   - Are passwords properly hashed?
   - Are sessions properly invalidated on logout?
   - Are sensitive data encrypted in transit?
   - Are API keys and secrets protected?

4. Review and fix security headers:
   - Test headers with securityheaders.com
   - Ensure all recommended headers are present
   - Fix any missing or misconfigured headers

5. Review permissions and access control:
   - Audit all API routes for proper authorization
   - Ensure middleware is applied correctly
   - Test edge cases in RBAC logic

6. Review data exposure:
   - Ensure no sensitive data in API responses
   - Remove debug information from production
   - Ensure errors don't leak sensitive information

7. Review third-party integrations:
   - Ensure external API keys are secure
   - Validate data from external APIs
   - Handle external API failures gracefully

8. Create security checklist:
   - Document all security measures
   - Create ongoing security audit schedule
   - Define security incident response plan

9. Fix all identified vulnerabilities:
   - Prioritize by severity
   - Test fixes thoroughly
   - Document what was fixed and how

10. Final security verification:
    - Re-run all security scans
    - Verify all fixes are in place
    - Sign off on security audit

Security is non-negotiable. This step protects user data and the platform's reputation.
```

---

### Task 17.3: Performance Testing & Optimization
**Priority**: High
**Dependencies**: Task 13.1, 13.2, 13.3
**Estimated Time**: 2 hours

**Prompt**:
```
Conduct performance testing and final optimizations.

Requirements:
1. Lighthouse performance audit:
   - Run Lighthouse on all main pages
   - Aim for score > 90 on all metrics
   - Fix any issues identified

2. Core Web Vitals testing:
   - Largest Contentful Paint (LCP) < 2.5s
   - First Input Delay (FID) < 100ms
   - Cumulative Layout Shift (CLS) < 0.1
   - Fix any failures

3. Load testing:
   - Use k6, Artillery, or similar tool
   - Test API endpoints under load
   - Simulate 100 concurrent users
   - Identify bottlenecks
   - Optimize slow endpoints

4. Database performance testing:
   - Test with realistic data volumes
   - 1000+ students, 100+ teachers
   - 10000+ bookings
   - Ensure queries remain fast

5. File upload testing:
   - Test concurrent uploads
   - Test large files (up to 10MB)
   - Ensure upload doesn't timeout
   - Verify progress tracking works

6. Cron job performance:
   - Test syncs with large datasets
   - Ensure they complete within reasonable time
   - Verify they don't timeout

7. Browser performance profiling:
   - Use Chrome DevTools Performance tab
   - Identify long tasks (> 50ms)
   - Optimize JavaScript execution
   - Reduce layout thrashing

8. Network performance:
   - Test on slow 3G connection
   - Ensure critical functionality works
   - Optimize payload sizes
   - Use compression

9. Mobile performance:
   - Test on low-end mobile devices
   - Ensure smooth interactions
   - Reduce JavaScript bundle size
   - Optimize animations

10. Create performance budget:
    - Max bundle size
    - Max API response time
    - Target performance scores
    - Monitor adherence

11. Final optimizations:
    - Minify CSS and JavaScript
    - Optimize fonts (subset if possible)
    - Remove unused code
    - Optimize database queries

12. Set up performance monitoring:
    - Track real user metrics (RUM)
    - Set up alerts for performance degradation
    - Regular performance reviews

Fast performance leads to better user experience and higher user satisfaction.
```

---

### Task 17.4: Create Launch Checklist & Go Live
**Priority**: Critical
**Dependencies**: All previous tasks
**Estimated Time**: 2 hours

**Prompt**:
```
Create comprehensive launch checklist and execute go-live.

Requirements:
1. Pre-launch checklist:

   Technical:
   - [ ] All tests passing (unit, integration, E2E)
   - [ ] No high/critical bugs
   - [ ] Security audit completed
   - [ ] Performance benchmarks met
   - [ ] Accessibility audit passed
   - [ ] Cross-browser testing completed
   - [ ] Mobile responsiveness verified
   - [ ] All environment variables configured
   - [ ] Database migrations tested
   - [ ] Backup and recovery tested
   - [ ] Monitoring and alerts configured
   - [ ] Error tracking (Sentry) configured
   - [ ] Analytics configured
   - [ ] Email service tested
   - [ ] File uploads tested
   - [ ] External API integrations tested

   Content:
   - [ ] All help documentation complete
   - [ ] Privacy policy published
   - [ ] Terms of service published
   - [ ] User guides available
   - [ ] Admin training materials ready

   Operations:
   - [ ] Support email setup
   - [ ] Support team trained
   - [ ] Incident response plan ready
   - [ ] Communication plan ready
   - [ ] Rollback plan documented

2. Data migration (if applicable):
   - Export data from old system
   - Transform to new format
   - Import to new system
   - Verify data integrity
   - Reconcile records

3. User accounts setup:
   - Create admin accounts
   - Create test teacher accounts
   - Create test student accounts
   - Send credentials securely

4. Initial configuration:
   - Configure system settings
   - Set up initial data
   - Run first API syncs
   - Verify cron jobs working

5. Smoke testing in production:
   - Test login as each role
   - Test critical user flows
   - Verify integrations working
   - Check email delivery
   - Verify file uploads

6. Performance verification:
   - Run Lighthouse audit
   - Check API response times
   - Verify database performance
   - Check error rates

7. Launch announcement:
   - Notify users of launch
   - Provide login instructions
   - Share help resources
   - Announce support channels

8. Post-launch monitoring:
   - Monitor error rates closely
   - Watch for unusual patterns
   - Respond quickly to issues
   - Collect user feedback

9. Create post-launch schedule:
   - Day 1: Intensive monitoring
   - Week 1: Daily check-ins
   - Week 2-4: Regular reviews
   - Month 2+: Ongoing monitoring

10. Feedback collection:
    - Set up feedback mechanisms
    - Schedule user interviews
    - Create feedback form
    - Plan iterative improvements

11. Create success metrics:
    - User adoption rate
    - Active users per day
    - Feature usage statistics
    - User satisfaction scores
    - Support ticket volume

12. Celebrate launch! 🎉

Congratulations! The Educational Management Platform is now live!
```

---

## Post-Launch - Phase 18: Maintenance & Iteration

### Task 18.1: Ongoing Maintenance Plan
**Priority**: Medium
**Dependencies**: Task 17.4
**Estimated Time**: Ongoing

**Prompt**:
```
Create ongoing maintenance plan for the Educational Management Platform.

Requirements:
1. Daily tasks:
   - Monitor error logs
   - Check cron job execution
   - Review support tickets
   - Monitor system performance
   - Check uptime status

2. Weekly tasks:
   - Review user feedback
   - Analyze usage statistics
   - Check for dependency updates
   - Review security advisories
   - Database performance review

3. Monthly tasks:
   - Update dependencies (patch versions)
   - Review and optimize slow queries
   - Clean up old data (sync logs, etc.)
   - Generate usage reports
   - Conduct mini security audit

4. Quarterly tasks:
   - Major dependency updates
   - Comprehensive security audit
   - Performance optimization review
   - User satisfaction survey
   - Feature roadmap review

5. Create maintenance documentation:
   - Common issues and solutions
   - Regular maintenance procedures
   - Emergency procedures
   - Escalation contacts

6. Set up automatic updates:
   - Dependabot for dependency updates
   - Automated testing for updates
   - Auto-merge patch updates if tests pass

7. Create backup schedule:
   - Daily database backups (Vercel handles this)
   - Weekly full system backup
   - Monthly backup verification
   - Document restore procedures

8. Monitor and optimize costs:
   - Review Vercel usage
   - Optimize database queries
   - Review blob storage usage
   - Identify cost-saving opportunities

Ongoing maintenance ensures the platform remains secure, performant, and reliable.
```

---

## Summary

This comprehensive task list provides a complete roadmap for building the Educational Management Platform from scratch to production deployment. Each task includes:

- Clear requirements
- Dependencies
- Estimated time
- Detailed prompt for implementation

**Total Estimated Time**: 150-180 hours for a single developer

**Recommended Team**:
- 1 Senior Full-Stack Developer
- 1 Junior Developer (for testing, documentation)
- 1 UI/UX Designer (for polish and user testing)

**Timeline**: 8-12 weeks for Phase 1 MVP

**Next Steps**:
1. Review and prioritize tasks based on business needs
2. Set up development environment
3. Start with Phase 1: Project Setup
4. Follow tasks sequentially, testing as you go
5. Deploy early and often to catch issues

Good luck building the Educational Management Platform! 🚀
