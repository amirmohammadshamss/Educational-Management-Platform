/**
 * Authentication Error Page
 *
 * This page displays user-friendly error messages for authentication issues.
 * It handles various error types including access denied, account inactive, etc.
 */

import Link from 'next/link';

interface ErrorPageProps {
  searchParams: {
    error?: string;
  };
}

export const metadata = {
  title: 'Authentication Error | Educational Management Platform',
  description: 'An error occurred during authentication',
};

export default function ErrorPage({ searchParams }: ErrorPageProps) {
  const error = searchParams.error;

  // Map error codes to user-friendly messages
  const errorConfig: Record<
    string,
    {
      title: string;
      description: string;
      action?: { text: string; href: string };
    }
  > = {
    AccessDenied: {
      title: 'Access Denied',
      description:
        'You do not have permission to access this resource. Please sign in with an account that has the appropriate permissions.',
      action: { text: 'Sign In', href: '/auth/signin' },
    },
    AccountInactive: {
      title: 'Account Inactive',
      description:
        'Your account has been deactivated. Please contact an administrator to reactivate your account.',
      action: { text: 'Contact Support', href: 'mailto:support@educationalplatform.com' },
    },
    Configuration: {
      title: 'Configuration Error',
      description:
        'There is a problem with the server configuration. Please contact the administrator.',
      action: { text: 'Contact Support', href: 'mailto:support@educationalplatform.com' },
    },
    Verification: {
      title: 'Verification Error',
      description:
        'The verification link is invalid or has expired. Please request a new verification link.',
      action: { text: 'Sign In', href: '/auth/signin' },
    },
    Default: {
      title: 'Authentication Error',
      description:
        'An unexpected error occurred during authentication. Please try again or contact support if the problem persists.',
      action: { text: 'Try Again', href: '/auth/signin' },
    },
  };

  const errorInfo = errorConfig[error || 'Default'] || errorConfig.Default;

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-red-600"
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
        </div>

        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          {errorInfo.title}
        </h2>
        <p className="mt-4 text-center text-base text-gray-600 max-w-md mx-auto">
          {errorInfo.description}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-6 py-8 shadow-lg sm:rounded-lg sm:px-12 border border-gray-200">
          <div className="space-y-4">
            {errorInfo.action && (
              <Link
                href={errorInfo.action.href}
                className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {errorInfo.action.text}
              </Link>
            )}

            <Link
              href="/"
              className="flex w-full justify-center rounded-md bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Return to Home
            </Link>
          </div>

          {/* Additional Help */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
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
    </div>
  );
}
