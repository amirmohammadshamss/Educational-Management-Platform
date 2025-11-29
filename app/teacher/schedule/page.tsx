'use client';

/**
 * Teacher Schedule Page
 *
 * Displays teacher's schedule in calendar or list view
 * Allows filtering by date range, student, and status
 */

import { useState, useEffect } from 'react';
import { View } from 'react-big-calendar';
import { BookingStatus } from '@prisma/client';
import ScheduleCalendar from '@/components/teacher/ScheduleCalendar';
import ScheduleListView from '@/components/teacher/ScheduleListView';
import BookingDetailsModal from '@/components/teacher/BookingDetailsModal';
import type { CalendarBooking } from '@/components/teacher/ScheduleCalendar';
import type { ListBooking } from '@/components/teacher/ScheduleListView';
import type { BookingDetails } from '@/components/teacher/BookingDetailsModal';

/**
 * View mode type
 */
type ViewMode = 'calendar' | 'list';

/**
 * Teacher Schedule Page
 */
export default function TeacherSchedulePage() {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarView, setCalendarView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | ''>('');

  // Data state
  const [bookings, setBookings] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch students for filter dropdown
  useEffect(() => {
    async function fetchStudents() {
      try {
        const response = await fetch('/api/teacher/dashboard');
        if (!response.ok) throw new Error('Failed to fetch students');

        const result = await response.json();
        setStudents(result.data.students.assigned || []);
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    }

    fetchStudents();
  }, []);

  // Fetch bookings
  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (selectedStudent) params.append('studentId', selectedStudent);
        if (selectedStatus) params.append('status', selectedStatus);

        const response = await fetch(`/api/teacher/bookings?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }

        const result = await response.json();
        setBookings(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [startDate, endDate, selectedStudent, selectedStatus]);

  // Handle booking selection
  const handleSelectBooking = (booking: CalendarBooking | ListBooking) => {
    setSelectedBooking(booking as BookingDetails);
    setIsModalOpen(true);
  };

  // Handle status change
  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      const response = await fetch('/api/teacher/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      // Update bookings list
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      );

      // Update selected booking if it's the one being changed
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }

      // Close modal
      setIsModalOpen(false);
    } catch (err) {
      throw err; // Re-throw to be handled by modal
    }
  };

  // Handle date range preset
  const handleDatePreset = (preset: 'today' | 'week' | 'month' | 'all') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (preset) {
      case 'today':
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'week':
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(weekEnd.toISOString().split('T')[0]);
        break;
      case 'month':
        const monthEnd = new Date(today);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(monthEnd.toISOString().split('T')[0]);
        break;
      case 'all':
        setStartDate('');
        setEndDate('');
        break;
    }
  };

  // Navigate to today in calendar
  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
          <p className="mt-2 text-gray-600">
            View and manage your teaching schedule
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          {/* View Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Calendar
                </span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  List
                </span>
              </button>
            </div>

            {viewMode === 'calendar' && (
              <button
                onClick={handleGoToToday}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              >
                Today
              </button>
            )}
          </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Date Range
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDatePreset('today')}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Today
                </button>
                <button
                  onClick={() => handleDatePreset('week')}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Week
                </button>
                <button
                  onClick={() => handleDatePreset('month')}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Month
                </button>
                <button
                  onClick={() => handleDatePreset('all')}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  All
                </button>
              </div>
            </div>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Presets */}


            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Student Filter */}
            <div>
              <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Student
              </label>
              <select
                id="student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Students</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as BookingStatus | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>
          </div>

          {/* Status Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-2">Status Colors:</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-xs text-gray-600">Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-xs text-gray-600">Cancelled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-xs text-gray-600">No Show</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading schedule...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium">Error loading schedule</p>
            <p className="text-red-600 text-sm mt-2">{error}</p>
          </div>
        )}

        {/* Schedule View */}
        {!loading && !error && (
          <>
            {viewMode === 'calendar' ? (
              <ScheduleCalendar
                bookings={bookings}
                onSelectEvent={handleSelectBooking}
                view={calendarView}
                onViewChange={setCalendarView}
                date={currentDate}
                onNavigate={setCurrentDate}
              />
            ) : (
              <ScheduleListView
                bookings={bookings}
                onSelectBooking={handleSelectBooking}
              />
            )}
          </>
        )}

        {/* Booking Details Modal */}
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
