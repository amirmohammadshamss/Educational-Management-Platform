'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  isBefore,
} from 'date-fns';
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

interface StudentScheduleCalendarProps {
  bookings: Booking[];
}

export default function StudentScheduleCalendar({ bookings }: StudentScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Get bookings for the selected date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking) => isSameDay(new Date(booking.date), date));
  };

  // Get all days in the current month view (including leading/trailing days)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: fr, weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr, weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Navigation
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Handle day click
  const handleDayClick = (day: Date) => {
    const dayBookings = getBookingsForDate(day);
    if (dayBookings.length > 0) {
      setSelectedDate(day);
      setShowModal(true);
    }
  };

  // Get color for booking status
  const getBookingColor = (booking: Booking) => {
    const bookingDate = new Date(booking.date);
    const isPast = isBefore(bookingDate, new Date());

    if (isPast) {
      if (booking.status === 'COMPLETED') {
        return 'bg-blue-500';
      } else if (booking.status === 'CANCELLED') {
        return 'bg-red-300';
      }
      return 'bg-gray-400';
    } else {
      if (booking.status === 'CONFIRMED') {
        return 'bg-green-500';
      } else if (booking.status === 'PENDING') {
        return 'bg-yellow-500';
      }
      return 'bg-blue-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day) => {
          const dayBookings = getBookingsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          const hasBookings = dayBookings.length > 0;

          return (
            <div
              key={day.toISOString()}
              onClick={() => hasBookings && handleDayClick(day)}
              className={`
                min-h-24 p-2 border border-gray-200 rounded-lg
                ${!isCurrentMonth ? 'bg-gray-50 opacity-50' : 'bg-white'}
                ${isTodayDate ? 'border-blue-500 border-2' : ''}
                ${hasBookings ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-300' : ''}
                transition-all
              `}
            >
              <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-blue-600' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </div>

              {/* Display bookings as colored dots */}
              {hasBookings && (
                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <div
                      key={booking.id}
                      className={`text-xs text-white rounded px-1 py-0.5 truncate ${getBookingColor(booking)}`}
                      title={`${format(new Date(booking.date), 'HH:mm')} - ${booking.teacher.user.name || 'N/A'}`}
                    >
                      {format(new Date(booking.date), 'HH:mm')}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">+{dayBookings.length - 3}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Légende</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-600">Confirmé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-xs text-gray-600">En attente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-600">Terminé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-300 rounded"></div>
            <span className="text-xs text-gray-600">Annulé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
            <span className="text-xs text-gray-600">Aujourd'hui</span>
          </div>
        </div>
      </div>

      {/* Modal for Day Details */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 capitalize">
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {getBookingsForDate(selectedDate).map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
