'use client';

import { Calendar, Clock, User, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Booking {
  id: string;
  date: string;
  duration: number;
  status: string;
  location?: string;
  teacher: {
    user: {
      name: string | null;
      email?: string;
      phone?: string;
    };
  };
}

interface PastBookingsListProps {
  bookings: Booking[];
}

export default function PastBookingsList({ bookings }: PastBookingsListProps) {
  // Sort bookings by date (most recent first)
  const sortedBookings = [...bookings].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Calculate total hours
  const totalMinutes = sortedBookings.reduce((sum, booking) => sum + booking.duration, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Group bookings by month
  const groupedBookings = sortedBookings.reduce((groups, booking) => {
    const monthKey = format(new Date(booking.date), 'MMMM yyyy', { locale: fr });
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(booking);
    return groups;
  }, {} as Record<string, Booking[]>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            Terminé
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Annulé
          </span>
        );
      default:
        return null;
    }
  };

  if (sortedBookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun cours passé</h3>
        <p className="text-gray-500">Votre historique de cours apparaîtra ici.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Total Hours */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Historique des cours</h2>
            <p className="text-gray-600 mt-1">
              {sortedBookings.length} cours terminé{sortedBookings.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-900 font-medium">Total des heures</p>
                <p className="text-3xl font-bold text-blue-700">{totalHours}h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grouped Bookings by Month */}
      <div className="space-y-8">
        {Object.entries(groupedBookings).map(([month, monthBookings]) => {
          const monthMinutes = monthBookings.reduce((sum, booking) => sum + booking.duration, 0);
          const monthHours = (monthMinutes / 60).toFixed(1);

          return (
            <div key={month}>
              {/* Month Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-300">
                <h3 className="text-xl font-semibold text-gray-800 capitalize">{month}</h3>
                <span className="text-sm text-gray-600 font-medium">
                  {monthBookings.length} cours • {monthHours}h
                </span>
              </div>

              {/* Month Bookings */}
              <div className="space-y-3">
                {monthBookings.map((booking) => {
                  const bookingDate = new Date(booking.date);
                  const endTime = new Date(bookingDate.getTime() + booking.duration * 60000);

                  return (
                    <div
                      key={booking.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        {/* Date and Time */}
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {format(bookingDate, 'EEEE d MMMM', { locale: fr })}
                              </span>
                              {getStatusBadge(booking.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {format(bookingDate, 'HH:mm')} - {format(endTime, 'HH:mm')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{booking.teacher.user.name || 'N/A'}</span>
                              </div>
                            </div>
                            {booking.location && (
                              <p className="text-sm text-gray-500 mt-1">📍 {booking.location}</p>
                            )}
                          </div>
                        </div>

                        {/* Duration */}
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-blue-600">
                            {(booking.duration / 60).toFixed(1)}h
                          </div>
                          <div className="text-xs text-gray-500">{booking.duration} min</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total des cours</p>
            <p className="text-3xl font-bold text-gray-900">{sortedBookings.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Heures totales</p>
            <p className="text-3xl font-bold text-blue-600">{totalHours}h</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Durée moyenne</p>
            <p className="text-3xl font-bold text-purple-600">
              {sortedBookings.length > 0 ? (totalMinutes / sortedBookings.length).toFixed(0) : 0} min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
