'use client';

import { useState } from 'react';
import { Settings, Lock, Bell, Globe, Clock } from 'lucide-react';
import ChangePasswordForm from '@/components/student/ChangePasswordForm';
import NotificationSettings from '@/components/student/NotificationSettings';

type SettingsTab = 'security' | 'notifications' | 'preferences';

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('security');
  const [language, setLanguage] = useState('fr');
  const [timezone, setTimezone] = useState('Europe/Paris');

  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);
    // In a real app, you'd save this to the backend
    console.log('Language changed to:', newLanguage);
  };

  const handleTimezoneChange = async (newTimezone: string) => {
    setTimezone(newTimezone);
    // In a real app, you'd save this to the backend
    console.log('Timezone changed to:', newTimezone);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
              <p className="text-gray-600 mt-1">Gérez vos préférences et la sécurité de votre compte</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1 bg-white rounded-lg shadow-md p-2">
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'security'
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Lock className="h-5 w-5" />
                <span>Sécurité</span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'preferences'
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Globe className="h-5 w-5" />
                <span>Préférences</span>
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Lock className="h-6 w-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Sécurité du compte</h2>
                    <p className="text-sm text-gray-600">Gérez votre mot de passe et la sécurité de votre compte</p>
                  </div>
                </div>
                <ChangePasswordForm />
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="h-6 w-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Préférences de notification</h2>
                    <p className="text-sm text-gray-600">
                      Choisissez les notifications que vous souhaitez recevoir par email
                    </p>
                  </div>
                </div>
                <NotificationSettings />
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="h-6 w-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Préférences générales</h2>
                    <p className="text-sm text-gray-600">Personnalisez votre expérience sur la plateforme</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Language Preference */}
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                      Langue
                    </label>
                    <select
                      id="language"
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Choisissez la langue d'affichage de l'interface
                    </p>
                  </div>

          

  

                  {/* Save Button (for future use) */}
                  <button
                    type="button"
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    onClick={() => {
                      // Save preferences
                      alert('Préférences enregistrées!');
                    }}
                  >
                    Enregistrer les préférences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
