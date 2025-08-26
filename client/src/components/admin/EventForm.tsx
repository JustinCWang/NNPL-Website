"use client";
/*
  EventForm component for adding and editing events in the admin dashboard.
  - Handles both create and update operations
  - Form validation and error handling
  - Store selection dropdown
  - User selection dropdown for created_by field
  - Event type checkboxes with descriptions
*/

import { useState, useEffect } from 'react';
import { Event, EventFormData } from '@/types/event';
import { Store } from '@/types/store';
import { User } from '@/types/user';
import { isDatePast } from '@/lib/dateUtils';

interface EventFormProps {
  event?: Event | null;
  stores: Store[];
  users: User[];
  currentUserId?: string;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EventForm({ event, stores, users, currentUserId, onSubmit, onCancel, isLoading = false }: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    date: '',
    name: '',
    is_weekly: false,
    is_cup: false,
    is_challenge: false,
    is_prerelease: false,
    store_id: '',
    created_by: currentUserId || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

  // Populate form with existing event data when editing
  useEffect(() => {
    if (event) {
      setFormData({
        date: event.date.split('T')[0], // Convert to YYYY-MM-DD format for input
        name: event.name,
        is_weekly: event.is_weekly,
        is_cup: event.is_cup,
        is_challenge: event.is_challenge,
        is_prerelease: event.is_prerelease,
        store_id: event.store_id,
        created_by: event.created_by,
      });
    }
  }, [event]);

  // Set default created_by to current user when creating new event
  useEffect(() => {
    if (!event && currentUserId && !formData.created_by) {
      setFormData(prev => ({
        ...prev,
        created_by: currentUserId
      }));
    }
  }, [currentUserId, event, formData.created_by]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    }

    if (!formData.date) {
      newErrors.date = 'Event date is required';
    } else {
      if (isDatePast(formData.date)) {
        newErrors.date = 'Event date cannot be in the past';
      }
    }

    if (!formData.store_id) {
      newErrors.store_id = 'Please select a store';
    }

    // Check that at least one event type is selected
    const hasEventType = formData.is_weekly || formData.is_cup || formData.is_challenge || formData.is_prerelease;
    if (!hasEventType) {
      newErrors.is_weekly = 'Please select at least one event type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user makes changes
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Clear event type error when any checkbox is selected
    if (['is_weekly', 'is_cup', 'is_challenge', 'is_prerelease'].includes(field) && value === true) {
      setErrors(prev => ({
        ...prev,
        is_weekly: undefined
      }));
    }
  };

  const getSelectedStore = () => {
    return stores.find(store => store.store_id === formData.store_id);
  };

  const getSelectedUser = () => {
    return users.find(user => user.user_id === formData.created_by);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {event ? 'Edit Event' : 'Add New Event'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Event Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter event name"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Event Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Event Date *
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.date && (
            <p className="text-red-600 text-sm mt-1">{errors.date}</p>
          )}
        </div>

        {/* Store Selection */}
        <div>
          <label htmlFor="store_id" className="block text-sm font-medium text-gray-700 mb-1">
            Store Location *
          </label>
          <select
            id="store_id"
            value={formData.store_id}
            onChange={(e) => handleInputChange('store_id', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.store_id ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          >
            <option value="">Select a store</option>
            {stores.map((store) => (
              <option key={store.store_id} value={store.store_id}>
                {store.name} - {store.location}
              </option>
            ))}
          </select>
          {errors.store_id && (
            <p className="text-red-600 text-sm mt-1">{errors.store_id}</p>
          )}
          {formData.store_id && getSelectedStore() && (
            <p className="text-gray-500 text-sm mt-1">
              Average players: {getSelectedStore()?.avg_players} | 
              League: {getSelectedStore()?.has_league ? 'Yes' : 'No'}
            </p>
          )}
        </div>

        {/* Creator Selection */}
        <div>
          <label htmlFor="created_by" className="block text-sm font-medium text-gray-700 mb-1">
            Event Creator
          </label>
          <select
            id="created_by"
            value={formData.created_by || ''}
            onChange={(e) => handleInputChange('created_by', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="">Select event creator</option>
            {users.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.username} ({user.email}) - {user.role}
              </option>
            ))}
          </select>
          {formData.created_by && getSelectedUser() && (
            <p className="text-gray-500 text-sm mt-1">
              Role: {getSelectedUser()?.role} | 
              Joined: {new Date(getSelectedUser()?.date_joined || '').toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Event Types */}
        <div>
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-3">
              Event Type * (select at least one)
            </legend>
            <div className="space-y-3">
              {/* Weekly Event */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="is_weekly"
                  checked={formData.is_weekly}
                  onChange={(e) => handleInputChange('is_weekly', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  disabled={isLoading}
                />
                <div className="ml-3">
                  <label htmlFor="is_weekly" className="text-sm font-medium text-gray-700">
                    Weekly Event
                  </label>
                  <p className="text-sm text-gray-500">Regular weekly tournament or league play</p>
                </div>
              </div>

              {/* Cup Event */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="is_cup"
                  checked={formData.is_cup}
                  onChange={(e) => handleInputChange('is_cup', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  disabled={isLoading}
                />
                <div className="ml-3">
                  <label htmlFor="is_cup" className="text-sm font-medium text-gray-700">
                    League Cup Tournament
                  </label>
                  <p className="text-sm text-gray-500">Official Pokémon League tournament with CP points + Playmat</p>
                </div>
              </div>

              {/* Challenge Event */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="is_challenge"
                  checked={formData.is_challenge}
                  onChange={(e) => handleInputChange('is_challenge', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  disabled={isLoading}
                />
                <div className="ml-3">
                  <label htmlFor="is_challenge" className="text-sm font-medium text-gray-700">
                    League Challenge Tournament
                  </label>
                  <p className="text-sm text-gray-500">Official Pokémon League tournament with CP points</p>
                </div>
              </div>

              {/* Prerelease Event */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="is_prerelease"
                  checked={formData.is_prerelease}
                  onChange={(e) => handleInputChange('is_prerelease', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  disabled={isLoading}
                />
                <div className="ml-3">
                  <label htmlFor="is_prerelease" className="text-sm font-medium text-gray-700">
                    Prerelease Tournament
                  </label>
                  <p className="text-sm text-gray-500">Official Pokémon tournament with the newest set</p>
                </div>
              </div>
            </div>
            {errors.is_weekly && (
              <p className="text-red-600 text-sm mt-2">{errors.is_weekly}</p>
            )}
          </fieldset>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : event ? 'Update Event' : 'Add Event'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}