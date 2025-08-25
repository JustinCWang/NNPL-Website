"use client";
/*
  EventManagement component - Main component for managing events in admin dashboard.
  - Handles CRUD operations for events
  - Manages state between EventForm and EventList
  - Integrates with Supabase for data persistence
  - Loads stores for the dropdown selection
*/

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Event, EventFormData, CreateEventData, UpdateEventData } from '@/types/event';
import { Store } from '@/types/store';
import EventForm from './EventForm';
import EventList from './EventList';

type ViewMode = 'list' | 'add' | 'edit';

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load events and stores on component mount
  useEffect(() => {
    Promise.all([loadEvents(), loadStores()]);
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
    }
  };

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = getSupabaseClient();
      const { data, error: fetchError } = await supabase
        .from('Events')
        .select(`
          *,
          store:Stores(name, location)
        `)
        .order('date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setEvents(data || []);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = async (formData: EventFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const supabase = getSupabaseClient();
      const createData: CreateEventData = {
        name: formData.name.trim(),
        date: formData.date,
        is_weekly: formData.is_weekly,
        is_cup: formData.is_cup,
        is_challenge: formData.is_challenge,
        is_prerelease: formData.is_prerelease,
        store_id: formData.store_id,
      };

      const { data, error: insertError } = await supabase
        .from('Events')
        .insert([createData])
        .select(`
          *,
          store:Stores(name, location)
        `)
        .single();

      if (insertError) {
        throw insertError;
      }

      // Add the new event to the list
      setEvents(prev => [...prev, data]);
      setCurrentView('list');
      setSuccessMessage(`Event "${formData.name}" has been added successfully.`);
    } catch (err) {
      console.error('Error adding event:', err);
      setError('Failed to add event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEvent = async (formData: EventFormData) => {
    if (!selectedEvent) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const supabase = getSupabaseClient();
      const updateData: UpdateEventData = {
        event_id: selectedEvent.event_id,
        name: formData.name.trim(),
        date: formData.date,
        is_weekly: formData.is_weekly,
        is_cup: formData.is_cup,
        is_challenge: formData.is_challenge,
        is_prerelease: formData.is_prerelease,
        store_id: formData.store_id,
      };

      const { data, error: updateError } = await supabase
        .from('Events')
        .update(updateData)
        .eq('event_id', selectedEvent.event_id)
        .select(`
          *,
          store:Stores(name, location)
        `)
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update the event in the list
      setEvents(prev => 
        prev.map(event => 
          event.event_id === selectedEvent.event_id ? data : event
        )
      );
      setCurrentView('list');
      setSelectedEvent(null);
      setSuccessMessage(`Event "${formData.name}" has been updated successfully.`);
    } catch (err) {
      console.error('Error updating event:', err);
      setError('Failed to update event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setError(null);
      
      const supabase = getSupabaseClient();
      const { error: deleteError } = await supabase
        .from('Events')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) {
        throw deleteError;
      }

      // Remove the event from the list
      const deletedEvent = events.find(event => event.event_id === eventId);
      setEvents(prev => prev.filter(event => event.event_id !== eventId));
      setSuccessMessage(`Event "${deletedEvent?.name}" has been deleted successfully.`);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again.');
    }
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setCurrentView('edit');
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedEvent(null);
  };

  const handleFormSubmit = async (formData: EventFormData) => {
    if (currentView === 'add') {
      await handleAddEvent(formData);
    } else if (currentView === 'edit') {
      await handleUpdateEvent(formData);
    }
  };

  // Check if we have stores available
  const hasStores = stores.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Event Management</h2>
          <p className="text-gray-600 mt-1">
            Manage events and tournaments across all stores
          </p>
        </div>
        
        {currentView === 'list' && (
          <button
            onClick={() => setCurrentView('add')}
            disabled={!hasStores}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!hasStores ? 'Please add stores first before creating events' : ''}
          >
            Add New Event
          </button>
        )}
      </div>

      {/* No stores warning */}
      {!hasStores && !isLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No stores available</h3>
              <div className="mt-1 text-sm text-yellow-700">
                You need to add at least one store before you can create events. 
                <button 
                  onClick={() => window.location.hash = 'stores'} 
                  className="font-medium underline ml-1"
                >
                  Go to Store Management
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <EventList
          events={events}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          isLoading={isLoading}
        />
      )}

      {(currentView === 'add' || currentView === 'edit') && (
        <EventForm
          event={selectedEvent}
          stores={stores}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
