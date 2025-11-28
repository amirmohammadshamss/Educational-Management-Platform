/**
 * TodaysBookings Component
 *
 * Display today's bookings in a table
 * Shows next 10 bookings sorted by time
 */

import Link from 'next/link';
import { BookingStatus } from '@prisma/client';

/**
 * Booking data interface
 */
interface Booking {
  id: string;
  date: string;
  duration: number;
  status: BookingStatus;
  student: {
    user: {
      name: string;
    };
  };
  teacher: {
    user: {
      name: string;
    };
  };
}

/**
 * Component props
 */
interface TodaysBookingsProps {
  bookings: Booking[];
}

/**
 * Get status badge color
 */
function getStatusColor(status: BookingStatus): string {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'NO_SHOW':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Format time from date string
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * TodaysBookings Component
 */
export default function TodaysBookings({ bookings }: TodaysBookingsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Today's Bookings
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Next {bookings.length} upcoming lessons
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View All
        </Link>
      </div>

      {/* Empty state */}
      {bookings.length === 0 && (
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <div className="text-4xl mb-4">📅</div>
          <p className="text-gray-600 font-medium">No bookings today</p>
          <p className="text-sm text-gray-500 mt-1">
            No lessons scheduled for today
          </p>
        </div>
      )}

      {/* Bookings table */}
      {bookings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatTime(booking.date)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {booking.student.user.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {booking.teacher.user.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {booking.duration}h
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
