"use client";
/*
  EventFilters component for filtering events in the admin dashboard.
  - Date range filtering with custom date inputs
  - Store selection dropdown
  - Event type multi-select (Weekly, Cup, Challenge, Prerelease)
  - Search by event name
*/

import { useState, useEffect, useMemo, useRef } from 'react';
import { Event } from '@/types/event';
import { Store } from '@/types/store';
import { getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth } from '@/lib/dateUtils';

export interface EventFilters {
  name: string;
  dateFrom: string;
  dateTo: string;
  storeId: string;
  eventTypes: string[];
}

interface EventFiltersProps {
  events: Event[];
  stores: Store[];
  onFiltersChange: (filteredEvents: Event[]) => void;
  onFiltersUpdate?: (filters: EventFilters) => void;
}

const EVENT_TYPE_OPTIONS = [
  { id: 'weekly', label: 'Weekly', key: 'is_weekly' },
  { id: 'cup', label: 'Cup', key: 'is_cup' },
  { id: 'challenge', label: 'Challenge', key: 'is_challenge' },
  { id: 'prerelease', label: 'Prerelease', key: 'is_prerelease' },
];

export default function EventFilters({ events, stores, onFiltersChange, onFiltersUpdate }: EventFiltersProps) {
  const [filters, setFilters] = useState<EventFilters>({
    name: '',
    dateFrom: '',
    dateTo: '',
    storeId: '',
    eventTypes: [],
  });

  const [showFilters, setShowFilters] = useState(false);
  // Use refs to store latest callback functions
  const onFiltersChangeRef = useRef(onFiltersChange);
  const onFiltersUpdateRef = useRef(onFiltersUpdate);

  // Update refs when callbacks change
  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange;
  }, [onFiltersChange]);

  useEffect(() => {
    onFiltersUpdateRef.current = onFiltersUpdate;
  }, [onFiltersUpdate]);

  const applyFilters = (eventList: Event[], currentFilters: EventFilters): Event[] => {
    return eventList.filter(event => {
      // Name filter
      if (currentFilters.name && !event.name.toLowerCase().includes(currentFilters.name.toLowerCase())) {
        return false;
      }

      // Date range filter
      if (currentFilters.dateFrom) {
        const eventDate = new Date(event.date);
        const fromDate = new Date(currentFilters.dateFrom);
        if (eventDate < fromDate) {
          return false;
        }
      }

      if (currentFilters.dateTo) {
        const eventDate = new Date(event.date);
        const toDate = new Date(currentFilters.dateTo);
        if (eventDate > toDate) {
          return false;
        }
      }

      // Store filter
      if (currentFilters.storeId && event.store_id !== currentFilters.storeId) {
        return false;
      }

      // Event type filter
      if (currentFilters.eventTypes.length > 0) {
        const hasSelectedType = currentFilters.eventTypes.some(typeId => {
          const typeOption = EVENT_TYPE_OPTIONS.find(opt => opt.id === typeId);
          if (!typeOption) return false;
          return event[typeOption.key as keyof Event] === true;
        });
        if (!hasSelectedType) {
          return false;
        }
      }

      return true;
    });
  };

  // Apply filters using useMemo for better performance
  const filteredEvents = useMemo(() => {
    return applyFilters(events, filters);
  }, [events, filters]);

  // Update parent component when filtered events change
  useEffect(() => {
    onFiltersChangeRef.current(filteredEvents);
    if (onFiltersUpdateRef.current) {
      onFiltersUpdateRef.current(filters);
    }
  }, [filteredEvents, filters]);

  const handleFilterChange = (key: keyof EventFilters, value: string | string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleEventTypeToggle = (typeId: string) => {
    setFilters(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(typeId)
        ? prev.eventTypes.filter(id => id !== typeId)
        : [...prev.eventTypes, typeId]
    }));
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      dateFrom: '',
      dateTo: '',
      storeId: '',
      eventTypes: [],
    });
  };

  const hasActiveFilters = filters.name || filters.dateFrom || filters.dateTo || filters.storeId || filters.eventTypes.length > 0;

  const getQuickDateRange = (range: 'week' | 'month' | 'quarter') => {
    const today = new Date().toISOString().split('T')[0];

    switch (range) {
      case 'week':
        setFilters(prev => ({
          ...prev,
          dateFrom: getStartOfWeek(today),
          dateTo: getEndOfWeek(today),
        }));
        break;
      case 'month':
        setFilters(prev => ({
          ...prev,
          dateFrom: getStartOfMonth(today),
          dateTo: getEndOfMonth(today),
        }));
        break;
      case 'quarter':
        // For quarter, we'll still use the old logic since it's more complex
        const startDate = new Date();
        const endDate = new Date();
        const quarterStart = Math.floor(startDate.getMonth() / 3) * 3;
        startDate.setMonth(quarterStart, 1);
        endDate.setMonth(quarterStart + 3, 0);
        
        setFilters(prev => ({
          ...prev,
          dateFrom: startDate.toISOString().split('T')[0],
          dateTo: endDate.toISOString().split('T')[0],
        }));
        break;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Event Filters</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {filteredEvents.length} of {events.length} events
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span className="text-sm font-medium">
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </span>
              <svg 
                className={`w-4 h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="px-6 py-4 space-y-6">
          {/* Event Name Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name
            </label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              placeholder="Search by event name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Quick Date Range Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => getQuickDateRange('week')}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                This Week
              </button>
              <button
                onClick={() => getQuickDateRange('month')}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                This Month
              </button>
              <button
                onClick={() => getQuickDateRange('quarter')}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                This Quarter
              </button>
            </div>
          </div>

          {/* Store Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store
            </label>
            <select
              value={filters.storeId}
              onChange={(e) => handleFilterChange('storeId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Stores</option>
              {stores.map(store => (
                <option key={store.store_id} value={store.store_id}>
                  {store.name} - {store.location}
                </option>
              ))}
            </select>
          </div>

          {/* Event Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Types
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {EVENT_TYPE_OPTIONS.map(type => (
                <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.eventTypes.includes(type.id)}
                    onChange={() => handleEventTypeToggle(type.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700">Active filters:</span>
                {filters.name && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Name: {filters.name}
                  </span>
                )}
                {filters.dateFrom && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    From: {new Date(filters.dateFrom).toLocaleDateString()}
                  </span>
                )}
                {filters.dateTo && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    To: {new Date(filters.dateTo).toLocaleDateString()}
                  </span>
                )}
                {filters.storeId && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Store: {stores.find(s => s.store_id === filters.storeId)?.name}
                  </span>
                )}
                {filters.eventTypes.map(typeId => {
                  const type = EVENT_TYPE_OPTIONS.find(t => t.id === typeId);
                  return type ? (
                    <span key={typeId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {type.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
