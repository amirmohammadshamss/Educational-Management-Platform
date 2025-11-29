'use client';

import { Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import BookingCard from './BookingCard';

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

interface UpcomingBookingsListProps {
  bookings: Booking[];
}

export default function UpcomingBookingsList({ bookings }: UpcomingBookingsListProps) {
  // Sort bookings by date (nearest first)
  const sortedBookings = [...bookings].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const generateICalEvent = (booking: Booking) => {
    const startDate = new Date(booking.date);
    const endDate = new Date(startDate.getTime() + booking.duration * 60000);

    const formatICalDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Educational Platform//Student Booking//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${booking.id}@educational-platform.com`,
      `DTSTAMP:${formatICalDate(new Date())}`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:Cours avec ${booking.teacher.user.name || 'N/A'}`,
      `DESCRIPTION:Cours de formation\\nProfesseur: ${booking.teacher.user.name || 'N/A'}\\nDurée: ${booking.duration} minutes`,
      booking.location ? `LOCATION:${booking.location}` : '',
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Rappel: Cours dans 15 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\r\n');

    return icsContent;
  };

  const handleAddToCalendar = (booking: Booking, type: 'ical' | 'google') => {
    if (type === 'ical') {
      const icsContent = generateICalEvent(booking);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cours-${format(new Date(booking.date), 'yyyy-MM-dd-HHmm')}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else if (type === 'google') {
      const startDate = new Date(booking.date);
      const endDate = new Date(startDate.getTime() + booking.duration * 60000);

      const formatGoogleDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
      googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
      googleCalendarUrl.searchParams.set('text', `Cours avec ${booking.teacher.user.name || 'N/A'}`);
      googleCalendarUrl.searchParams.set(
        'details',
        `Cours de formation\nProfesseur: ${booking.teacher.user.name || 'N/A'}\nDurée: ${booking.duration} minutes`
      );
      googleCalendarUrl.searchParams.set('dates', `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`);
      if (booking.location) {
        googleCalendarUrl.searchParams.set('location', booking.location);
      }

      window.open(googleCalendarUrl.toString(), '_blank');
    }
  };

  const handleAddAllToCalendar = (type: 'ical' | 'google') => {
    if (type === 'ical') {
      const events = sortedBookings.map((booking) => {
        const startDate = new Date(booking.date);
        const endDate = new Date(startDate.getTime() + booking.duration * 60000);

        const formatICalDate = (date: Date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        return [
          'BEGIN:VEVENT',
          `UID:${booking.id}@educational-platform.com`,
          `DTSTAMP:${formatICalDate(new Date())}`,
          `DTSTART:${formatICalDate(startDate)}`,
          `DTEND:${formatICalDate(endDate)}`,
          `SUMMARY:Cours avec ${booking.teacher.user.name || 'N/A'}`,
          `DESCRIPTION:Cours de formation\\nProfesseur: ${booking.teacher.user.name || 'N/A'}\\nDurée: ${booking.duration} minutes`,
          booking.location ? `LOCATION:${booking.location}` : '',
          'STATUS:CONFIRMED',
          'SEQUENCE:0',
          'BEGIN:VALARM',
          'TRIGGER:-PT15M',
          'ACTION:DISPLAY',
          'DESCRIPTION:Rappel: Cours dans 15 minutes',
          'END:VALARM',
          'END:VEVENT',
        ]
          .filter(Boolean)
          .join('\r\n');
      });

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Educational Platform//Student Bookings//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        ...events,
        'END:VCALENDAR',
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-cours-${format(new Date(), 'yyyy-MM-dd')}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  if (sortedBookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun cours à venir</h3>
        <p className="text-gray-500">Vous n'avez pas de cours programmés pour le moment.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Add All to Calendar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cours à venir</h2>
          <p className="text-gray-600 mt-1">{sortedBookings.length} cours programmé{sortedBookings.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleAddAllToCalendar('ical')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            iCal (Apple)
          </button>
          <button
            onClick={() => handleAddAllToCalendar('google')}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors text-sm font-medium"
            disabled
            title="Pour Google Calendar, ajoutez les cours individuellement"
          >
            <Calendar className="h-4 w-4" />
            Google Calendar
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-6">
        {sortedBookings.map((booking, index) => (
          <div key={booking.id} className="relative">
            {index > 0 && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
              {Math.ceil(
                (new Date(booking.date).getTime() - new Date(sortedBookings[index - 1].date).getTime()) /
                  (1000 * 60 * 60 * 24)
              )}{' '}
              jour{Math.ceil(
                (new Date(booking.date).getTime() - new Date(sortedBookings[index - 1].date).getTime()) /
                  (1000 * 60 * 60 * 24)
              ) > 1 ? 's' : ''} plus tard
            </div>}

            <BookingCard booking={booking} showActions={false} />

            {/* Add to Calendar Buttons */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleAddToCalendar(booking, 'ical')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors text-sm"
              >
                <Download className="h-4 w-4" />
                Ajouter à iCal
              </button>
              <button
                onClick={() => handleAddToCalendar(booking, 'google')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors text-sm"
              >
                <Calendar className="h-4 w-4" />
                Ajouter à Google Calendar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
