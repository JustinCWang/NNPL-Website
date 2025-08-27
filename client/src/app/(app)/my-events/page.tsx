/*
  Protected Events page ("/events" - authenticated users).
  - Shows upcoming events and tournaments with real data from Supabase
  - Additional features: event registration, personal calendar, notifications
  - Event filtering capabilities for better event discovery
  - Supports URL query parameters for pre-filtering
*/
"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Event } from "@/types/event";
import { Store } from "@/types/store";
import UserEventFilters from "@/components/ui/UserEventFilters";
import EventCard from "@/components/ui/EventCard";

export default function EventsPage() {
  const searchParams = useSearchParams();
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'registered' | 'history'>('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get initial store filter from URL query parameter
  const initialStoreId = searchParams.get('store') || '';

  // Fetch events and stores data
  useEffect(() => {
    async function fetchData() {
      const supabase = getSupabaseClient();
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch upcoming events
        const { data: eventsData, error: eventsError } = await supabase
          .from('Events')
          .select(`
            *,
            store:Stores(name, location)
          `)
          .gte('date', new Date().toISOString().split('T')[0]) // Only future events
          .order('date', { ascending: true });

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          setError('Failed to load events. Please try again later.');
          return;
        }

        // Fetch past events for history tab
        const { data: pastEventsData, error: pastEventsError } = await supabase
          .from('Events')
          .select(`
            *,
            store:Stores(name, location)
          `)
          .lt('date', new Date().toISOString().split('T')[0]) // Only past events
          .order('date', { ascending: false });

        if (pastEventsError) {
          console.error('Error fetching past events:', pastEventsError);
          // Don't fail the whole page if past events fail to load
        }

        // Fetch stores for filtering
        const { data: storesData, error: storesError } = await supabase
          .from('Stores')
          .select('*')
          .order('name');

        if (storesError) {
          console.error('Error fetching stores:', storesError);
          // Don't fail the whole page if stores fail to load
        }

        setEvents(eventsData || []);
        setFilteredEvents(eventsData || []);
        setPastEvents(pastEventsData || []);
        setStores(storesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handle filtered events from the UserEventFilters component
  const handleFiltersChange = useCallback((filtered: Event[]) => {
    setFilteredEvents(filtered);
  }, []);



  // Render event card component
  const renderEventCard = (event: Event, showActions: boolean = true) => {
    return (
      <EventCard 
        key={event.event_id} 
        event={event} 
        variant="authenticated"
        showActions={showActions}
      />
    );
  };

  // Get store name for display if filtering by store
  const filteredStore = initialStoreId ? stores.find(s => s.store_id === initialStoreId) : null;

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Events</h1>
        <p className="mt-2 text-gray-600">Manage your tournament participation and stay updated on upcoming events.</p>
      </div>

      {/* Store Filter Notice */}
      {filteredStore && (
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Showing events for <span className="font-semibold">{filteredStore.name}</span>
            <a href="/my-events" className="ml-2 text-blue-600 hover:text-blue-800 underline">
              (View all events)
            </a>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('upcoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'upcoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setSelectedTab('registered')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'registered'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Registrations
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Event History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'upcoming' && (
        <div className="space-y-4">
          {/* Event Filters */}
          <UserEventFilters
            events={events}
            stores={stores}
            onFiltersChange={handleFiltersChange}
            initialFilters={{ storeId: initialStoreId }}
          />

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading events...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event) => renderEventCard(event, true))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No events found matching your filters.</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria or check back later for new tournaments and events.</p>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'registered' && (
        <div className="text-center py-8">
          <p className="text-gray-500">You haven&apos;t registered for any events yet.</p>
          <button 
            onClick={() => setSelectedTab('upcoming')}
            className="mt-2 text-blue-600 hover:text-blue-700"
          >
            Browse upcoming events →
          </button>
        </div>
      )}

      {selectedTab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading event history...</p>
            </div>
          ) : pastEvents.length > 0 ? (
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Past Events</h3>
                <p className="text-sm text-gray-600">Events you&apos;ve participated in or missed.</p>
              </div>
              {pastEvents.map((event) => renderEventCard(event, false))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No event history yet. Participate in tournaments to see your results here.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
