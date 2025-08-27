"use client";
/*
  Public Events page ("/events").
  - Accessible without authentication
  - Shows upcoming events and tournaments with real data from Supabase
  - Event filtering capabilities for better event discovery
  - Supports URL query parameters for pre-filtering
*/
import Link from "next/link";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Event } from "@/types/event";
import { Store } from "@/types/store";
import UserEventFilters from "@/components/ui/UserEventFilters";
import EventCard from "@/components/ui/EventCard";

function EventsPageContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get initial store filter from URL query parameter
  const initialStoreId = searchParams.get('store') || '';

  useEffect(() => {
    async function fetchData() {
      const supabase = getSupabaseClient();
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch events
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



  // Group events by month
  const groupEventsByMonth = (events: Event[]) => {
    const grouped: { [key: string]: Event[] } = {};
    
    events.forEach(event => {
      const date = new Date(event.date);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(event);
    });
    
    return grouped;
  };

  const groupedEvents = groupEventsByMonth(filteredEvents);

  // Get store name for display if filtering by store
  const filteredStore = initialStoreId ? stores.find(s => s.store_id === initialStoreId) : null;

  return (
    <main className="min-h-dvh text-gray-900">
      {/* Simple header for public pages */}
      <header className="py-4 px-6 lg:px-8 border-b">
        <div className="mx-auto w-full max-w-screen-2xl flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold">← Back to Home</Link>
        </div>
      </header>
      
      <section className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-semibold text-center">Events</h1>
          <p className="mt-4 text-gray-700 text-center max-w-3xl mx-auto">
            Stay up to date with upcoming tournaments and events in the NNPL community.
          </p>
          
          {/* Store Filter Notice */}
          {filteredStore && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Showing events for <span className="font-semibold">{filteredStore.name}</span>
                <Link href="/events" className="ml-2 text-blue-600 hover:text-blue-800 underline">
                  (View all events)
                </Link>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="mt-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading events...</p>
            </div>
          ) : error ? (
            <div className="mt-12 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 inline-flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          ) : events.length > 0 ? (
            <div className="mt-12">
              {/* Event Filters */}
              <div className="mb-8">
                <UserEventFilters
                  events={events}
                  stores={stores}
                  onFiltersChange={handleFiltersChange}
                  initialFilters={{ storeId: initialStoreId }}
                />
              </div>

              {filteredEvents.length > 0 ? (
                <>
                  {Object.entries(groupedEvents).map(([month, monthEvents]) => (
                    <div key={month} className="mb-12">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-6 border-b pb-2">
                        {month}
                      </h2>
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {monthEvents.map((event) => (
                          <EventCard 
                            key={event.event_id} 
                            event={event} 
                            variant="public"
                            showActions={true}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-12 text-center">
                    <p className="text-gray-600 mb-4">
                      {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                      {filteredEvents.length !== events.length && ` (filtered from ${events.length} total)`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Events are sorted by date from closest to farthest. Check back regularly for new events!
                    </p>
                  </div>
                </>
              ) : (
                <div className="mt-12 text-center">
                  <p className="text-gray-600">No events found matching your filters.</p>
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your search criteria or check back later for new events and tournaments.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-12 text-center">
              <p className="text-gray-600">No upcoming events found.</p>
              <p className="text-sm text-gray-500 mt-2">Check back later for new events and tournaments.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh text-gray-900">
        <header className="py-4 px-6 lg:px-8 border-b">
          <div className="mx-auto w-full max-w-screen-2xl flex items-center justify-between">
            <div className="text-lg font-semibold">← Back to Home</div>
          </div>
        </header>
        <section className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-16">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-semibold text-center">Events</h1>
            <div className="mt-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading events...</p>
            </div>
          </div>
        </section>
      </main>
    }>
      <EventsPageContent />
    </Suspense>
  );
}
