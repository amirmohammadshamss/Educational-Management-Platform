'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Calendar, FileText, Loader2, CheckCircle, X } from 'lucide-react';

interface NotificationPreferences {
  emailOnHomeworkReview: boolean;
  emailOnUpcomingClass: boolean;
  emailOnNewSharedFiles: boolean;
}

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailOnHomeworkReview: true,
    emailOnUpcomingClass: true,
    emailOnNewSharedFiles: true,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/student/notification-preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
    setSuccess(false);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch('/api/student/notification-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Échec de la sauvegarde des préférences');
      }

      setSuccess(true);
      setHasChanges(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde des préférences');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Toggles */}
      <div className="space-y-4">
        {/* Email on Homework Review */}
        <div className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Évaluation de devoir</h3>
              <p className="text-sm text-gray-600 mt-1">
                Recevoir un email lorsqu'un professeur évalue votre devoir
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('emailOnHomeworkReview')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              preferences.emailOnHomeworkReview ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            disabled={isSaving}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                preferences.emailOnHomeworkReview ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Email on Upcoming Class */}
        <div className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Cours à venir</h3>
              <p className="text-sm text-gray-600 mt-1">
                Recevoir un rappel email 24h avant un cours
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('emailOnUpcomingClass')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              preferences.emailOnUpcomingClass ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            disabled={isSaving}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                preferences.emailOnUpcomingClass ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Email on New Shared Files */}
        <div className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Nouveaux fichiers partagés</h3>
              <p className="text-sm text-gray-600 mt-1">
                Recevoir un email lorsqu'un professeur partage de nouveaux fichiers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('emailOnNewSharedFiles')}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              preferences.emailOnNewSharedFiles ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            disabled={isSaving}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                preferences.emailOnNewSharedFiles ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Bell className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">À propos des notifications</p>
          <p className="text-sm text-blue-800 mt-1">
            Les notifications par email seront envoyées à votre adresse email principale.
            Vous pouvez modifier ces préférences à tout moment.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Préférences enregistrées!</p>
            <p className="text-sm text-green-700 mt-1">
              Vos préférences de notification ont été mises à jour.
            </p>
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!hasChanges || isSaving}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Enregistrement...
          </>
        ) : (
          'Enregistrer les préférences'
        )}
      </button>
    </div>
  );
}
