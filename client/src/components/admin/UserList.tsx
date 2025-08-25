"use client";
/*
  UserList component for displaying and managing users in the admin dashboard.
  - Shows all users in a table format
  - Role change functionality with dropdown
  - Delete user functionality with confirmation
  - User avatar display and date formatting
*/

import React, { useState } from 'react';
import Image from 'next/image';
import { User, USER_ROLES } from '@/types/user';

interface UserListProps {
  users: User[];
  currentUserId: string; // To prevent self-modification
  onRoleChange: (userId: string, newRole: string) => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
  isLoading?: boolean;
}

export default function UserList({ 
  users, 
  currentUserId, 
  onRoleChange, 
  onDelete, 
  isLoading = false 
}: UserListProps) {
  const [roleChanging, setRoleChanging] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
          <p className="text-gray-600">No users match your current filters.</p>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUserId && newRole !== 'admin') {
      alert("You cannot remove your own admin privileges.");
      return;
    }

    if (window.confirm(`Are you sure you want to change this user's role to "${newRole}"?`)) {
      setRoleChanging(userId);
      try {
        await onRoleChange(userId, newRole);
      } finally {
        setRoleChanging(null);
      }
    }
  };

  const handleDeleteClick = async (user: User) => {
    if (user.user_id === currentUserId) {
      alert("You cannot delete your own account.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone and will permanently remove their account and all associated data.`)) {
      setDeleting(user.user_id);
      try {
        await onDelete(user.user_id);
      } finally {
        setDeleting(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = USER_ROLES.find(r => r.value === role);
    const roleLabel = roleConfig?.label || role;
    
    let badgeClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
    
    switch (role) {
      case 'admin':
        badgeClasses += " bg-red-100 text-red-800";
        break;
      case 'moderator':
        badgeClasses += " bg-yellow-100 text-yellow-800";
        break;
      case 'member':
      default:
        badgeClasses += " bg-gray-100 text-gray-800";
        break;
    }
    
    return (
      <span className={badgeClasses}>
        {roleLabel}
      </span>
    );
  };

  const getAvatarDisplay = (user: User) => {
    if (user.avatar_path) {
      return (
        <Image
          src={user.avatar_path}
          alt={`${user.username}'s avatar`}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    } else {
      // Default avatar with user initials
      const initials = user.username.substring(0, 2).toUpperCase();
      return (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700">{initials}</span>
        </div>
      );
    }
  };

  // Sort users: admins first, then by date joined (newest first)
  const sortedUsers = [...users].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (b.role === 'admin' && a.role !== 'admin') return 1;
    return new Date(b.date_joined).getTime() - new Date(a.date_joined).getTime();
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          All Users ({users.length})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedUsers.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getAvatarDisplay(user)}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {user.username}
                        {user.user_id === currentUserId && (
                          <span className="ml-2 text-xs text-blue-600">(You)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                    {user.user_id !== currentUserId && (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                        disabled={roleChanging === user.user_id}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        title="Change user role"
                      >
                        {USER_ROLES.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {roleChanging === user.user_id && (
                      <div className="text-xs text-blue-600">Updating...</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{formatDate(user.date_joined)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user.user_id !== currentUserId && (
                    <button
                      onClick={() => handleDeleteClick(user)}
                      disabled={deleting === user.user_id}
                      className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                      title="Delete user"
                    >
                      {deleting === user.user_id ? (
                        <div className="w-4 h-4 animate-spin border-2 border-red-600 border-t-transparent rounded-full"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
