'use client';

/**
 * ProtectedRoute Component
 *
 * A wrapper component that protects routes by checking authentication status.
 * Redirects unauthenticated users to the sign-in page.
 * Can optionally require specific roles.
 */

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Role } from '@prisma/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/auth/signin',
  loadingComponent,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (status === 'unauthenticated') {
      router.push(redirectTo);
    }

    // Check role-based access if roles are specified
    if (status === 'authenticated' && session?.user && allowedRoles) {
      if (!allowedRoles.includes(session.user.role)) {
        router.push('/auth/error?error=AccessDenied');
      }
    }
  }, [status, session, allowedRoles, router, redirectTo]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      loadingComponent || (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Don't render children if not authenticated or unauthorized
  if (status === 'unauthenticated') {
    return null;
  }

  // Check role-based access
  if (allowedRoles && session?.user && !allowedRoles.includes(session.user.role)) {
    return null;
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
}
