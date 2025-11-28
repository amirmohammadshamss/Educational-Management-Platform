'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserTable, { UserTableData } from '@/components/admin/UserTable';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserTableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/users');

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      // Format users for the table
      const formattedUsers = (data.users || []).map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt).toISOString(),
      }));
      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      // Refresh the list
      await fetchUsers();

      alert('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';

    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: !currentStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} user`);
      }

      // Refresh the list
      await fetchUsers();

      alert(`User ${action}d successfully`);
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      alert(err instanceof Error ? err.message : `Failed to ${action} user`);
    }
  };

  const handleBulkActivate = async (userIds: string[]) => {
    if (!confirm(`Are you sure you want to activate ${userIds.length} user(s)?`)) {
      return;
    }

    try {
      const promises = userIds.map(id =>
        fetch(`/api/users/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ active: true }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        throw new Error(`Failed to activate ${failed.length} user(s)`);
      }

      // Refresh the list
      await fetchUsers();

      alert(`Successfully activated ${userIds.length} user(s)`);
    } catch (err) {
      console.error('Error activating users:', err);
      alert(err instanceof Error ? err.message : 'Failed to activate users');
    }
  };

  const handleBulkDeactivate = async (userIds: string[]) => {
    if (!confirm(`Are you sure you want to deactivate ${userIds.length} user(s)?`)) {
      return;
    }

    try {
      const promises = userIds.map(id =>
        fetch(`/api/users/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ active: false }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        throw new Error(`Failed to deactivate ${failed.length} user(s)`);
      }

      // Refresh the list
      await fetchUsers();

      alert(`Successfully deactivated ${userIds.length} user(s)`);
    } catch (err) {
      console.error('Error deactivating users:', err);
      alert(err instanceof Error ? err.message : 'Failed to deactivate users');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="mt-2 text-gray-600">
                Manage system users, roles, and permissions
              </p>
            </div>
            <button
              onClick={() => router.push('/users/new')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New User</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={fetchUsers}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* User Table */}
        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : (
            <UserTable
              users={users}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
              onBulkActivate={handleBulkActivate}
              onBulkDeactivate={handleBulkDeactivate}
            />
          )}
        </div>

        {/* Stats Footer */}
        {!isLoading && !error && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.active).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Inactive Users</p>
              <p className="text-2xl font-bold text-gray-400">
                {users.filter(u => !u.active).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-blue-600">
                {users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
