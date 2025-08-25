/*
  Protected Events page ("/events" - authenticated users).
  - Shows upcoming events and tournaments with real data from Supabase
  - Additional features: event registration, personal calendar, notifications
*/
"use client";
import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Event } from "@/types/event";

export default function EventsPage() {
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'registered' | 'history'>('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      const supabase = getSupabaseClient();
      
      try {
        setLoading(true);
        setError(null);
        
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
        } else {
          setEvents(eventsData || []);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get event type label and color
  const getEventTypeInfo = (event: Event) => {
    if (event.is_prerelease) return { label: 'Prerelease', color: 'bg-purple-100 text-purple-800' };
    if (event.is_cup) return { label: 'Cup', color: 'bg-blue-100 text-blue-800' };
    if (event.is_challenge) return { label: 'Challenge', color: 'bg-green-100 text-green-800' };
    if (event.is_weekly) return { label: 'Weekly', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Event', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Events</h1>
        <p className="mt-2 text-gray-600">Manage your tournament participation and stay updated on upcoming events.</p>
      </div>

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
          ) : events.length > 0 ? (
            events.map((event) => {
              const eventType = getEventTypeInfo(event);
              return (
                <div key={event.event_id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${eventType.color}`}>
                          {eventType.label}
                        </span>
                        <span className="text-sm text-gray-500">{formatDate(event.date)}</span>
                      </div>
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                      {event.store && (
                        <p className="text-gray-600 mt-1">
                          {event.store.name} • {event.store.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                      Register
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50">
                      Add to Calendar
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50">
                      View Details
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No upcoming events found.</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for new tournaments and events.</p>
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
        <div className="text-center py-8">
          <p className="text-gray-500">No event history yet. Participate in tournaments to see your results here.</p>
        </div>
      )}
    </main>
  );
}
