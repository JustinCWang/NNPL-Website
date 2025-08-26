"use client";
/*
  StoreForm component for adding and editing stores in the admin dashboard.
  - Handles both create and update operations
  - Form validation and error handling
  - Clean, accessible form design
*/

import { useState, useEffect } from 'react';
import { Store, StoreFormData } from '@/types/store';

interface StoreFormProps {
  store?: Store | null;
  onSubmit: (data: StoreFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function StoreForm({ store, onSubmit, onCancel, isLoading = false }: StoreFormProps) {
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    location: '',
    avg_players: 0,
    has_league: false,
    website: '',
    discord: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof StoreFormData, string>>>({});

  // Populate form with existing store data when editing
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        location: store.location,
        avg_players: store.avg_players,
        has_league: store.has_league,
        website: store.website || '',
        discord: store.discord || '',
      });
    }
  }, [store]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof StoreFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Store name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (formData.avg_players < 0) {
      newErrors.avg_players = 'Average players cannot be negative';
    }

    // Validate website URL format if provided
    if (formData.website.trim() && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    // Validate Discord invite link format if provided
    if (formData.discord.trim() && !isValidDiscordInvite(formData.discord)) {
      newErrors.discord = 'Please enter a valid Discord invite link';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const isValidDiscordInvite = (discord: string): boolean => {
    // Accept any valid URL format for Discord links
    // Discord has multiple link formats and sometimes redirect links are used
    try {
      new URL(discord.startsWith('http') ? discord : `https://${discord}`);
      return true;
    } catch {
      return false;
    }
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

  const handleInputChange = (field: keyof StoreFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {store ? 'Edit Store' : 'Add New Store'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Store Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Store Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter store name"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location *
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.location ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter store address or location"
            disabled={isLoading}
          />
          {errors.location && (
            <p className="text-red-600 text-sm mt-1">{errors.location}</p>
          )}
        </div>

        {/* Average Players */}
        <div>
          <label htmlFor="avg_players" className="block text-sm font-medium text-gray-700 mb-1">
            Average Players
          </label>
          <input
            type="number"
            id="avg_players"
            min="0"
            value={formData.avg_players}
            onChange={(e) => handleInputChange('avg_players', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.avg_players ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
            disabled={isLoading}
          />
          {errors.avg_players && (
            <p className="text-red-600 text-sm mt-1">{errors.avg_players}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            Typical number of players that attend events at this store
          </p>
        </div>

        {/* Has League */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="has_league"
            checked={formData.has_league}
            onChange={(e) => handleInputChange('has_league', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="has_league" className="ml-2 block text-sm text-gray-700">
            Store has an organized league
          </label>
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            type="url"
            id="website"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.website ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://example.com"
            disabled={isLoading}
          />
          {errors.website && (
            <p className="text-red-600 text-sm mt-1">{errors.website}</p>
          )}
        </div>

        {/* Discord */}
        <div>
          <label htmlFor="discord" className="block text-sm font-medium text-gray-700 mb-1">
            Discord Invite Link
          </label>
          <input
            type="url"
            id="discord"
            value={formData.discord}
            onChange={(e) => handleInputChange('discord', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.discord ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://discord.gg/example"
            disabled={isLoading}
          />
          {errors.discord && (
            <p className="text-red-600 text-sm mt-1">{errors.discord}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : store ? 'Update Store' : 'Add Store'}
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
