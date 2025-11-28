'use client';

import { Download, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Homework {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  feedback: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  teacher: {
    user: {
      name: string;
    };
  };
}

interface MyHomeworkListProps {
  homeworks: Homework[];
  onViewFeedback: (homework: Homework) => void;
}

export default function MyHomeworkList({ homeworks, onViewFeedback }: MyHomeworkListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'NEEDS_REVISION':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'PENDING':
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
            Approuvé
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
            Rejeté
          </span>
        );
      case 'NEEDS_REVISION':
        return (
          <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
            À réviser
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
            En attente
          </span>
        );
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Votre devoir a été approuvé';
      case 'REJECTED':
        return 'Votre devoir a été rejeté';
      case 'NEEDS_REVISION':
        return 'Des révisions sont nécessaires';
      case 'PENDING':
      default:
        return 'En attente de révision';
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  if (homeworks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-gray-400 text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun devoir</h3>
        <p className="text-gray-500">Vos devoirs soumis apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {homeworks.map((homework) => {
        const hasBeenReviewed = homework.status !== 'PENDING';

        return (
          <div
            key={homework.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    {getStatusIcon(homework.status)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{homework.title}</h3>
                      {homework.description && (
                        <p className="text-sm text-gray-600 mt-1">{homework.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                    <span>Professeur: {homework.teacher.user.name}</span>
                    <span>•</span>
                    <span>
                      Soumis le {format(new Date(homework.submittedAt), 'd MMM yyyy à HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>
                {getStatusBadge(homework.status)}
              </div>

              {/* File Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded border border-gray-200">
                      <Download className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{homework.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {(homework.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(homework.fileUrl, homework.fileName)}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors text-sm font-medium"
                  >
                    Télécharger
                  </button>
                </div>
              </div>

              {/* Status Description */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {getStatusDescription(homework.status)}
                  {homework.reviewedAt && (
                    <span className="ml-1">
                      le {format(new Date(homework.reviewedAt), 'd MMM yyyy', { locale: fr })}
                    </span>
                  )}
                </p>
              </div>

              {/* Feedback Preview */}
              {hasBeenReviewed && homework.feedback && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">Commentaires du professeur:</p>
                  <p className="text-sm text-blue-800 line-clamp-2">{homework.feedback}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {hasBeenReviewed && (
                  <button
                    onClick={() => onViewFeedback(homework)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Eye className="h-4 w-4" />
                    Voir les détails
                  </button>
                )}
                {homework.status === 'NEEDS_REVISION' && (
                  <button
                    onClick={() => onViewFeedback(homework)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Soumettre une révision
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
