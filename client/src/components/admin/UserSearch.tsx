"use client";
/*
  UserSearch component for filtering users in the admin dashboard.
  - Search by username
  - Filter by role
  - Filter by date joined range
  - Real-time search with debouncing
*/

import { useState, useEffect } from 'react';
import { UserSearchFilters, USER_ROLES } from '@/types/user';

interface UserSearchProps {
  filters: UserSearchFilters;
  onFiltersChange: (filters: UserSearchFilters) => void;
  totalUsers: number;
  filteredUsers: number;
}

export default function UserSearch({ 
  filters, 
  onFiltersChange, 
  totalUsers, 
  filteredUsers 
}: UserSearchProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Debounce username search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange(localFilters);
    }, 300);

    return () => clearTimeout(timer);
  }, [localFilters, onFiltersChange]);

  const handleFilterChange = (field: keyof UserSearchFilters, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    const emptyFilters: UserSearchFilters = {
      username: '',
      role: '',
      dateFrom: '',
      dateTo: '',
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = localFilters.username || localFilters.role || localFilters.dateFrom || localFilters.dateTo;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Search & Filter Users</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Username Search */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <div className="relative">
            <input
              type="text"
              id="username"
              value={localFilters.username}
              onChange={(e) => handleFilterChange('username', e.target.value)}
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by username..."
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Role Filter */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            value={localFilters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All roles</option>
            {USER_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
            Joined From
          </label>
          <input
            type="date"
            id="dateFrom"
            value={localFilters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
            Joined To
          </label>
          <input
            type="date"
            id="dateTo"
            value={localFilters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 border-t pt-4">
        <div>
          {hasActiveFilters ? (
            <span>
              Showing {filteredUsers} of {totalUsers} users
              {localFilters.username && (
                <span className="ml-1">
                  matching &ldquo;{localFilters.username}&rdquo;
                </span>
              )}
            </span>
          ) : (
            <span>Showing all {totalUsers} users</span>
          )}
        </div>
        
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-xs">Active filters:</span>
            <div className="flex gap-1">
              {localFilters.username && (
                <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  Username: {localFilters.username}
                </span>
              )}
              {localFilters.role && (
                <span className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                  Role: {USER_ROLES.find(r => r.value === localFilters.role)?.label}
                </span>
              )}
              {localFilters.dateFrom && (
                <span className="inline-flex px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                  From: {localFilters.dateFrom}
                </span>
              )}
              {localFilters.dateTo && (
                <span className="inline-flex px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                  To: {localFilters.dateTo}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
