'use client';

import { useEffect, useState } from 'react';
import { Loader2, BookOpen, FileText, User, Users } from 'lucide-react';
import ProfileForm from '@/components/student/ProfileForm';

interface ProfileData {
  user: {
    name: string;
    email: string;
    phone: string | null;
    profilePhoto: string | null;
    role: string;
  };
  student: {
    governmentId: string;
    totalAllowedHours: number;
    usedHours: number;
  };
  statistics: {
    totalBookings: number;
    completedBookings: number;
    upcomingBookings: number;
    homeworkSubmitted: number;
    homeworkApproved: number;
    homeworkPending: number;
  };
  assignedTeachers: Array<{
    id: string;
    user: {
      name: string;
      email: string;
    };
  }>;
}

export default function StudentProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await fetch('/api/student/profile');

      if (!response.ok) {
        throw new Error('Échec du chargement du profil');
      }

      const data = await response.json();
      setProfileData(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Impossible de charger votre profil');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-800 font-medium mb-2">{error || 'Erreur de chargement'}</p>
          <button
            onClick={fetchProfileData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
          <p className="text-gray-600 mt-1">Gérez vos informations personnelles et consultez vos statistiques</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Informations personnelles</h2>
              <ProfileForm
                initialData={{
                  name: profileData.user.name,
                  email: profileData.user.email,
                  phone: profileData.user.phone,
                  profilePhoto: profileData.user.profilePhoto,
                  governmentId: profileData.student.governmentId,
                  totalAllowedHours: profileData.student.totalAllowedHours,
                  usedHours: profileData.student.usedHours,
                  role: profileData.user.role,
                }}
                onUpdateSuccess={fetchProfileData}
              />
            </div>
          </div>

          {/* Right Column - Statistics & Teachers */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Statistiques du compte
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Total des cours</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {profileData.statistics.totalBookings}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${profileData.statistics.totalBookings > 0 ?
                          (profileData.statistics.completedBookings / profileData.statistics.totalBookings) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{profileData.statistics.completedBookings} terminés</span>
                    <span>{profileData.statistics.upcomingBookings} à venir</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Devoirs soumis</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {profileData.statistics.homeworkSubmitted}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                      <div className="text-lg font-bold text-green-700">
                        {profileData.statistics.homeworkApproved}
                      </div>
                      <div className="text-xs text-green-600">Approuvés</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-center">
                      <div className="text-lg font-bold text-yellow-700">
                        {profileData.statistics.homeworkPending}
                      </div>
                      <div className="text-xs text-yellow-600">En attente</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Teachers */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Professeurs assignés
              </h2>
              {profileData.assignedTeachers.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun professeur assigné</p>
              ) : (
                <div className="space-y-3">
                  {profileData.assignedTeachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {teacher.user.name}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {teacher.user.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <h3 className="font-semibold mb-4">Membre depuis</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{profileData.statistics.totalBookings} cours suivis</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{profileData.statistics.homeworkSubmitted} devoirs soumis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{profileData.assignedTeachers.length} professeur{profileData.assignedTeachers.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
