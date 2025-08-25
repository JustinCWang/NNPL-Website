"use client";
/*
  EventList component for displaying and managing events in the admin dashboard.
  - Shows all events in a table format with store information
  - Edit and delete actions for each event
  - Event type badges and date formatting
  - Loading states and empty state handling
*/

import { useState } from 'react';
import { Event } from '@/types/event';
import { formatDisplayDate, isDatePast } from '@/lib/dateUtils';

interface EventListProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onRenew?: (event: Event) => void;
  isLoading?: boolean;
  showSortIndicator?: boolean;
}

type SortField = 'name' | 'date' | 'store' | 'type';
type SortDirection = 'asc' | 'desc';

export default function EventList({ events, onEdit, onDelete, onRenew, isLoading = false, showSortIndicator = true }: EventListProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
          <p className="text-gray-600">Get started by adding your first event.</p>
        </div>
      </div>
    );
  }

  const handleDeleteClick = (event: Event) => {
    if (window.confirm(`Are you sure you want to delete "${event.name}"? This action cannot be undone.`)) {
      onDelete(event.event_id);
    }
  };

  const handleRenewClick = (event: Event) => {
    if (onRenew) {
      onRenew(event);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getEventTypeString = (event: Event) => {
    const types = [];
    if (event.is_weekly) types.push('Weekly');
    if (event.is_cup) types.push('Cup');
    if (event.is_challenge) types.push('Challenge');
    if (event.is_prerelease) types.push('Prerelease');
    return types.join(', ') || 'Other';
  };

  // formatDate function removed - now using formatDisplayDate from dateUtils

  const getEventTypeBadges = (event: Event) => {
    const badges = [];
    
    if (event.is_weekly) {
      badges.push(
        <span key="weekly" className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          Weekly
        </span>
      );
    }
    
    if (event.is_cup) {
      badges.push(
        <span key="cup" className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
          Cup
        </span>
      );
    }
    
    if (event.is_challenge) {
      badges.push(
        <span key="challenge" className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
          Challenge
        </span>
      );
    }
    
    if (event.is_prerelease) {
      badges.push(
        <span key="prerelease" className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Prerelease
        </span>
      );
    }
    
    return badges;
  };

  // isEventPast function removed - now using isDatePast from dateUtils

  // Sort events based on selected field and direction
  const sortedEvents = [...events].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'store':
        const storeA = a.store?.name || '';
        const storeB = b.store?.name || '';
        comparison = storeA.localeCompare(storeB);
        break;
      case 'type':
        const typeA = getEventTypeString(a);
        const typeB = getEventTypeString(b);
        comparison = typeA.localeCompare(typeB);
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            All Events ({events.length})
          </h3>
          {showSortIndicator && (
            <div className="text-sm text-gray-500">
              Sorted by: <span className="font-medium capitalize">{sortField}</span> 
              <span className="ml-1">({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Event Name</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {getSortIcon('date')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('store')}
              >
                <div className="flex items-center space-x-1">
                  <span>Store</span>
                  {getSortIcon('store')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center space-x-1">
                  <span>Event Types</span>
                  {getSortIcon('type')}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedEvents.map((event) => (
              <tr 
                key={event.event_id} 
                className={`hover:bg-gray-50 ${isDatePast(event.date) ? 'opacity-60' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{event.name}</div>
                      {isDatePast(event.date) && (
                        <div className="text-xs text-gray-500">Past Event</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{formatDisplayDate(event.date)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {event.store?.name || 'Unknown Store'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {event.store?.location || ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {getEventTypeBadges(event)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex gap-2 justify-end">
                    {event.is_weekly && onRenew && (
                      <button
                        onClick={() => handleRenewClick(event)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Renew weekly event (create next week)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(event)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit event"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(event)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete event"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
