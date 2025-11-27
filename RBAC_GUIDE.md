# Role-Based Access Control (RBAC) Guide

This guide explains the complete RBAC system implemented in the Educational Management Platform.

## Table of Contents

1. [Overview](#overview)
2. [Roles and Hierarchy](#roles-and-hierarchy)
3. [Permissions](#permissions)
4. [Server-Side Usage](#server-side-usage)
5. [Client-Side Usage](#client-side-usage)
6. [Components](#components)
7. [Hooks](#hooks)
8. [Best Practices](#best-practices)
9. [Examples](#examples)

---

## Overview

The RBAC system provides a comprehensive framework for managing access control across the platform. It includes:

- **4 user roles** with defined hierarchy
- **30+ granular permissions** for fine-grained access control
- **Server-side utilities** for API route protection
- **Client-side hooks** for React components
- **Guard components** for conditional rendering
- **TypeScript types** for type safety

---

## Roles and Hierarchy

### Role Definitions

| Role | Level | Description |
|------|-------|-------------|
| `SUPER_ADMIN` | 4 | Full system access, can manage all resources and users |
| `ADMIN` | 3 | Manages users, students, teachers, and operations (no system config) |
| `TEACHER` | 2 | Manages assigned students and homework |
| `STUDENT` | 1 | Views own schedule and submits homework |

### Hierarchy Rules

- Higher level roles can manage lower level roles
- Super Admin can manage everyone
- Admin can manage everyone except Super Admin
- Teachers and Students cannot manage users

---

## Permissions

### Permission Categories

#### User Management
```typescript
CREATE_USER     // Create new users
READ_USER       // View user information
UPDATE_USER     // Modify user details
DELETE_USER     // Remove users
MANAGE_USERS    // Full user management
```

#### Student Management
```typescript
CREATE_STUDENT  // Create new students
READ_STUDENT    // View student information
UPDATE_STUDENT  // Modify student details
DELETE_STUDENT  // Remove students
ASSIGN_STUDENT  // Assign students to teachers
```

#### Teacher Management
```typescript
CREATE_TEACHER  // Create new teachers
READ_TEACHER    // View teacher information
UPDATE_TEACHER  // Modify teacher details
DELETE_TEACHER  // Remove teachers
```

#### Booking Management
```typescript
CREATE_BOOKING      // Create new bookings
READ_BOOKING        // View booking information
UPDATE_BOOKING      // Modify bookings
DELETE_BOOKING      // Cancel bookings
READ_ALL_BOOKINGS   // View all bookings (admin)
```

#### Homework Management
```typescript
CREATE_HOMEWORK     // Submit homework
READ_HOMEWORK       // View homework
UPDATE_HOMEWORK     // Modify homework
DELETE_HOMEWORK     // Remove homework
REVIEW_HOMEWORK     // Review and provide feedback
READ_ALL_HOMEWORK   // View all homework (admin)
```

#### Reports & System
```typescript
GENERATE_REPORTS    // Generate reports
EXPORT_REPORTS      // Export reports
MANAGE_SYSTEM       // System configuration
VIEW_SYNC_LOGS      // View API sync logs
```

### Role-Permission Matrix

| Permission | Super Admin | Admin | Teacher | Student |
|------------|-------------|-------|---------|---------|
| MANAGE_USERS | ✓ | ✓ | ✗ | ✗ |
| MANAGE_SYSTEM | ✓ | ✗ | ✗ | ✗ |
| ASSIGN_STUDENT | ✓ | ✓ | ✓ | ✗ |
| REVIEW_HOMEWORK | ✓ | ✓ | ✓ | ✗ |
| READ_ALL_BOOKINGS | ✓ | ✓ | ✗ | ✗ |
| CREATE_HOMEWORK | ✓ | ✓ | ✓ | ✓ |

---

## Server-Side Usage

### API Route Protection

```typescript
import { requireAuth, requireRole } from '@/lib/auth';
import { hasPermission, Permission } from '@/lib/rbac';
import { Role } from '@prisma/client';

// Require authentication
export async function GET() {
  const session = await requireAuth();
  // User is authenticated
}

// Require specific role
export async function POST() {
  await requireRole([Role.ADMIN, Role.SUPER_ADMIN]);
  // User is admin or super admin
}

// Check specific permission
export async function PUT() {
  const session = await requireAuth();

  if (!hasPermission(session.user.role, Permission.UPDATE_STUDENT)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // User has permission
}
```

### Resource Access Control

```typescript
import { canAccessResource, Permission } from '@/lib/rbac';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getCurrentUser();

  // Get resource from database
  const homework = await prisma.homework.findUnique({
    where: { id: params.id },
  });

  // Check if user can access this specific resource
  const canAccess = canAccessResource(
    session,
    Permission.READ_HOMEWORK,
    homework.studentId
  );

  if (!canAccess) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return Response.json(homework);
}
```

### Role Comparisons

```typescript
import { hasHigherRole, canManageUser } from '@/lib/rbac';
import { Role } from '@prisma/client';

// Check if admin can modify teacher
const canModify = canManageUser(Role.ADMIN, Role.TEACHER); // true

// Check role hierarchy
const isHigher = hasHigherRole(Role.ADMIN, Role.STUDENT); // true
```

---

## Client-Side Usage

### Authentication Hooks

#### useAuth - Basic Authentication

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const {
    user,           // Current user
    role,           // User's role
    isAuthenticated, // Is user logged in
    isLoading,      // Loading state
    isAdmin,        // Is admin or super admin
    isTeacher,      // Is teacher
    isStudent,      // Is student
  } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return <div>Welcome, {user.name}!</div>;
}
```

#### useRequireAuth - Require Authentication

```typescript
import { useRequireAuth } from '@/hooks/useAuth';

function ProtectedPage() {
  const { user, isLoading } = useRequireAuth();
  // Automatically redirects to /auth/signin if not authenticated

  if (isLoading) return <div>Loading...</div>;

  return <div>Protected content for {user.name}</div>;
}
```

#### useRequireRole - Require Specific Role

```typescript
import { useRequireRole } from '@/hooks/useAuth';
import { Role } from '@prisma/client';

function AdminPage() {
  const { user, isLoading } = useRequireRole([Role.ADMIN, Role.SUPER_ADMIN]);
  // Automatically redirects if user doesn't have required role

  if (isLoading) return <div>Loading...</div>;

  return <div>Admin content for {user.name}</div>;
}
```

#### useHasRole - Check Role

```typescript
import { useHasRole } from '@/hooks/useAuth';
import { Role } from '@prisma/client';

function ConditionalContent() {
  const isAdmin = useHasRole([Role.ADMIN, Role.SUPER_ADMIN]);

  if (isAdmin === null) return <div>Loading...</div>;

  return isAdmin ? <AdminPanel /> : <UserPanel />;
}
```

---

## Components

### RoleGuard - General Role Protection

```typescript
import RoleGuard from '@/components/auth/RoleGuard';
import { Role } from '@prisma/client';

<RoleGuard allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}>
  <AdminPanel />
</RoleGuard>

// With custom fallback
<RoleGuard
  allowedRoles={[Role.TEACHER]}
  fallback={<div>Teachers only</div>}
>
  <TeacherTools />
</RoleGuard>
```

### Convenience Guards

```typescript
import { AdminGuard, TeacherGuard, StudentGuard } from '@/components/auth/RoleGuard';

// Admin guard (ADMIN + SUPER_ADMIN)
<AdminGuard>
  <AdminPanel />
</AdminGuard>

// Teacher guard
<TeacherGuard>
  <TeacherDashboard />
</TeacherGuard>

// Student guard
<StudentGuard>
  <StudentDashboard />
</StudentGuard>
```

---

## Best Practices

### 1. Use Middleware for Route Protection

Protect entire route groups using `middleware.ts`:

```typescript
// Already configured in middleware.ts
// /admin/* - Requires ADMIN or SUPER_ADMIN
// /teacher/* - Requires TEACHER
// /student/* - Requires STUDENT
```

### 2. Check Permissions in API Routes

Always verify permissions in API routes:

```typescript
export async function POST() {
  const session = await requireAuth();

  if (!hasPermission(session.user.role, Permission.CREATE_STUDENT)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Process request
}
```

### 3. Use Guards for Conditional UI

Use RoleGuard for conditional rendering:

```typescript
<RoleGuard allowedRoles={[Role.ADMIN]}>
  <button>Delete User</button>
</RoleGuard>
```

### 4. Resource Ownership

Check resource ownership for non-admin users:

```typescript
const canAccess = canAccessResource(
  session,
  Permission.READ_HOMEWORK,
  homework.studentId // Owner ID
);
```

### 5. Client + Server Protection

Always protect both client and server:

```typescript
// Client - Hide UI
<AdminGuard>
  <DeleteButton />
</AdminGuard>

// Server - Verify permission
export async function DELETE() {
  await requireRole([Role.ADMIN]);
  // Process deletion
}
```

---

## Examples

### Example 1: Admin-Only Feature

```typescript
// Page component
import { useRequireRole } from '@/hooks/useAuth';
import { Role } from '@prisma/client';

export default function UsersPage() {
  const { isLoading } = useRequireRole([Role.ADMIN, Role.SUPER_ADMIN]);

  if (isLoading) return <LoadingSpinner />;

  return <UserManagement />;
}

// API route
import { requireRole } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function DELETE(request: Request) {
  await requireRole([Role.ADMIN, Role.SUPER_ADMIN]);

  // Delete user
}
```

### Example 2: Teacher-Student Assignment

```typescript
// Component
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, Permission } from '@/lib/rbac';

function StudentList() {
  const { role } = useAuth();

  const canAssign = role && hasPermission(role, Permission.ASSIGN_STUDENT);

  return (
    <div>
      {students.map(student => (
        <StudentCard key={student.id} student={student}>
          {canAssign && <button>Assign to Me</button>}
        </StudentCard>
      ))}
    </div>
  );
}

// API route
import { requireAuth } from '@/lib/auth';
import { hasPermission, Permission } from '@/lib/rbac';

export async function POST(request: Request) {
  const session = await requireAuth();

  if (!hasPermission(session.user.role, Permission.ASSIGN_STUDENT)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Create assignment
}
```

### Example 3: Resource-Based Access

```typescript
// Student can only view their own homework
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth();

  const homework = await prisma.homework.findUnique({
    where: { id: params.id },
  });

  const canAccess = canAccessResource(
    session,
    Permission.READ_HOMEWORK,
    homework.studentId
  );

  if (!canAccess) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return Response.json(homework);
}
```

---

## Summary

The RBAC system provides:

✅ **Type-safe** permission checking
✅ **Flexible** role-based and permission-based access control
✅ **Easy to use** hooks and components
✅ **Server and client** protection
✅ **Resource ownership** verification
✅ **Comprehensive** TypeScript types

Use this system consistently across your application to ensure secure, maintainable access control.
