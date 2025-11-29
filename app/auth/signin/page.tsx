/**
 * Sign In Page
 *
 * This page displays the login form for users to authenticate.
 * It handles redirects from protected routes and displays appropriate errors.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import LoginForm from '@/components/auth/LoginForm';

interface SignInPageProps {
  searchParams: {
    callbackUrl?: string;
    error?: string;
  };
}

export const metadata = {
  title: 'Sign In | Educational Management Platform',
  description: 'Sign in to access your account',
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions);

  if (session) {
    // Redirect authenticated users based on their role
    const role = session.user.role;
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      redirect('/admin');
    } else if (role === 'TEACHER') {
      redirect('/teacher');
    } else if (role === 'STUDENT') {
      redirect('/student');
    }
  }

  const callbackUrl = searchParams.callbackUrl || '/';
  const error = searchParams.error;

  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    CredentialsSignin: 'Invalid email or password. Please try again.',
    AccessDenied: 'Access denied. You do not have permission to access this resource.',
    AccountInactive: 'Your account has been deactivated. Please contact an administrator.',
    Default: 'An error occurred. Please try again.',
  };

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : undefined;

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo or Platform Name */}
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Educational Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-6 py-12 shadow-lg sm:rounded-lg sm:px-12 border border-gray-200">
          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm callbackUrl={callbackUrl} error={errorMessage} />
          </Suspense>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Need help?{' '}
            <a
              href="mailto:support@educationalplatform.com"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
