"use client";
/*
  UserManagement component - Main component for managing users in admin dashboard.
  - Handles user role changes and deletions
  - Manages search and filtering functionality
  - Displays user statistics
  - Integrates with Supabase for data persistence
*/

import { useState, useEffect, useMemo } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { User, UserSearchFilters } from '@/types/user';
import UserList from './UserList';
import UserSearch from './UserSearch';
import UserStats from './UserStats';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserSearchFilters>({
    username: '',
    role: '',
    dateFrom: '',
    dateTo: '',
  });

  // Load users and current user info on component mount
  useEffect(() => {
    loadUsers();
    getCurrentUser();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const getCurrentUser = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        setCurrentUserId(authData.user.id);
      }
    } catch (err) {
      console.error('Error getting current user:', err);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = getSupabaseClient();
      const { data, error: fetchError } = await supabase
        .from('Users')
        .select('user_id, username, role, date_joined, avatar_path, email')
        .order('date_joined', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setError(null);

      const supabase = getSupabaseClient();
      const { error: updateError } = await supabase
        .from('Users')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      // Update the user in the local state
      setUsers(prev => 
        prev.map(user => 
          user.user_id === userId ? { ...user, role: newRole } : user
        )
      );

      const updatedUser = users.find(user => user.user_id === userId);
      setSuccessMessage(`Successfully updated ${updatedUser?.username}'s role to ${newRole}.`);
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setError(null);
      
      const supabase = getSupabaseClient();
      
      // First, get the user info before deletion for the success message
      const userToDelete = users.find(user => user.user_id === userId);
      
      // Delete the user from the Users table
      const { error: deleteError } = await supabase
        .from('Users')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      // Remove the user from the local state
      setUsers(prev => prev.filter(user => user.user_id !== userId));
      setSuccessMessage(`Successfully deleted user "${userToDelete?.username}".`);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  // Filter users based on search criteria
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Username filter
      if (filters.username && !user.username.toLowerCase().includes(filters.username.toLowerCase())) {
        return false;
      }

      // Role filter
      if (filters.role && user.role !== filters.role) {
        return false;
      }

      // Date range filter
      const userDate = new Date(user.date_joined);
      
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        if (userDate < fromDate) {
          return false;
        }
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire end date
        if (userDate > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [users, filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-600 mt-1">
          Manage user accounts, roles, and permissions across the platform
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Statistics */}
      <UserStats users={users} isLoading={isLoading} />

      {/* Search and Filters */}
      <UserSearch
        filters={filters}
        onFiltersChange={setFilters}
        totalUsers={users.length}
        filteredUsers={filteredUsers.length}
      />

      {/* User List */}
      <UserList
        users={filteredUsers}
        currentUserId={currentUserId}
        onRoleChange={handleRoleChange}
        onDelete={handleDeleteUser}
        isLoading={isLoading}
      />
    </div>
  );
}
