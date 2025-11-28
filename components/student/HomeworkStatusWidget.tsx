'use client';

import Link from 'next/link';
import { FileText, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HomeworkStats {
  pending: number;
  approved: number;
  rejected: number;
  needsRevision: number;
  reviewed: number;
}

interface RecentFeedback {
  id: string;
  teacherName: string;
  status: string;
  feedback: string | null;
  reviewedAt: string | null;
}

interface HomeworkStatusWidgetProps {
  stats: HomeworkStats;
  recentFeedback: RecentFeedback[];
}

export default function HomeworkStatusWidget({
  stats,
  recentFeedback,
}: HomeworkStatusWidgetProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'NEEDS_REVISION':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Approuvé';
      case 'REJECTED':
        return 'Rejeté';
      case 'NEEDS_REVISION':
        return 'À réviser';
      default:
        return 'En attente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-700';
      case 'REJECTED':
        return 'text-red-700';
      case 'NEEDS_REVISION':
        return 'text-yellow-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Devoirs
        </h2>
        <Link
          href="/student/homework"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Voir tout
        </Link>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">En attente</span>
          </div>
          <div className="text-3xl font-bold text-yellow-700">{stats.pending}</div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Évalués</span>
          </div>
          <div className="text-3xl font-bold text-blue-700">{stats.reviewed}</div>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Approuvés</span>
          </div>
          <div className="text-3xl font-bold text-green-700">{stats.approved}</div>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-900">À réviser</span>
          </div>
          <div className="text-3xl font-bold text-red-700">
            {stats.needsRevision + stats.rejected}
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      {recentFeedback.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Commentaires récents
          </h3>
          <div className="space-y-3">
            {recentFeedback.map((feedback) => (
              <div
                key={feedback.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(feedback.status)}
                    <span className={`text-sm font-medium ${getStatusColor(feedback.status)}`}>
                      {getStatusText(feedback.status)}
                    </span>
                  </div>
                  {feedback.reviewedAt && (
                    <span className="text-xs text-gray-500">
                      {format(new Date(feedback.reviewedAt), 'd MMM yyyy', { locale: fr })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-1">
                  Par: <span className="font-medium">{feedback.teacherName}</span>
                </p>
                {feedback.feedback && (
                  <p className="text-sm text-gray-600 italic line-clamp-2">
                    "{feedback.feedback}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Link
          href="/student/homework/submit"
          className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-center rounded-lg transition-colors"
        >
          Soumettre un nouveau devoir
        </Link>
        <Link
          href="/student/homework"
          className="block w-full px-4 py-3 bg-white hover:bg-gray-50 text-blue-600 font-medium text-center rounded-lg border-2 border-blue-600 transition-colors"
        >
          Voir tous les devoirs
        </Link>
      </div>
    </div>
  );
}
