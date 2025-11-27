# Authentication Components

This directory contains all authentication-related components for the Educational Management Platform.

## Components

### 1. LoginForm.tsx
Reusable login form component with validation and error handling.

**Features:**
- Email and password validation using Zod
- Loading states during authentication
- Error display
- Forgot password link
- Clean TailwindCSS design

**Usage:**
```tsx
import LoginForm from '@/components/auth/LoginForm';

<LoginForm callbackUrl="/dashboard" error={errorMessage} />
```

### 2. SessionProvider.tsx
Wrapper for NextAuth SessionProvider to provide session context to client components.

**Features:**
- Automatic session refresh every 5 minutes
- Provides session data to all child components via `useSession` hook

**Usage:**
Already integrated in `app/layout.tsx`. All pages have access to session data.

### 3. ProtectedRoute.tsx
Wrapper component that protects routes by checking authentication status.

**Features:**
- Redirects unauthenticated users to sign-in page
- Optional role-based access control
- Custom loading component support
- Automatic redirection on unauthorized access

**Usage:**
```tsx
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Role } from '@prisma/client';

// Protect entire page (any authenticated user)
<ProtectedRoute>
  <YourProtectedContent />
</ProtectedRoute>

// Protect with specific roles
<ProtectedRoute allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}>
  <AdminOnlyContent />
</ProtectedRoute>

// Custom loading component
<ProtectedRoute loadingComponent={<CustomLoader />}>
  <YourContent />
</ProtectedRoute>
```

### 4. UserMenu.tsx
Displays logged-in user information and provides logout functionality.

**Features:**
- User avatar with initials
- User name and email display
- Role badge with color coding
- Dropdown menu with profile and settings links
- Sign out functionality
- Click-outside-to-close behavior

**Usage:**
```tsx
import UserMenu from '@/components/auth/UserMenu';

// In your navigation/header
<nav>
  <UserMenu />
</nav>
```

## Client-Side Session Management

### Using the useSession Hook

All client components can access the current session using the `useSession` hook:

```tsx
'use client';

import { useSession } from 'next-auth/react';

export default function MyComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <p>Welcome, {session?.user.name}</p>
      <p>Role: {session?.user.role}</p>
    </div>
  );
}
```

### Server-Side Session Access

For server components and API routes, use the helper functions from `lib/auth.ts`:

```tsx
import { getCurrentUser, requireAuth, requireRole } from '@/lib/auth';

// Get current session (returns null if not authenticated)
const session = await getCurrentUser();

// Require authentication (throws error if not authenticated)
const session = await requireAuth();

// Require specific role (throws error if unauthorized)
await requireRole(['ADMIN', 'SUPER_ADMIN']);
```

## Pages

### /auth/signin
Login page with email/password form.

**Features:**
- Automatic redirect based on user role after login
- Error display from URL parameters
- Forgot password link
- Already-authenticated users are redirected to their dashboard

### /auth/error
Error page for authentication issues.

**Features:**
- User-friendly error messages
- Different error types (AccessDenied, AccountInactive, etc.)
- Action buttons for recovery
- Contact support link

### /forgot-password
Password recovery page.

**Features:**
- Email input with validation
- Success state after submission
- Error handling
- Back to sign-in link

**Note:** The forgot password functionality requires implementing the API endpoint at `/api/auth/forgot-password`.

## Styling

All components use TailwindCSS for styling with a consistent design system:
- Primary color: Blue (blue-600)
- Error color: Red (red-600)
- Success color: Green (green-600)
- Neutral colors: Gray scale

## Security Features

1. **Password Requirements:**
   - Minimum 8 characters
   - Must contain uppercase, lowercase, and number (for reset/change password)

2. **Session Security:**
   - JWT-based sessions
   - 7-day session duration
   - Automatic session refresh
   - Secure cookie settings

3. **Role-Based Access Control:**
   - Middleware protection for routes
   - Client-side route protection
   - Server-side role verification

4. **Active Account Check:**
   - Inactive accounts cannot log in
   - Session includes active status
   - Automatic redirect for inactive users

## Next Steps

To complete the authentication system:

1. **Implement Password Reset API:**
   - Create `/api/auth/forgot-password` endpoint
   - Implement email sending functionality
   - Create password reset token system

2. **Create User Profile Pages:**
   - `/profile` - View and edit user profile
   - `/settings` - Change password and preferences

3. **Add Email Verification:**
   - Verify email addresses on registration
   - Send verification emails

4. **Implement Remember Me:**
   - Optional extended session duration
   - Persistent login option
