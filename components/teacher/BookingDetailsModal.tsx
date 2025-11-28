'use client';

/**
 * BookingDetailsModal Component
 *
 * Modal displaying detailed information about a booking
 * Shows student info, date/time, duration, status, and actions
 */

import { useState } from 'react';
import { BookingStatus } from '@prisma/client';

/**
 * Booking data interface
 */
export interface BookingDetails {
  id: string;
  date: string;
  duration: number;
  status: BookingStatus;
  source: string;
  student: {
    id: string;
    userId: string;
    name: string;
    email: string;
    totalAllowedHours: number;
    usedHours: number;
    remainingHours: number;
  };
}

/**
 * Component props
 */
interface BookingDetailsModalProps {
  booking: BookingDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (bookingId: string, newStatus: BookingStatus) => Promise<void>;
}

/**
 * Format date and time
 */
function formatDateTime(dateString: string): {
  date: string;
  time: string;
  dayOfWeek: string;
} {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
  };
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
 * Get hours badge color
 */
function getHoursBadgeColor(remainingHours: number, totalHours: number): string {
  if (totalHours === 0) return 'text-gray-600';
  const percentage = (remainingHours / totalHours) * 100;

  if (percentage > 50) return 'text-green-600';
  if (percentage > 20) return 'text-yellow-600';
  if (percentage > 0) return 'text-red-600';
  return 'text-gray-600';
}

/**
 * BookingDetailsModal Component
 */
export default function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onStatusChange,
}: BookingDetailsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Don't render if not open or no booking
  if (!isOpen || !booking) return null;

  const { date, time, dayOfWeek } = formatDateTime(booking.date);
  const isPastBooking = new Date(booking.date) < new Date();

  // Handle status change
  const handleStatusChange = async (newStatus: BookingStatus) => {
    if (!onStatusChange) return;

    const confirmMessage =
      newStatus === 'COMPLETED'
        ? `Mark this booking as completed? This will update the student's used hours by ${booking.duration} hours.`
        : `Change booking status to ${newStatus}?`;

    if (!confirm(confirmMessage)) return;

    setIsUpdating(true);
    try {
      await onStatusChange(booking.id, newStatus);
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Booking Details
              </h2>
              <p className="text-sm text-gray-600 mt-1">ID: {booking.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div>
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                  booking.status
                )}`}
              >
                {booking.status.replace('_', ' ')}
              </span>
            </div>

            {/* Date & Time Section */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                Date & Time
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-700 mb-1">Day</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {dayOfWeek}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 mb-1">Date</p>
                  <p className="text-lg font-semibold text-blue-900">{date}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 mb-1">Time</p>
                  <p className="text-lg font-semibold text-blue-900">{time}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 mb-1">Duration</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {booking.duration} {booking.duration === 1 ? 'hour' : 'hours'}
                  </p>
                </div>
              </div>
            </div>

            {/* Student Section */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-sm font-semibold text-green-900 mb-3">
                Student Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-green-700 mb-1">Name</p>
                  <p className="text-lg font-semibold text-green-900">
                    {booking.student.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-700 mb-1">Email</p>
                  <p className="text-sm text-green-900">
                    {booking.student.email}
                  </p>
                </div>
                <div className="pt-2 border-t border-green-200">
                  <p className="text-xs text-green-700 mb-2">Training Hours</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-green-600">Total</p>
                      <p className="text-lg font-bold text-green-900">
                        {booking.student.totalAllowedHours.toFixed(1)}h
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Used</p>
                      <p className="text-lg font-bold text-green-900">
                        {booking.student.usedHours.toFixed(1)}h
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600">Remaining</p>
                      <p
                        className={`text-lg font-bold ${getHoursBadgeColor(
                          booking.student.remainingHours,
                          booking.student.totalAllowedHours
                        )}`}
                      >
                        {booking.student.remainingHours.toFixed(1)}h
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Additional Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Source:</span>
                  <span className="font-medium text-gray-900">
                    {booking.source}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-mono text-xs text-gray-900">
                    {booking.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {onStatusChange && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-sm font-semibold text-purple-900 mb-3">
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {booking.status !== 'COMPLETED' && isPastBooking && (
                    <button
                      onClick={() => handleStatusChange('COMPLETED')}
                      disabled={isUpdating}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark as Completed
                    </button>
                  )}
                  {booking.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleStatusChange('CANCELLED')}
                      disabled={isUpdating}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel Booking
                    </button>
                  )}
                  {booking.status === 'SCHEDULED' && isPastBooking && (
                    <button
                      onClick={() => handleStatusChange('NO_SHOW')}
                      disabled={isUpdating}
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark as No-Show
                    </button>
                  )}
                  {(booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') && (
                    <button
                      onClick={() => handleStatusChange('SCHEDULED')}
                      disabled={isUpdating}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Restore to Scheduled
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
