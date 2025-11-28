'use client';

import { X, CheckCircle, XCircle, AlertCircle, Download, Upload } from 'lucide-react';
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

interface HomeworkFeedbackModalProps {
  homework: Homework;
  onClose: () => void;
  onSubmitRevision?: () => void;
}

export default function HomeworkFeedbackModal({
  homework,
  onClose,
  onSubmitRevision,
}: HomeworkFeedbackModalProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-12 w-12 text-red-600" />;
      case 'NEEDS_REVISION':
        return <AlertCircle className="h-12 w-12 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Devoir approuvé';
      case 'REJECTED':
        return 'Devoir rejeté';
      case 'NEEDS_REVISION':
        return 'Révision nécessaire';
      default:
        return 'Statut';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-50 border-green-200';
      case 'REJECTED':
        return 'bg-red-50 border-red-200';
      case 'NEEDS_REVISION':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(homework.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = homework.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Erreur lors du téléchargement du fichier');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Détails du devoir</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Section */}
          <div className={`rounded-lg border p-6 text-center ${getStatusColor(homework.status)}`}>
            <div className="flex justify-center mb-4">{getStatusIcon(homework.status)}</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {getStatusTitle(homework.status)}
            </h3>
            {homework.reviewedAt && (
              <p className="text-sm text-gray-600">
                Évalué le {format(new Date(homework.reviewedAt), 'd MMMM yyyy à HH:mm', { locale: fr })}
              </p>
            )}
          </div>

          {/* Homework Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations du devoir</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-gray-600">Titre</p>
                <p className="font-medium text-gray-900">{homework.title}</p>
              </div>
              {homework.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900">{homework.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Professeur</p>
                <p className="font-medium text-gray-900">{homework.teacher.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de soumission</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(homework.submittedAt), 'd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
          </div>

          {/* File Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Fichier soumis</h3>
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white rounded border border-gray-200">
                  <Download className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{homework.fileName}</p>
                  <p className="text-sm text-gray-500">
                    {(homework.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Télécharger
              </button>
            </div>
          </div>

          {/* Feedback Section */}
          {homework.feedback && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Commentaires du professeur
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{homework.feedback}</p>
              </div>
            </div>
          )}

          {/* Revision Note */}
          {homework.status === 'NEEDS_REVISION' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 mb-1">Action requise</p>
                  <p className="text-sm text-yellow-800">
                    Veuillez réviser votre devoir selon les commentaires du professeur et soumettre une nouvelle version.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Approval Note */}
          {homework.status === 'APPROVED' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 mb-1">Félicitations!</p>
                  <p className="text-sm text-green-800">
                    Votre devoir a été approuvé par votre professeur. Excellent travail!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Note */}
          {homework.status === 'REJECTED' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 mb-1">Devoir rejeté</p>
                  <p className="text-sm text-red-800">
                    Veuillez consulter les commentaires du professeur et soumettre un nouveau devoir si nécessaire.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg transition-colors font-medium"
          >
            Fermer
          </button>
          {homework.status === 'NEEDS_REVISION' && onSubmitRevision && (
            <button
              onClick={() => {
                onClose();
                onSubmitRevision();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium"
            >
              <Upload className="h-5 w-5" />
              Soumettre une révision
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
