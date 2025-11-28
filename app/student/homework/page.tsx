'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import HomeworkSubmissionForm from '@/components/student/HomeworkSubmissionForm';
import MyHomeworkList from '@/components/student/MyHomeworkList';
import HomeworkFeedbackModal from '@/components/student/HomeworkFeedbackModal';

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

type TabMode = 'submit' | 'pending' | 'reviewed';

export default function StudentHomeworkPage() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabMode>('submit');
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    fetchHomeworks();
  }, []);

  const fetchHomeworks = async () => {
    try {
      const response = await fetch('/api/student/homework');

      if (!response.ok) {
        throw new Error('Échec du chargement des devoirs');
      }

      const data = await response.json();
      setHomeworks(data.homeworks || []);
    } catch (err) {
      console.error('Error fetching homeworks:', err);
      setError('Impossible de charger vos devoirs');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFeedback = (homework: Homework) => {
    setSelectedHomework(homework);
    setShowFeedbackModal(true);
  };

  const handleSubmitRevision = () => {
    setActiveTab('submit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitSuccess = () => {
    fetchHomeworks();
    setActiveTab('pending');
  };

  // Filter homeworks by status
  const pendingHomeworks = homeworks.filter((hw) => hw.status === 'PENDING');
  const reviewedHomeworks = homeworks.filter(
    (hw) => hw.status === 'APPROVED' || hw.status === 'REJECTED' || hw.status === 'NEEDS_REVISION'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement de vos devoirs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-800 font-medium mb-2">{error}</p>
          <button
            onClick={fetchHomeworks}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Mes devoirs</h1>
          <p className="text-gray-600 mt-1">
            {homeworks.length} devoir{homeworks.length > 1 ? 's' : ''} au total • {pendingHomeworks.length} en attente • {reviewedHomeworks.length} évalué{reviewedHomeworks.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('submit')}
              className={`pb-4 px-1 font-medium text-sm transition-colors relative ${
                activeTab === 'submit' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Soumettre un devoir
              {activeTab === 'submit' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-4 px-1 font-medium text-sm transition-colors relative ${
                activeTab === 'pending' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              En attente de révision
              {pendingHomeworks.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  {pendingHomeworks.length}
                </span>
              )}
              {activeTab === 'pending' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('reviewed')}
              className={`pb-4 px-1 font-medium text-sm transition-colors relative ${
                activeTab === 'reviewed' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Évalués
              {reviewedHomeworks.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
                  {reviewedHomeworks.length}
                </span>
              )}
              {activeTab === 'reviewed' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'submit' && (
            <div className="space-y-8">
              <HomeworkSubmissionForm onSubmitSuccess={handleSubmitSuccess} />

              {/* Recent submissions */}
              {homeworks.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Soumissions récentes</h2>
                  <MyHomeworkList
                    homeworks={homeworks.slice(0, 3)}
                    onViewFeedback={handleViewFeedback}
                  />
                  {homeworks.length > 3 && (
                    <div className="text-center mt-4">
                      <button
                        onClick={() => setActiveTab('pending')}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Voir tous les devoirs →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'pending' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Devoirs en attente de révision</h2>
              {pendingHomeworks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <div className="text-gray-400 text-6xl mb-4">⏳</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun devoir en attente</h3>
                  <p className="text-gray-500 mb-4">
                    Tous vos devoirs ont été évalués ou vous n'avez pas encore soumis de devoirs.
                  </p>
                  <button
                    onClick={() => setActiveTab('submit')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Soumettre un devoir
                  </button>
                </div>
              ) : (
                <MyHomeworkList
                  homeworks={pendingHomeworks}
                  onViewFeedback={handleViewFeedback}
                />
              )}
            </div>
          )}

          {activeTab === 'reviewed' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Devoirs évalués</h2>
              {reviewedHomeworks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <div className="text-gray-400 text-6xl mb-4">✓</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun devoir évalué</h3>
                  <p className="text-gray-500 mb-4">
                    Vos devoirs évalués apparaîtront ici une fois que votre professeur les aura examinés.
                  </p>
                  <button
                    onClick={() => setActiveTab('submit')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Soumettre un devoir
                  </button>
                </div>
              ) : (
                <MyHomeworkList
                  homeworks={reviewedHomeworks}
                  onViewFeedback={handleViewFeedback}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedHomework && (
        <HomeworkFeedbackModal
          homework={selectedHomework}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedHomework(null);
          }}
          onSubmitRevision={handleSubmitRevision}
        />
      )}
    </div>
  );
}
