'use client';

import { useEffect, useState } from 'react';
import { Calendar, List, Loader2 } from 'lucide-react';
import StudentScheduleCalendar from '@/components/student/StudentScheduleCalendar';
import UpcomingBookingsList from '@/components/student/UpcomingBookingsList';
import PastBookingsList from '@/components/student/PastBookingsList';

interface Booking {
  id: string;
  date: string;
  duration: number;
  status: string;
  location?: string;
  teacher: {
    user: {
      name: string;
      email?: string;
      phone?: string;
    };
  };
}

type ViewMode = 'calendar' | 'list';
type TabMode = 'upcoming' | 'past';

export default function StudentSchedulePage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [tabMode, setTabMode] = useState<TabMode>('upcoming');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/student/bookings');

      if (!response.ok) {
        throw new Error('Échec du chargement des réservations');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Impossible de charger vos réservations');
    } finally {
      setLoading(false);
    }
  };

  // Split bookings into upcoming and past
  const now = new Date();
  const upcomingBookings = bookings.filter(
    (booking) =>
      new Date(booking.date) >= now &&
      (booking.status === 'CONFIRMED' || booking.status === 'PENDING')
  );
  const pastBookings = bookings.filter(
    (booking) =>
      new Date(booking.date) < now ||
      booking.status === 'COMPLETED' ||
      booking.status === 'CANCELLED'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre emploi du temps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-800 font-medium mb-2">{error}</p>
          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mon emploi du temps</h1>
              <p className="text-gray-600 mt-1">
                {bookings.length} cours au total • {upcomingBookings.length} à venir
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Calendrier</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
                <span className="font-medium">Liste</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'calendar' ? (
          /* Calendar View */
          <StudentScheduleCalendar bookings={bookings} />
        ) : (
          /* List View */
          <div>
            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <div className="flex gap-8">
                <button
                  onClick={() => setTabMode('upcoming')}
                  className={`pb-4 px-1 font-medium text-sm transition-colors relative ${
                    tabMode === 'upcoming'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Cours à venir
                  {upcomingBookings.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
                      {upcomingBookings.length}
                    </span>
                  )}
                  {tabMode === 'upcoming' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
                <button
                  onClick={() => setTabMode('past')}
                  className={`pb-4 px-1 font-medium text-sm transition-colors relative ${
                    tabMode === 'past'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Historique
                  {pastBookings.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {pastBookings.length}
                    </span>
                  )}
                  {tabMode === 'past' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {tabMode === 'upcoming' ? (
                <UpcomingBookingsList bookings={upcomingBookings} />
              ) : (
                <PastBookingsList bookings={pastBookings} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
