'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, FileText, Loader2 } from 'lucide-react';
import HoursSummaryCard from '@/components/student/HoursSummaryCard';
import UpcomingClassesWidget from '@/components/student/UpcomingClassesWidget';
import HomeworkStatusWidget from '@/components/student/HomeworkStatusWidget';

interface DashboardData {
  studentName: string;
  hoursSummary: {
    totalAllowedHours: number;
    usedHours: number;
    remainingHours: number;
  };
  upcomingBookings: Array<{
    id: string;
    date: string;
    duration: number;
    teacherName: string;
    status: string;
  }>;
  homeworkStats: {
    pending: number;
    approved: number;
    rejected: number;
    needsRevision: number;
    reviewed: number;
  };
  recentFeedback: Array<{
    id: string;
    teacherName: string;
    status: string;
    feedback: string | null;
    reviewedAt: string | null;
  }>;
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/student/dashboard');

      if (!response.ok) {
        throw new Error('Échec du chargement des données');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Impossible de charger les données du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-800 font-medium mb-2">
            {error || 'Erreur de chargement'}
          </p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {data.studentName.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenue sur votre tableau de bord étudiant
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* <Link
            href="/student/schedule"
            className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-500"
          >
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Emploi du temps</h3>
              <p className="text-sm text-gray-600">Voir mes cours</p>
            </div>
          </Link> */}
{/* 
          <Link
            href="/student/homework/submit"
            className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-green-500"
          >
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Soumettre devoir</h3>
              <p className="text-sm text-gray-600">Nouveau devoir</p>
            </div>
          </Link> */}
{/* 
          <Link
            href="/student/resources"
            className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-500"
          >
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Ressources</h3>
              <p className="text-sm text-gray-600">Documents partagés</p>
            </div>
          </Link> */}
        </div>

        {/* Hours Summary */}
        <div className="mb-8">
          <HoursSummaryCard
            totalAllowedHours={data.hoursSummary.totalAllowedHours}
            usedHours={data.hoursSummary.usedHours}
            remainingHours={data.hoursSummary.remainingHours}
          />
        </div>

        {/* Upcoming Classes and Homework Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UpcomingClassesWidget bookings={data.upcomingBookings} />
          <HomeworkStatusWidget
            stats={data.homeworkStats}
            recentFeedback={data.recentFeedback}
          />
        </div>

        {/* Motivational Message */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg text-white">
          <h3 className="text-xl font-semibold mb-2">
            Continuez votre excellent travail! 🎓
          </h3>
          <p className="text-blue-50">
            Vous progressez bien dans votre parcours de formation.
            {data.hoursSummary.remainingHours > 0 && (
              <> Il vous reste <strong>{data.hoursSummary.remainingHours} heures</strong> de formation disponibles.</>
            )}
            {data.homeworkStats.pending > 0 && (
              <> N'oubliez pas de soumettre vos <strong>{data.homeworkStats.pending} devoir{data.homeworkStats.pending > 1 ? 's' : ''}</strong> en attente.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
