'use client';

/**
 * Notifications Page
 *
 * Full page view of all user notifications
 * Features: filtering, mark as read, delete, pagination
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NotificationType } from '@prisma/client';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Get icon and color based on notification type
 */
function getNotificationStyle(type: NotificationType): { icon: string; color: string } {
  switch (type) {
    case 'HOMEWORK_REVIEWED':
      return { icon: '✅', color: 'bg-green-100 text-green-800' };
    case 'HOMEWORK_SUBMITTED':
      return { icon: '📝', color: 'bg-blue-100 text-blue-800' };
    case 'CLASS_REMINDER':
      return { icon: '⏰', color: 'bg-yellow-100 text-yellow-800' };
    case 'LOW_HOURS':
      return { icon: '⚠️', color: 'bg-red-100 text-red-800' };
    case 'ASSIGNMENT':
      return { icon: '📋', color: 'bg-purple-100 text-purple-800' };
    case 'STUDENT_ASSIGNED':
      return { icon: '👥', color: 'bg-indigo-100 text-indigo-800' };
    case 'SYSTEM':
      return { icon: '🔔', color: 'bg-gray-100 text-gray-800' };
    default:
      return { icon: '📬', color: 'bg-gray-100 text-gray-800' };
  }
}

/**
 * Format date and time
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (filter === 'unread') params.append('isRead', 'false');
      if (filter === 'read') params.append('isRead', 'true');
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setPagination(data.pagination);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mark notification as read
   */
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  /**
   * Mark all as read
   */
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });

      if (response.ok) {
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  /**
   * Handle notification click
   */
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  /**
   * Fetch notifications when filters or page changes
   */
  useEffect(() => {
    fetchNotifications();
  }, [filter, typeFilter, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gérez vos notifications et restez informé
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes ({pagination?.totalCount || 0})
              </button>
              <button
                onClick={() => {
                  setFilter('unread');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Non lues ({unreadCount})
              </button>
              <button
                onClick={() => {
                  setFilter('read');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'read'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Lues
              </button>
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-4">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value as NotificationType | 'all');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les types</option>
                <option value="HOMEWORK_REVIEWED">Devoirs évalués</option>
                <option value="HOMEWORK_SUBMITTED">Devoirs soumis</option>
                <option value="CLASS_REMINDER">Rappels de cours</option>
                <option value="LOW_HOURS">Heures faibles</option>
                <option value="ASSIGNMENT">Devoirs assignés</option>
                <option value="STUDENT_ASSIGNED">Étudiants assignés</option>
                <option value="SYSTEM">Système</option>
              </select>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">Aucune notification</h3>
              <p className="mt-2 text-sm text-gray-600">
                Vous n'avez aucune notification pour le moment
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => {
                const { icon, color } = getNotificationStyle(notification.type);

                return notification.link ? (
                  <Link
                    key={notification.id}
                    href={notification.link}
                    onClick={() => handleNotificationClick(notification)}
                    className={`block p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full ${color} flex items-center justify-center text-2xl`}>
                        {icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-lg font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-xs text-gray-400">
                              {formatDateTime(notification.createdAt)}
                            </p>
                          </div>

                          {/* Unread Indicator */}
                          {!notification.isRead && (
                            <span className="ml-4 h-3 w-3 bg-blue-600 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`block p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full ${color} flex items-center justify-center text-2xl`}>
                        {icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-lg font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-xs text-gray-400">
                              {formatDateTime(notification.createdAt)}
                            </p>
                          </div>

                          {/* Unread Indicator */}
                          {!notification.isRead && (
                            <span className="ml-4 h-3 w-3 bg-blue-600 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={!pagination.hasPreviousPage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>

                <span className="text-sm text-gray-600">
                  Page {pagination.page} sur {pagination.totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
