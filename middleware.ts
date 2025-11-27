/**
 * Next.js Middleware for Route Protection
 *
 * This middleware protects routes based on user authentication and roles.
 * It runs on every request to protected routes and checks:
 * - If the user is authenticated
 * - If the user has the required role for the route
 * - If the user account is active
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // If no token, user will be redirected to sign-in by withAuth
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Check if user account is active
    if (!token.active) {
      return NextResponse.redirect(
        new URL('/auth/error?error=AccountInactive', req.url)
      );
    }

    // Role-based access control
    const userRole = token.role as Role;

    // Admin routes - require ADMIN or SUPER_ADMIN role
    if (pathname.startsWith('/admin')) {
      if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN) {
        return NextResponse.redirect(
          new URL('/auth/error?error=AccessDenied', req.url)
        );
      }
    }

    // Teacher routes - require TEACHER role
    if (pathname.startsWith('/teacher')) {
      if (userRole !== Role.TEACHER) {
        return NextResponse.redirect(
          new URL('/auth/error?error=AccessDenied', req.url)
        );
      }
    }

    // Student routes - require STUDENT role
    if (pathname.startsWith('/student')) {
      if (userRole !== Role.STUDENT) {
        return NextResponse.redirect(
          new URL('/auth/error?error=AccessDenied', req.url)
        );
      }
    }

    // Allow request to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      /**
       * Authorized callback - determines if middleware should run
       * Return true to run the middleware function above
       */
      authorized: ({ token }) => {
        // Require authentication for all protected routes
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
  }
);

/**
 * Matcher configuration
 * Specify which routes should be protected by this middleware
 */
export const config = {
  matcher: [
    // Protect admin routes
    '/admin/:path*',
    // Protect teacher routes
    '/teacher/:path*',
    // Protect student routes
    '/student/:path*',
    // Protect API routes (except auth and public endpoints)
    '/api/bookings/:path*',
    '/api/students/:path*',
    '/api/teachers/:path*',
    '/api/homework/:path*',
    '/api/reports/:path*',
    '/api/users/:path*',
  ],
};
