'use client';

/**
 * Authentication Hooks
 *
 * Custom React hooks for managing authentication and authorization
 * in client components.
 */

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';
import type { Session } from 'next-auth';

/**
 * UseAuth Hook Return Type
 */
export interface UseAuthReturn {
  session: Session | null;
  user: Session['user'] | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

/**
 * useAuth Hook
 *
 * Returns the current user session and authentication state.
 * This is the main hook for accessing authentication information.
 *
 * @returns Authentication state and user information
 *
 * @example
 * ```tsx
 * const { user, role, isAuthenticated, isAdmin } = useAuth();
 *
 * if (!isAuthenticated) {
 *   return <p>Please sign in</p>;
 * }
 *
 * return <p>Welcome, {user.name}!</p>;
 * ```
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const user = session?.user || null;
  const role = user?.role || null;

  // Role checks
  const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
  const isSuperAdmin = role === Role.SUPER_ADMIN;
  const isTeacher = role === Role.TEACHER;
  const isStudent = role === Role.STUDENT;

  return {
    session,
    user,
    role,
    isAuthenticated,
    isLoading,
    isAdmin,
    isSuperAdmin,
    isTeacher,
    isStudent,
  };
}

/**
 * UseRequireAuth Hook Options
 */
export interface UseRequireAuthOptions {
  /** URL to redirect to if not authenticated (default: /auth/signin) */
  redirectTo?: string;
  /** Whether to redirect immediately or wait for loading to complete */
  redirectIfLoading?: boolean;
}

/**
 * useRequireAuth Hook
 *
 * Ensures the user is authenticated. Redirects to sign-in page if not.
 * Use this hook in pages that require authentication.
 *
 * @param options - Configuration options
 * @returns Authentication state and user information
 *
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { user, isLoading } = useRequireAuth();
 *
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   return <div>Protected content for {user.name}</div>;
 * }
 * ```
 */
export function useRequireAuth(
  options: UseRequireAuthOptions = {}
): UseAuthReturn {
  const { redirectTo = '/auth/signin', redirectIfLoading = false } = options;
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    // Don't redirect while loading unless explicitly requested
    if (auth.isLoading && !redirectIfLoading) {
      return;
    }

    // Redirect if not authenticated
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push(redirectTo);
    }
  }, [auth.isAuthenticated, auth.isLoading, router, redirectTo, redirectIfLoading]);

  return auth;
}

/**
 * UseRequireRole Hook Options
 */
export interface UseRequireRoleOptions {
  /** URL to redirect to if unauthorized (default: /auth/error?error=AccessDenied) */
  redirectTo?: string;
  /** Whether to redirect immediately or wait for loading to complete */
  redirectIfLoading?: boolean;
}

/**
 * useRequireRole Hook
 *
 * Ensures the user has one of the required roles. Redirects to error page if not.
 * Use this hook in pages that require specific roles.
 *
 * @param requiredRoles - Array of roles that are allowed
 * @param options - Configuration options
 * @returns Authentication state and user information
 *
 * @example
 * ```tsx
 * function AdminPage() {
 *   const { user, isLoading } = useRequireRole([Role.ADMIN, Role.SUPER_ADMIN]);
 *
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   return <div>Admin content for {user.name}</div>;
 * }
 * ```
 */
export function useRequireRole(
  requiredRoles: Role[],
  options: UseRequireRoleOptions = {}
): UseAuthReturn {
  const {
    redirectTo = '/auth/error?error=AccessDenied',
    redirectIfLoading = false,
  } = options;
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    // Don't redirect while loading unless explicitly requested
    if (auth.isLoading && !redirectIfLoading) {
      return;
    }

    // Redirect if not authenticated
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    // Redirect if user doesn't have required role
    if (!auth.isLoading && auth.isAuthenticated && auth.role) {
      if (!requiredRoles.includes(auth.role)) {
        router.push(redirectTo);
      }
    }
  }, [
    auth.isAuthenticated,
    auth.isLoading,
    auth.role,
    requiredRoles,
    router,
    redirectTo,
    redirectIfLoading,
  ]);

  return auth;
}

/**
 * useHasRole Hook
 *
 * Checks if the current user has one of the specified roles.
 * Returns null while loading.
 *
 * @param roles - Array of roles to check
 * @returns True if user has one of the roles, false if not, null if loading
 *
 * @example
 * ```tsx
 * function ConditionalContent() {
 *   const isAdmin = useHasRole([Role.ADMIN, Role.SUPER_ADMIN]);
 *
 *   if (isAdmin === null) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   return isAdmin ? <AdminContent /> : <RegularContent />;
 * }
 * ```
 */
export function useHasRole(roles: Role[]): boolean | null {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!role) {
    return false;
  }

  return roles.includes(role);
}

/**
 * useIsAuthenticated Hook
 *
 * Simple hook that returns authentication status.
 * Returns null while loading.
 *
 * @returns True if authenticated, false if not, null if loading
 *
 * @example
 * ```tsx
 * function Header() {
 *   const isAuthenticated = useIsAuthenticated();
 *
 *   if (isAuthenticated === null) {
 *     return <LoadingIndicator />;
 *   }
 *
 *   return isAuthenticated ? <UserMenu /> : <LoginButton />;
 * }
 * ```
 */
export function useIsAuthenticated(): boolean | null {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return isAuthenticated;
}
