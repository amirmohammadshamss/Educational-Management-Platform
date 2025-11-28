'use client';

/**
 * ScheduleListView Component
 *
 * Alternative list view for bookings
 * Groups bookings by date for better mobile experience
 */

import { useMemo } from 'react';
import { BookingStatus } from '@prisma/client';

/**
 * Booking data interface
 */
export interface ListBooking {
  id: string;
  date: string;
  duration: number;
  status: BookingStatus;
  student: {
    id: string;
    name: string;
    email: string;
    remainingHours?: number;
  };
}

/**
 * Component props
 */
interface ScheduleListViewProps {
  bookings: ListBooking[];
  onSelectBooking: (booking: ListBooking) => void;
}

/**
 * Grouped bookings by date
 */
interface GroupedBookings {
  date: string;
  dateLabel: string;
  dayLabel: string;
  bookings: ListBooking[];
}

/**
 * Format date for grouping
 */
function formatDateKey(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Format date label
 */
function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateKey = formatDateKey(dateString);
  const todayKey = formatDateKey(today.toISOString());
  const tomorrowKey = formatDateKey(tomorrow.toISOString());

  if (dateKey === todayKey) {
    return 'Today';
  } else if (dateKey === tomorrowKey) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format day label
 */
function formatDayLabel(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Format time
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
 * Get status badge color
 */
function getStatusColor(status: BookingStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'NO_SHOW':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get status icon
 */
function getStatusIcon(status: BookingStatus): string {
  switch (status) {
    case 'COMPLETED':
      return '✅';
    case 'CANCELLED':
      return '❌';
    case 'NO_SHOW':
      return '⚠️';
    case 'SCHEDULED':
      return '📅';
    default:
      return '📋';
  }
}

/**
 * ScheduleListView Component
 */
export default function ScheduleListView({
  bookings,
  onSelectBooking,
}: ScheduleListViewProps) {
  // Group bookings by date
  const groupedBookings: GroupedBookings[] = useMemo(() => {
    const groups = new Map<string, ListBooking[]>();

    bookings.forEach((booking) => {
      const dateKey = formatDateKey(booking.date);
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(booking);
    });

    // Convert to array and sort
    const result: GroupedBookings[] = Array.from(groups.entries()).map(
      ([date, bookings]) => ({
        date,
        dateLabel: formatDateLabel(bookings[0].date),
        dayLabel: formatDayLabel(bookings[0].date),
        bookings: bookings.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      })
    );

    // Sort groups by date
    result.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return result;
  }, [bookings]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900">Schedule List</h2>
        <p className="text-sm text-gray-600 mt-1">
          {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} found
        </p>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-200">
        {groupedBookings.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-600 font-medium">No bookings found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters or date range to see more bookings.
            </p>
          </div>
        ) : (
          groupedBookings.map((group) => (
            <div key={group.date} className="p-6">
              {/* Date header */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {group.dateLabel}
                </h3>
                <p className="text-sm text-gray-600">{group.dayLabel}</p>
              </div>

              {/* Bookings for this date */}
              <div className="space-y-3">
                {group.bookings.map((booking) => {
                  const isPast = new Date(booking.date) < new Date();

                  return (
                    <div
                      key={booking.id}
                      onClick={() => onSelectBooking(booking)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        booking.status === 'COMPLETED'
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Status icon */}
                        <div className="text-3xl flex-shrink-0">
                          {getStatusIcon(booking.status)}
                        </div>

                        {/* Booking details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-lg">
                                {booking.student.name}
                              </p>
                              <p className="text-sm text-gray-600 truncate">
                                {booking.student.email}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 text-xs font-medium border rounded-full whitespace-nowrap ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {booking.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3">
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="font-medium">
                                {formatTime(booking.date)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              <span>
                                {booking.duration}{' '}
                                {booking.duration === 1 ? 'hour' : 'hours'}
                              </span>
                            </div>

                            {booking.student.remainingHours !== undefined && (
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                  />
                                </svg>
                                <span>
                                  {booking.student.remainingHours.toFixed(1)}h remaining
                                </span>
                              </div>
                            )}
                          </div>

                          {isPast && booking.status === 'SCHEDULED' && (
                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                              <strong>Action needed:</strong> This booking is in the
                              past. Please update its status.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
