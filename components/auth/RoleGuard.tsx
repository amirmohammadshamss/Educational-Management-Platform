'use client';

/**
 * RoleGuard Component
 *
 * A component that conditionally renders its children based on user roles.
 * Shows an access denied message or custom fallback if user doesn't have required role.
 */

import { Role } from '@prisma/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * RoleGuard Props
 */
export interface RoleGuardProps {
  /** Array of roles that are allowed to see the content */
  allowedRoles: Role[];
  /** Content to show if user has required role */
  children: React.ReactNode;
  /** Custom fallback to show if user doesn't have required role */
  fallback?: React.ReactNode;
  /** Whether to show loading state while checking authentication */
  showLoadingState?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
}

/**
 * Default Access Denied Message
 */
function DefaultAccessDenied() {
  return (
    <div className="rounded-lg bg-red-50 p-6 border border-red-200">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
          <p className="mt-2 text-sm text-red-700">
            You do not have permission to view this content. Please contact an
            administrator if you believe this is an error.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Default Loading Component
 */
function DefaultLoading() {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-3 text-sm text-gray-600">Checking permissions...</p>
      </div>
    </div>
  );
}

/**
 * RoleGuard Component
 *
 * Protects content by checking if user has one of the allowed roles.
 *
 * @example
 * ```tsx
 * // Simple usage - show content only to admins
 * <RoleGuard allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}>
 *   <AdminPanel />
 * </RoleGuard>
 *
 * // With custom fallback
 * <RoleGuard
 *   allowedRoles={[Role.TEACHER]}
 *   fallback={<p>Only teachers can access this feature.</p>}
 * >
 *   <TeacherTools />
 * </RoleGuard>
 *
 * // Hide loading state
 * <RoleGuard
 *   allowedRoles={[Role.STUDENT]}
 *   showLoadingState={false}
 * >
 *   <StudentDashboard />
 * </RoleGuard>
 * ```
 */
export default function RoleGuard({
  allowedRoles,
  children,
  fallback,
  showLoadingState = true,
  loadingComponent,
}: RoleGuardProps) {
  const { role, isLoading, isAuthenticated } = useAuth();

  // Show loading state while checking authentication
  if (isLoading && showLoadingState) {
    return <>{loadingComponent || <DefaultLoading />}</>;
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated || !role) {
    return <>{fallback || <DefaultAccessDenied />}</>;
  }

  // Check if user has one of the allowed roles
  if (!allowedRoles.includes(role)) {
    return <>{fallback || <DefaultAccessDenied />}</>;
  }

  // Render children if user has required role
  return <>{children}</>;
}

/**
 * AdminGuard Component
 *
 * Convenience component for protecting admin-only content.
 * Equivalent to RoleGuard with allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}
 *
 * @example
 * ```tsx
 * <AdminGuard>
 *   <AdminPanel />
 * </AdminGuard>
 * ```
 */
export function AdminGuard({
  children,
  fallback,
  showLoadingState = true,
  loadingComponent,
}: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard
      allowedRoles={[Role.ADMIN, Role.SUPER_ADMIN]}
      fallback={fallback}
      showLoadingState={showLoadingState}
      loadingComponent={loadingComponent}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * TeacherGuard Component
 *
 * Convenience component for protecting teacher-only content.
 * Equivalent to RoleGuard with allowedRoles={[Role.TEACHER]}
 *
 * @example
 * ```tsx
 * <TeacherGuard>
 *   <TeacherDashboard />
 * </TeacherGuard>
 * ```
 */
export function TeacherGuard({
  children,
  fallback,
  showLoadingState = true,
  loadingComponent,
}: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard
      allowedRoles={[Role.TEACHER]}
      fallback={fallback}
      showLoadingState={showLoadingState}
      loadingComponent={loadingComponent}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * StudentGuard Component
 *
 * Convenience component for protecting student-only content.
 * Equivalent to RoleGuard with allowedRoles={[Role.STUDENT]}
 *
 * @example
 * ```tsx
 * <StudentGuard>
 *   <StudentDashboard />
 * </StudentGuard>
 * ```
 */
export function StudentGuard({
  children,
  fallback,
  showLoadingState = true,
  loadingComponent,
}: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard
      allowedRoles={[Role.STUDENT]}
      fallback={fallback}
      showLoadingState={showLoadingState}
      loadingComponent={loadingComponent}
    >
      {children}
    </RoleGuard>
  );
}
