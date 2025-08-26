"use client";
/*
  StoreManagement component - Main component for managing stores in admin dashboard.
  - Handles CRUD operations for stores
  - Manages state between StoreForm and StoreList
  - Integrates with Supabase for data persistence
*/

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Store, StoreFormData, CreateStoreData, UpdateStoreData } from '@/types/store';
import StoreForm from './StoreForm';
import StoreList from './StoreList';

type ViewMode = 'list' | 'add' | 'edit';

export default function StoreManagement() {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load stores on component mount
  useEffect(() => {
    loadStores();
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

  const loadStores = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = getSupabaseClient();
      const { data, error: fetchError } = await supabase
        .from('Stores')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setStores(data || []);
    } catch (err) {
      console.error('Error loading stores:', err);
      setError('Failed to load stores. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStore = async (formData: StoreFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const supabase = getSupabaseClient();
      const createData: CreateStoreData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        avg_players: formData.avg_players,
        has_league: formData.has_league,
        website: formData.website.trim() || undefined,
        discord: formData.discord.trim() || undefined,
      };

      const { data, error: insertError } = await supabase
        .from('Stores')
        .insert([createData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Add the new store to the list
      setStores(prev => [...prev, data]);
      setCurrentView('list');
      setSuccessMessage(`Store "${formData.name}" has been added successfully.`);
    } catch (err) {
      console.error('Error adding store:', err);
      setError('Failed to add store. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStore = async (formData: StoreFormData) => {
    if (!selectedStore) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const supabase = getSupabaseClient();
      const updateData: UpdateStoreData = {
        store_id: selectedStore.store_id,
        name: formData.name.trim(),
        location: formData.location.trim(),
        avg_players: formData.avg_players,
        has_league: formData.has_league,
        website: formData.website.trim() || undefined,
        discord: formData.discord.trim() || undefined,
      };

      const { data, error: updateError } = await supabase
        .from('Stores')
        .update(updateData)
        .eq('store_id', selectedStore.store_id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update the store in the list
      setStores(prev => 
        prev.map(store => 
          store.store_id === selectedStore.store_id ? data : store
        )
      );
      setCurrentView('list');
      setSelectedStore(null);
      setSuccessMessage(`Store "${formData.name}" has been updated successfully.`);
    } catch (err) {
      console.error('Error updating store:', err);
      setError('Failed to update store. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    try {
      setError(null);
      
      const supabase = getSupabaseClient();
      const { error: deleteError } = await supabase
        .from('Stores')
        .delete()
        .eq('store_id', storeId);

      if (deleteError) {
        throw deleteError;
      }

      // Remove the store from the list
      const deletedStore = stores.find(store => store.store_id === storeId);
      setStores(prev => prev.filter(store => store.store_id !== storeId));
      setSuccessMessage(`Store "${deletedStore?.name}" has been deleted successfully.`);
    } catch (err) {
      console.error('Error deleting store:', err);
      setError('Failed to delete store. Please try again.');
    }
  };

  const handleEditStore = (store: Store) => {
    setSelectedStore(store);
    setCurrentView('edit');
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedStore(null);
  };

  const handleFormSubmit = async (formData: StoreFormData) => {
    if (currentView === 'add') {
      await handleAddStore(formData);
    } else if (currentView === 'edit') {
      await handleUpdateStore(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Store Management</h2>
          <p className="text-gray-600 mt-1">
            Manage game stores and their information
          </p>
        </div>
        
        {currentView === 'list' && (
          <button
            onClick={() => setCurrentView('add')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Add New Store
          </button>
        )}
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

      {/* Content */}
      {currentView === 'list' && (
        <StoreList
          stores={stores}
          onEdit={handleEditStore}
          onDelete={handleDeleteStore}
          isLoading={isLoading}
        />
      )}

      {(currentView === 'add' || currentView === 'edit') && (
        <StoreForm
          store={selectedStore}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
