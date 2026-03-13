"use client";
/*
  UserEventFilters component for filtering events in the user's my-events page.
  - Date range filtering with custom date inputs
  - Store selection dropdown
  - Event type multi-select (Weekly, Cup, Challenge, Prerelease)
  - Search by event name
  - Simplified interface for regular users
  - Supports initial filter values from URL parameters
*/

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Event } from '@/types/event';
import { Store } from '@/types/store';
import { getEventLocalDate, getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth } from '@/lib/dateUtils';

export interface UserEventFilters {
  name: string;
  dateFrom: string;
  dateTo: string;
  storeId: string;
  eventTypes: string[];
}

interface UserEventFiltersProps {
  events: Event[];
  stores: Store[];
  onFiltersChange: (filteredEvents: Event[]) => void;
  initialFilters?: Partial<UserEventFilters>;
}

const EVENT_TYPE_OPTIONS = [
  { id: 'weekly', label: 'Weekly', key: 'is_weekly' },
  { id: 'cup', label: 'Cup', key: 'is_cup' },
  { id: 'challenge', label: 'Challenge', key: 'is_challenge' },
  { id: 'prerelease', label: 'Prerelease', key: 'is_prerelease' },
];

export default function UserEventFilters({ events, stores, onFiltersChange, initialFilters }: UserEventFiltersProps) {
  const initialStoreId = initialFilters?.storeId || '';
  const initialEventTypes = initialFilters?.eventTypes || [];
  const [filters, setFilters] = useState<UserEventFilters>(() => ({
    name: '',
    dateFrom: '',
    dateTo: '',
    storeId: initialStoreId,
    eventTypes: initialEventTypes,
  }));
  const lastAppliedInitialFiltersRef = useRef({
    storeId: initialStoreId,
    eventTypes: initialEventTypes,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Update filters when initialFilters change (e.g., from URL params)
  useEffect(() => {
    const previousInitialFilters = lastAppliedInitialFiltersRef.current;
    const eventTypesChanged =
      previousInitialFilters.eventTypes.length !== initialEventTypes.length ||
      previousInitialFilters.eventTypes.some((type, index) => type !== initialEventTypes[index]);

    if (previousInitialFilters.storeId === initialStoreId && !eventTypesChanged) {
      return;
    }

    lastAppliedInitialFiltersRef.current = {
      storeId: initialStoreId,
      eventTypes: initialEventTypes,
    };

    setFilters(prev => ({
      ...prev,
      storeId: initialStoreId,
      eventTypes: initialEventTypes,
    }));
  }, [initialStoreId, initialEventTypes]);

  const applyFilters = useCallback((eventList: Event[], currentFilters: UserEventFilters): Event[] => {
    return eventList.filter(event => {
      // Name filter
      if (currentFilters.name && !event.name.toLowerCase().includes(currentFilters.name.toLowerCase())) {
        return false;
      }

      // Date range filter
      const eventLocalDate = getEventLocalDate(event.start_at, event.timezone);

      if (currentFilters.dateFrom) {
        if (eventLocalDate < currentFilters.dateFrom) {
          return false;
        }
      }

      if (currentFilters.dateTo) {
        if (eventLocalDate > currentFilters.dateTo) {
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
  }, []);

  // Apply filters using useMemo for better performance
  const filteredEvents = useMemo(() => {
    return applyFilters(events, filters);
  }, [events, filters, applyFilters]);

  // Update parent component when filtered events change
  useEffect(() => {
    onFiltersChange(filteredEvents);
  }, [filteredEvents, onFiltersChange]);

  const handleFilterChange = useCallback((key: keyof UserEventFilters, value: string | string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleEventTypeToggle = useCallback((typeId: string) => {
    setFilters(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(typeId)
        ? prev.eventTypes.filter(id => id !== typeId)
        : [...prev.eventTypes, typeId]
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      name: '',
      dateFrom: '',
      dateTo: '',
      storeId: '',
      eventTypes: [],
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filters.name || filters.dateFrom || filters.dateTo || filters.storeId || filters.eventTypes.length > 0;
  }, [filters]);

  const getQuickDateRange = useCallback((range: 'week' | 'month' | 'quarter') => {
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
  }, []);

  return (
    <div className="theme-card rounded-lg mb-6">
      <div className="px-6 py-4 border-b" style={{ borderColor: "var(--theme-border-soft)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-theme-foreground">Filter Events</h3>
            <span className="theme-chip inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
              {filteredEvents.length} of {events.length} events
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="theme-button-ghost rounded-md px-2 py-1 text-sm"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="theme-button-ghost flex items-center space-x-1 rounded-md px-2 py-1"
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
            <label className="block text-sm font-medium text-theme-foreground mb-2">Event Name</label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              placeholder="Search by event name..."
              className="theme-input w-full px-3 py-2 rounded-md"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-theme-foreground mb-2">Date Range</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs text-theme-muted mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="theme-input w-full px-3 py-2 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs text-theme-muted mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="theme-input w-full px-3 py-2 rounded-md"
                />
              </div>
            </div>
            
            {/* Quick Date Range Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => getQuickDateRange('week')}
                className="theme-button-subtle px-3 py-1 text-xs rounded-md"
              >
                This Week
              </button>
              <button
                onClick={() => getQuickDateRange('month')}
                className="theme-button-subtle px-3 py-1 text-xs rounded-md"
              >
                This Month
              </button>
              <button
                onClick={() => getQuickDateRange('quarter')}
                className="theme-button-subtle px-3 py-1 text-xs rounded-md"
              >
                This Quarter
              </button>
            </div>
          </div>

          {/* Store Selection */}
          <div>
            <label className="block text-sm font-medium text-theme-foreground mb-2">Store</label>
            <select
              value={filters.storeId}
              onChange={(e) => handleFilterChange('storeId', e.target.value)}
              className="theme-input w-full px-3 py-2 rounded-md"
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
            <label className="block text-sm font-medium text-theme-foreground mb-2">Event Types</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {EVENT_TYPE_OPTIONS.map(type => (
                <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.eventTypes.includes(type.id)}
                    onChange={() => handleEventTypeToggle(type.id)}
                    className="h-4 w-4 rounded"
                    style={{ accentColor: "var(--theme-border-color)" }}
                  />
                  <span className="text-sm text-theme-muted">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t" style={{ borderColor: "var(--theme-border-soft)" }}>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-theme-foreground">Active filters:</span>
                {filters.name && (
                  <span className="theme-chip inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                    Name: {filters.name}
                  </span>
                )}
                {filters.dateFrom && (
                  <span className="theme-chip inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                    From: {filters.dateFrom}
                  </span>
                )}
                {filters.dateTo && (
                  <span className="theme-chip inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                    To: {filters.dateTo}
                  </span>
                )}
                {filters.storeId && (
                  <span className="theme-chip inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
                    Store: {stores.find(s => s.store_id === filters.storeId)?.name}
                  </span>
                )}
                {filters.eventTypes.map(typeId => {
                  const type = EVENT_TYPE_OPTIONS.find(t => t.id === typeId);
                  return type ? (
                    <span key={typeId} className="theme-chip inline-flex items-center px-2 py-1 rounded-full text-xs font-medium">
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
