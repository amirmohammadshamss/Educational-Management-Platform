'use client';

/**
 * ScheduleCalendar Component
 *
 * Interactive calendar displaying teacher bookings
 * Supports month/week/day views with color-coded events
 */

import { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { BookingStatus } from '@prisma/client';
import 'react-big-calendar/lib/css/react-big-calendar.css';

/**
 * Booking data interface
 */
export interface CalendarBooking {
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
 * Calendar event interface
 */
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarBooking;
}

/**
 * Component props
 */
interface ScheduleCalendarProps {
  bookings: CalendarBooking[];
  onSelectEvent: (booking: CalendarBooking) => void;
  view: View;
  onViewChange: (view: View) => void;
  date: Date;
  onNavigate: (date: Date) => void;
}

/**
 * Setup date-fns localizer for react-big-calendar
 */
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
  getDay,
  locales,
});

/**
 * Get event color based on booking status
 */
function getEventStyle(status: BookingStatus) {
  const styles: Record<BookingStatus, { backgroundColor: string; borderColor: string; color: string }> = {
    SCHEDULED: {
      backgroundColor: '#3b82f6',
      borderColor: '#2563eb',
      color: '#ffffff',
    },
    COMPLETED: {
      backgroundColor: '#10b981',
      borderColor: '#059669',
      color: '#ffffff',
    },
    CANCELLED: {
      backgroundColor: '#ef4444',
      borderColor: '#dc2626',
      color: '#ffffff',
    },
    NO_SHOW: {
      backgroundColor: '#f97316',
      borderColor: '#ea580c',
      color: '#ffffff',
    },
  };

  return styles[status];
}

/**
 * ScheduleCalendar Component
 */
export default function ScheduleCalendar({
  bookings,
  onSelectEvent,
  view,
  onViewChange,
  date,
  onNavigate,
}: ScheduleCalendarProps) {
  // Convert bookings to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return bookings.map((booking) => {
      const start = new Date(booking.date);
      const end = new Date(start.getTime() + booking.duration * 60 * 60 * 1000);

      return {
        id: booking.id,
        title: `${booking.student.name} (${booking.duration}h)`,
        start,
        end,
        resource: booking,
      };
    });
  }, [bookings]);

  // Custom event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    const style = getEventStyle(event.resource.status);
    return {
      style: {
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        color: style.color,
        borderRadius: '4px',
        border: `2px solid ${style.borderColor}`,
        padding: '2px 5px',
        fontSize: '0.875rem',
        fontWeight: '500',
      },
    };
  };

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    onSelectEvent(event.resource);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Custom styles for calendar */}
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
          min-height: 600px;
        }

        .rbc-header {
          padding: 12px 4px;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .rbc-today {
          background-color: #eff6ff;
        }

        .rbc-off-range-bg {
          background-color: #f9fafb;
        }

        .rbc-event {
          cursor: pointer;
          transition: all 0.2s;
        }

        .rbc-event:hover {
          opacity: 0.85;
          transform: scale(1.02);
        }

        .rbc-event-label {
          font-size: 0.75rem;
        }

        .rbc-event-content {
          font-size: 0.875rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rbc-toolbar {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background-color: #f9fafb;
          flex-wrap: wrap;
          gap: 12px;
        }

        .rbc-toolbar button {
          color: #374151;
          background-color: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .rbc-toolbar button:hover {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .rbc-toolbar button:active,
        .rbc-toolbar button.rbc-active {
          background-color: #3b82f6;
          color: #ffffff;
          border-color: #3b82f6;
        }

        .rbc-toolbar button:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .rbc-month-view {
          border: none;
          border-top: 1px solid #e5e7eb;
        }

        .rbc-month-row {
          border-color: #e5e7eb;
          overflow: visible;
        }

        .rbc-day-bg {
          border-color: #e5e7eb;
        }

        .rbc-date-cell {
          padding: 4px 8px;
        }

        .rbc-current {
          color: #3b82f6;
        }

        .rbc-time-view {
          border: none;
          border-top: 1px solid #e5e7eb;
        }

        .rbc-time-header {
          border-color: #e5e7eb;
        }

        .rbc-time-content {
          border-color: #e5e7eb;
        }

        .rbc-timeslot-group {
          border-color: #e5e7eb;
          min-height: 60px;
        }

        .rbc-time-slot {
          border-color: #f3f4f6;
        }

        .rbc-current-time-indicator {
          background-color: #ef4444;
          height: 2px;
        }

        .rbc-agenda-view {
          border: none;
          padding: 16px;
        }

        .rbc-agenda-view table {
          border: none;
        }

        .rbc-agenda-view table tbody > tr > td {
          padding: 12px 8px;
          border-color: #e5e7eb;
        }

        .rbc-agenda-date-cell {
          font-weight: 600;
          color: #374151;
        }

        .rbc-agenda-time-cell {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .rbc-agenda-event-cell {
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .rbc-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .rbc-toolbar-label {
            text-align: center;
            padding: 8px 0;
            font-size: 1rem;
            font-weight: 600;
          }

          .rbc-calendar {
            min-height: 500px;
          }

          .rbc-event-content {
            font-size: 0.75rem;
          }
        }
      `}</style>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={onViewChange}
        date={date}
        onNavigate={onNavigate}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day', 'agenda']}
        step={30}
        showMultiDayTimes
        defaultDate={new Date()}
        popup
        messages={{
          today: 'Today',
          previous: 'Back',
          next: 'Next',
          month: 'Month',
          week: 'Week',
          day: 'Day',
          agenda: 'Agenda',
          date: 'Date',
          time: 'Time',
          event: 'Booking',
          noEventsInRange: 'No bookings in this date range.',
          showMore: (total) => `+${total} more`,
        }}
        formats={{
          agendaHeaderFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, 'MMM dd', culture)} - ${localizer?.format(end, 'MMM dd, yyyy', culture)}`,
          dayHeaderFormat: (date, culture, localizer) =>
            localizer?.format(date, 'EEEE, MMMM dd', culture) || '',
          dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
            `${localizer?.format(start, 'MMM dd', culture)} - ${localizer?.format(end, 'MMM dd, yyyy', culture)}`,
        }}
      />
    </div>
  );
}
