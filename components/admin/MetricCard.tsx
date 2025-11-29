/**
 * MetricCard Component
 *
 * Reusable card for displaying dashboard metrics
 * Features: icon, title, value, trend indicator, optional link
 */

import Link from 'next/link';

/**
 * Component props
 */
interface MetricCardProps {
  icon: string;
  title: string;
  value: number | string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  linkTo?: string;
  linkText?: string;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

/**
 * Get color classes based on scheme
 */
function getColorClasses(scheme: string) {
  switch (scheme) {
    case 'blue':
      return {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        value: 'text-blue-900',
        link: 'text-blue-600 hover:text-blue-800',
      };
    case 'green':
      return {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        value: 'text-green-900',
        link: 'text-green-600 hover:text-green-800',
      };
    case 'purple':
      return {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        value: 'text-purple-900',
        link: 'text-purple-600 hover:text-purple-800',
      };
    case 'orange':
      return {
        bg: 'bg-orange-50',
        icon: 'text-orange-600',
        value: 'text-orange-900',
        link: 'text-orange-600 hover:text-orange-800',
      };
    case 'red':
      return {
        bg: 'bg-red-50',
        icon: 'text-red-600',
        value: 'text-red-900',
        link: 'text-red-600 hover:text-red-800',
      };
    default:
      return {
        bg: 'bg-gray-50',
        icon: 'text-gray-600',
        value: 'text-gray-900',
        link: 'text-gray-600 hover:text-gray-800',
      };
  }
}

/**
 * MetricCard Component
 */
export default function MetricCard({
  icon,
  title,
  value,
  trend,
  linkTo,
  linkText = 'View details',
  colorScheme = 'blue',
}: MetricCardProps) {
  const colors = getColorClasses(colorScheme);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
      {/* Icon and Title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div
            className={`${colors.bg} ${colors.icon} rounded-lg p-3 text-2xl`}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
        </div>
      </div>

      {/* Value */}
      <div className="mb-4">
        <p className={`text-3xl font-bold ${colors.value}`}>{value}</p>
      </div>

      {/* Trend indicator */}
      {trend && (
        <div className="mb-4 flex items-center">
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              trend.isPositive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          {trend.label && (
            <span className="ml-2 text-xs text-gray-500">{trend.label}</span>
          )}
        </div>
      )}

      {/* Link
      {linkTo && (
        <Link
          href={linkTo}
          className={`text-sm font-medium ${colors.link} inline-flex items-center`}
        >
          {linkText}
          <svg
            className="ml-1 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      )} */}
    </div>
  );
}
