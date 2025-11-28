'use client';

import { Calendar, Clock, User, MapPin, Phone, Mail, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BookingCardProps {
  booking: {
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
  };
  showActions?: boolean;
}

export default function BookingCard({ booking, showActions = true }: BookingCardProps) {
  const bookingDate = new Date(booking.date);
  const endTime = new Date(bookingDate.getTime() + booking.duration * 60000);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
            Confirmé
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
            En attente
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
            Terminé
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
            Annulé
          </span>
        );
      default:
        return null;
    }
  };

  const handleDownloadConfirmation = () => {
    const confirmationText = `
CONFIRMATION DE RÉSERVATION
===============================

Date: ${format(bookingDate, 'EEEE d MMMM yyyy', { locale: fr })}
Heure: ${format(bookingDate, 'HH:mm')} - ${format(endTime, 'HH:mm')}
Durée: ${booking.duration} minutes
Professeur: ${booking.teacher.user.name}
${booking.teacher.user.email ? `Email: ${booking.teacher.user.email}` : ''}
${booking.teacher.user.phone ? `Téléphone: ${booking.teacher.user.phone}` : ''}
${booking.location ? `Lieu: ${booking.location}` : ''}
Statut: ${booking.status}

Numéro de réservation: ${booking.id}
    `.trim();

    const blob = new Blob([confirmationText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `confirmation-${booking.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePrintConfirmation = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Confirmation de réservation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: 40px auto;
              padding: 20px;
            }
            h1 {
              color: #2563eb;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 10px;
            }
            .detail {
              margin: 15px 0;
              display: flex;
            }
            .label {
              font-weight: bold;
              width: 150px;
            }
            .value {
              flex: 1;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>Confirmation de réservation</h1>
          <div class="detail">
            <div class="label">Date:</div>
            <div class="value">${format(bookingDate, 'EEEE d MMMM yyyy', { locale: fr })}</div>
          </div>
          <div class="detail">
            <div class="label">Heure:</div>
            <div class="value">${format(bookingDate, 'HH:mm')} - ${format(endTime, 'HH:mm')}</div>
          </div>
          <div class="detail">
            <div class="label">Durée:</div>
            <div class="value">${booking.duration} minutes</div>
          </div>
          <div class="detail">
            <div class="label">Professeur:</div>
            <div class="value">${booking.teacher.user.name}</div>
          </div>
          ${booking.teacher.user.email ? `
          <div class="detail">
            <div class="label">Email:</div>
            <div class="value">${booking.teacher.user.email}</div>
          </div>
          ` : ''}
          ${booking.teacher.user.phone ? `
          <div class="detail">
            <div class="label">Téléphone:</div>
            <div class="value">${booking.teacher.user.phone}</div>
          </div>
          ` : ''}
          ${booking.location ? `
          <div class="detail">
            <div class="label">Lieu:</div>
            <div class="value">${booking.location}</div>
          </div>
          ` : ''}
          <div class="detail">
            <div class="label">Statut:</div>
            <div class="value">${booking.status}</div>
          </div>
          <div class="footer">
            Numéro de réservation: ${booking.id}<br>
            Imprimé le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {format(bookingDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </h3>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {format(bookingDate, 'HH:mm')} - {format(endTime, 'HH:mm')}
              </span>
              <span className="text-sm text-gray-500">
                ({booking.duration} min)
              </span>
            </div>
          </div>
        </div>
        {getStatusBadge(booking.status)}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4" />

      {/* Teacher Information */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">Professeur</p>
            <p className="font-medium text-gray-900">{booking.teacher.user.name}</p>
          </div>
        </div>

        {booking.teacher.user.email && (
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <a
                href={`mailto:${booking.teacher.user.email}`}
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                {booking.teacher.user.email}
              </a>
            </div>
          </div>
        )}

        {booking.teacher.user.phone && (
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Téléphone</p>
              <a
                href={`tel:${booking.teacher.user.phone}`}
                className="font-medium text-blue-600 hover:text-blue-800"
              >
                {booking.teacher.user.phone}
              </a>
            </div>
          </div>
        )}

        {booking.location && (
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Lieu</p>
              <p className="font-medium text-gray-900">{booking.location}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <>
          <div className="border-t border-gray-200 my-4" />
          <div className="flex gap-3">
            <button
              onClick={handleDownloadConfirmation}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </button>
            <button
              onClick={handlePrintConfirmation}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors text-sm font-medium"
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </button>
          </div>
        </>
      )}

      {/* Booking ID */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Numéro de réservation: <span className="font-mono">{booking.id}</span>
        </p>
      </div>
    </div>
  );
}
