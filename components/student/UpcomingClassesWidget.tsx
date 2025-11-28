'use client';

import Link from 'next/link';
import { Calendar, Clock, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UpcomingClass {
  id: string;
  date: string;
  duration: number;
  teacherName: string;
  status: string;
}

interface UpcomingClassesWidgetProps {
  bookings: UpcomingClass[];
}

export default function UpcomingClassesWidget({ bookings }: UpcomingClassesWidgetProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Confirmé
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            En attente
          </span>
        );
      default:
        return null;
    }
  };

  const getCountdown = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    if (date < now) {
      return null;
    }

    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  const nextClass = bookings[0];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Cours à venir
        </h2>
        <Link
          href="/student/schedule"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Voir tout
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun cours à venir</p>
          <p className="text-sm text-gray-400 mt-1">
            Vos prochains cours apparaîtront ici
          </p>
        </div>
      ) : (
        <>
          {/* Countdown to next class */}
          {nextClass && getCountdown(nextClass.date) && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Prochain cours
                  </p>
                  <p className="text-lg font-semibold text-blue-700">
                    {getCountdown(nextClass.date)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bookings list */}
          <div className="space-y-3">
            {bookings.map((booking) => {
              const bookingDate = new Date(booking.date);

              return (
                <div
                  key={booking.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {format(bookingDate, 'EEEE d MMMM yyyy', { locale: fr })}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {format(bookingDate, 'HH:mm', { locale: fr })} • {booking.duration} minutes
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-gray-600">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{booking.teacherName}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View Full Schedule Link */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link
              href="/student/schedule"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center w-full justify-center"
            >
              Voir l'emploi du temps complet
              <svg
                className="w-4 h-4 ml-1"
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
  );
}
