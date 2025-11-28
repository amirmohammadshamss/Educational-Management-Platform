'use client';

/**
 * TodaySchedule Component
 *
 * Displays today's upcoming bookings for a teacher
 * Shows time, student name, duration, and countdown to next class
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookingStatus } from '@prisma/client';

/**
 * Booking data interface
 */
export interface TodayBooking {
  id: string;
  date: string;
  duration: number;
  status: BookingStatus;
  student: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Component props
 */
interface TodayScheduleProps {
  bookings: TodayBooking[];
  onMarkCompleted?: (bookingId: string) => Promise<void>;
}

/**
 * Format time from ISO date string
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
 * Calculate time until booking
 */
function getTimeUntil(dateString: string): string {
  const now = new Date();
  const bookingDate = new Date(dateString);
  const diff = bookingDate.getTime() - now.getTime();

  if (diff < 0) {
    return 'In progress';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `In ${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `In ${minutes}m`;
  } else {
    return 'Starting soon';
  }
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
 * TodaySchedule Component
 */
export default function TodaySchedule({
  bookings,
  onMarkCompleted,
}: TodayScheduleProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Find next booking
  const nextBooking = bookings.find(
    (b) => new Date(b.date) > currentTime && b.status === 'SCHEDULED'
  );

  // Handle mark as completed
  const handleMarkCompleted = async (bookingId: string) => {
    if (!onMarkCompleted) return;

    if (
      !confirm(
        'Are you sure you want to mark this booking as completed? This will update the student\'s used hours.'
      )
    ) {
      return;
    }

    setCompletingId(bookingId);
    try {
      await onMarkCompleted(bookingId);
    } catch (error) {
      console.error('Error marking booking as completed:', error);
      alert('Failed to mark booking as completed. Please try again.');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
        <p className="text-sm text-gray-600 mt-1">
          {bookings.length} {bookings.length === 1 ? 'class' : 'classes'} scheduled
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-600 font-medium">No classes scheduled for today</p>
            <p className="text-sm text-gray-500 mt-2">
              You have a free day! Check your full schedule for upcoming classes.
            </p>
            <Link
              href="/teacher/schedule"
              className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View Full Schedule →
            </Link>
          </div>
        ) : (
          <>
            {/* Next class countdown */}
            {nextBooking && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Next Class</p>
                    <p className="text-lg font-semibold text-blue-700 mt-1">
                      {getTimeUntil(nextBooking.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700 font-medium">
                      {nextBooking.student.name}
                    </p>
                    <p className="text-sm text-blue-600">
                      {formatTime(nextBooking.date)} ({nextBooking.duration}h)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bookings list */}
            <div className="space-y-3">
              {bookings.map((booking) => {
                const isPast = new Date(booking.date) < currentTime;
                const canMarkCompleted =
                  isPast &&
                  booking.status === 'SCHEDULED' &&
                  onMarkCompleted;

                return (
                  <div
                    key={booking.id}
                    className={`p-4 border rounded-lg transition-all ${
                      booking.status === 'COMPLETED'
                        ? 'bg-gray-50 border-gray-200 opacity-75'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      {/* Time and student info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {formatTime(booking.date)}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium border rounded-full ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {booking.student.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Duration: {booking.duration} {booking.duration === 1 ? 'hour' : 'hours'}
                        </p>
                        {!isPast && booking.status === 'SCHEDULED' && (
                          <p className="text-sm text-blue-600 mt-1 font-medium">
                            {getTimeUntil(booking.date)}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        {canMarkCompleted && (
                          <button
                            onClick={() => handleMarkCompleted(booking.id)}
                            disabled={completingId === booking.id}
                            className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {completingId === booking.id
                              ? 'Marking...'
                              : 'Mark Completed'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View full schedule link */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link
                href="/teacher/schedule"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View Full Schedule
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
