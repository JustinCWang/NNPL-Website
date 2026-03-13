"use client";
/*
  Protected Events page ("/my-events").
  - Shows upcoming events and tournaments with real data from Supabase
  - Additional features: event registration, personal calendar, notifications
  - Event filtering capabilities for better event discovery
  - Supports URL query parameters for pre-filtering
*/

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchLiveEventOverviews,
  fetchMyLiveEventHistory,
} from "@/lib/liveEventApi";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Event, EventRegistration } from "@/types/event";
import { LiveEventHistoryItem, LiveEventOverview } from "@/types/liveEvent";
import { Store } from "@/types/store";
import UserEventFilters from "@/components/ui/UserEventFilters";
import EventCard from "@/components/ui/EventCard";

export default function EventsPage() {
  const searchParams = useSearchParams();
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'favorites' | 'registered' | 'history'>('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [favoriteEventIds, setFavoriteEventIds] = useState<string[]>([]);
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<string[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [pendingRegistrationIds, setPendingRegistrationIds] = useState<string[]>([]);
  const [liveEventOverviews, setLiveEventOverviews] = useState<LiveEventOverview[]>([]);
  const [liveEventHistory, setLiveEventHistory] = useState<LiveEventHistoryItem[]>([]);
  const [dismissedLiveEventIds, setDismissedLiveEventIds] = useState<string[]>([]);
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

        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          setError('You must be logged in to manage your events.');
          return;
        }

        const [eventsResponse, pastEventsResponse, storesResponse, favoritesResponse, registrationsResponse] = await Promise.all([
          supabase
            .from('Events')
            .select(`
              *,
              store:Stores(name, location)
            `)
            .gte('start_at', new Date().toISOString())
            .order('start_at', { ascending: true }),
          supabase
            .from('Events')
            .select(`
              *,
              store:Stores(name, location)
            `)
            .lt('start_at', new Date().toISOString())
            .order('start_at', { ascending: false }),
          supabase
            .from('Stores')
            .select('*')
            .order('name'),
          supabase
            .from('FavoriteEvents')
            .select('event_id')
            .eq('user_id', authData.user.id),
          supabase
            .from('EventRegistrations')
            .select('event_id, created_at')
            .eq('user_id', authData.user.id),
        ]);

        const { data: eventsData, error: eventsError } = eventsResponse;
        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          setError('Failed to load events. Please try again later.');
          return;
        }

        const { data: pastEventsData, error: pastEventsError } = pastEventsResponse;
        if (pastEventsError) {
          console.error('Error fetching past events:', pastEventsError);
        }

        const { data: storesData, error: storesError } = storesResponse;
        if (storesError) {
          console.error('Error fetching stores:', storesError);
        }

        const { data: favoritesData, error: favoritesError } = favoritesResponse;
        if (favoritesError) {
          console.error('Error fetching favorite events:', favoritesError);
          setError('Failed to load favorite events. Please try again later.');
          return;
        }

        const { data: registrationsData, error: registrationsError } = registrationsResponse;
        if (registrationsError) {
          console.error('Error fetching event registrations:', registrationsError);
          setError('Failed to load your event registrations. Please try again later.');
          return;
        }

        setEvents(eventsData || []);
        setFilteredEvents(eventsData || []);
        setPastEvents(pastEventsData || []);
        setStores(storesData || []);
        setFavoriteEventIds((favoritesData || []).map((favorite) => favorite.event_id));
        const registrationRows = (registrationsData || []) as EventRegistration[];
        const registrationEventIds = registrationRows.map((registration) => registration.event_id);
        setRegisteredEventIds(registrationEventIds);

        const [liveOverviews, historyItems] = await Promise.all([
          fetchLiveEventOverviews(registrationEventIds),
          fetchMyLiveEventHistory(),
        ]);

        setLiveEventOverviews(liveOverviews);
        setLiveEventHistory(historyItems);
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

  const toggleFavoriteEvent = useCallback(async (eventId: string) => {
    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError('You must be logged in to favorite events.');
      return;
    }

    const wasFavorited = favoriteEventIds.includes(eventId);

    setPendingFavoriteIds((prev) => [...prev, eventId]);
    setFavoriteEventIds((prev) =>
      wasFavorited ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );

    try {
      if (wasFavorited) {
        const { error: deleteError } = await supabase
          .from('FavoriteEvents')
          .delete()
          .eq('user_id', authData.user.id)
          .eq('event_id', eventId);

        if (deleteError) {
          throw deleteError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('FavoriteEvents')
          .insert([{ user_id: authData.user.id, event_id: eventId }]);

        if (insertError) {
          throw insertError;
        }
      }
    } catch (favoriteError) {
      console.error('Error updating favorite event:', favoriteError);
      setFavoriteEventIds((prev) =>
        wasFavorited ? [...prev, eventId] : prev.filter((id) => id !== eventId)
      );
      setError('Failed to update favorite event. Please try again.');
    } finally {
      setPendingFavoriteIds((prev) => prev.filter((id) => id !== eventId));
    }
  }, [favoriteEventIds]);

  const toggleEventRegistration = useCallback(async (eventId: string) => {
    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      setError('You must be logged in to register for events.');
      return;
    }

    const wasRegistered = registeredEventIds.includes(eventId);

    setPendingRegistrationIds((prev) => [...prev, eventId]);
    setRegisteredEventIds((prev) =>
      wasRegistered ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );

    try {
      if (wasRegistered) {
        const { error: deleteError } = await supabase
          .from('EventRegistrations')
          .delete()
          .eq('user_id', authData.user.id)
          .eq('event_id', eventId);

        if (deleteError) {
          throw deleteError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('EventRegistrations')
          .insert([{ user_id: authData.user.id, event_id: eventId }]);

        if (insertError) {
          throw insertError;
        }
      }

      setError(null);
    } catch (registrationError) {
      console.error('Error updating event registration:', registrationError);
      setRegisteredEventIds((prev) =>
        wasRegistered ? [...prev, eventId] : prev.filter((id) => id !== eventId)
      );
      setError('Failed to update your event registration. Please try again.');
    } finally {
      setPendingRegistrationIds((prev) => prev.filter((id) => id !== eventId));
    }
  }, [registeredEventIds]);

  const favoriteUpcomingEvents = events.filter((event) => favoriteEventIds.includes(event.event_id));
  const favoritePastEvents = pastEvents.filter((event) => favoriteEventIds.includes(event.event_id));
  const registeredUpcomingEvents = events.filter((event) => registeredEventIds.includes(event.event_id));
  const registeredPastEvents = pastEvents.filter((event) => registeredEventIds.includes(event.event_id));
  const liveReadyEvents = liveEventOverviews.filter((overview) => overview.canJoin && !overview.isCompleted);
  const activePromptEvent =
    liveReadyEvents.find((overview) => !dismissedLiveEventIds.includes(overview.event.event_id)) ?? null;

  // Render event card component
  const renderEventCard = (event: Event, showActions: boolean = true) => {
    return (
      <EventCard 
        key={event.event_id} 
        event={event} 
        variant="authenticated"
        showActions={showActions}
        isFavorited={favoriteEventIds.includes(event.event_id)}
        isFavoritePending={pendingFavoriteIds.includes(event.event_id)}
        onToggleFavorite={toggleFavoriteEvent}
        isRegistered={registeredEventIds.includes(event.event_id)}
        isRegistrationPending={pendingRegistrationIds.includes(event.event_id)}
        onToggleRegistration={toggleEventRegistration}
      />
    );
  };

  // Get store name for display if filtering by store
  const filteredStore = initialStoreId ? stores.find(s => s.store_id === initialStoreId) : null;

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-theme-foreground">Events</h1>
        <p className="mt-2 text-theme-muted">Manage your tournament participation and stay updated on upcoming events.</p>
      </div>

      {/* Store Filter Notice */}
      {filteredStore && (
        <div className="mb-6">
          <div className="theme-chip inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Showing events for <span className="font-semibold">{filteredStore.name}</span>
            <a href="/my-events" className="ml-2 text-theme underline hover:opacity-80">
              (View all events)
            </a>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b mb-6" style={{ borderColor: "var(--theme-border-soft)" }}>
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('upcoming')}
            className={`py-2 px-1 font-medium text-sm ${selectedTab === 'upcoming' ? 'theme-tab-active' : 'theme-tab'}`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setSelectedTab('favorites')}
            className={`py-2 px-1 font-medium text-sm ${selectedTab === 'favorites' ? 'theme-tab-active' : 'theme-tab'}`}
          >
            Favorite Events
          </button>
          <button
            onClick={() => setSelectedTab('registered')}
            className={`py-2 px-1 font-medium text-sm ${selectedTab === 'registered' ? 'theme-tab-active' : 'theme-tab'}`}
          >
            My Registrations
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`py-2 px-1 font-medium text-sm ${selectedTab === 'history' ? 'theme-tab-active' : 'theme-tab'}`}
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
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-theme" style={{ borderTopColor: "transparent" }}></div>
              <p className="mt-2 text-theme-muted">Loading events...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="theme-button mt-4 px-4 py-2 rounded-md text-sm"
              >
                Try Again
              </button>
            </div>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event) => renderEventCard(event, true))
          ) : (
            <div className="text-center py-8">
              <p className="text-theme-muted">No events found matching your filters.</p>
              <p className="text-sm text-theme-muted mt-1">Try adjusting your search criteria or check back later for new tournaments and events.</p>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'favorites' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-theme" style={{ borderTopColor: "transparent" }}></div>
              <p className="mt-2 text-theme-muted">Loading favorite events...</p>
            </div>
          ) : favoriteUpcomingEvents.length > 0 || favoritePastEvents.length > 0 ? (
            <>
              {favoriteUpcomingEvents.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-theme-foreground mb-2">Upcoming Favorites</h3>
                    <p className="text-sm text-theme-muted">Events you have saved for quick access.</p>
                  </div>
                  {favoriteUpcomingEvents.map((event) => renderEventCard(event, true))}
                </div>
              )}
              {favoritePastEvents.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-theme-foreground mb-2">Past Favorites</h3>
                    <p className="text-sm text-theme-muted">Previously saved events remain here until you remove them.</p>
                  </div>
                  {favoritePastEvents.map((event) => renderEventCard(event, true))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-theme-muted">You haven&apos;t favorited any events yet.</p>
              <button 
                onClick={() => setSelectedTab('upcoming')}
                className="theme-button-ghost mt-2 rounded-md px-2 py-1"
              >
                Browse upcoming events →
              </button>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'registered' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-theme" style={{ borderTopColor: "transparent" }}></div>
              <p className="mt-2 text-theme-muted">Loading your registrations...</p>
            </div>
          ) : liveReadyEvents.length > 0 || registeredUpcomingEvents.length > 0 || registeredPastEvents.length > 0 ? (
            <>
              {liveReadyEvents.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-theme-foreground mb-2">Live Right Now</h3>
                    <p className="text-sm text-theme-muted">These registered events are ready for deck selection, round tracking, and live reporting.</p>
                  </div>
                  <div className="grid gap-4">
                    {liveReadyEvents.map((overview) => (
                      <div
                        key={overview.event.event_id}
                        className="theme-card rounded-lg p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-lg font-semibold text-theme-foreground">{overview.event.name}</h4>
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                              {overview.session?.status === 'active' ? 'Live now' : 'Ready to join'}
                            </span>
                          </div>
                          <p className="text-sm text-theme-muted">
                            {overview.event.store?.name ? `${overview.event.store.name} · ` : ''}
                            {overview.session
                              ? `Round ${overview.session.current_round} of ${overview.session.total_rounds}`
                              : 'Waiting for the first attendee to join'}
                          </p>
                        </div>
                        <Link
                          href={`/my-events/${overview.event.event_id}/live`}
                          className="theme-button inline-flex rounded-md px-4 py-2 text-sm"
                        >
                          Enter Live Room
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {registeredUpcomingEvents.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-theme-foreground mb-2">Upcoming Registrations</h3>
                    <p className="text-sm text-theme-muted">Events you&apos;ve marked that you plan to attend.</p>
                  </div>
                  {registeredUpcomingEvents.map((event) => renderEventCard(event, true))}
                </div>
              )}
              {registeredPastEvents.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-theme-foreground mb-2">Past Registrations</h3>
                    <p className="text-sm text-theme-muted">Past events you had previously registered interest in.</p>
                  </div>
                  {registeredPastEvents.map((event) => renderEventCard(event, false))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-theme-muted">You haven&apos;t registered for any events yet.</p>
              <button 
                onClick={() => setSelectedTab('upcoming')}
                className="theme-button-ghost mt-2 rounded-md px-2 py-1"
              >
                Browse upcoming events →
              </button>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-theme" style={{ borderTopColor: "transparent" }}></div>
              <p className="mt-2 text-theme-muted">Loading event history...</p>
            </div>
          ) : pastEvents.length > 0 || liveEventHistory.length > 0 ? (
            <div className="space-y-6">
              {liveEventHistory.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-theme-foreground mb-2">Tracked Live Event Results</h3>
                    <p className="text-sm text-theme-muted">Your completed live events, records, and per-event statistics.</p>
                  </div>
                  <div className="grid gap-4">
                    {liveEventHistory.map((item) => (
                      <div key={item.summary.session_id} className="theme-card rounded-lg p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-lg font-semibold text-theme-foreground">{item.event.name}</h4>
                              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                                {item.summary.final_wins}-{item.summary.final_losses}-{item.summary.final_ties}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-theme-muted">
                              <span>{item.summary.rounds_played} rounds</span>
                              <span>
                                Games {item.summary.total_games_won}-{item.summary.total_games_lost}-{item.summary.total_games_tied}
                              </span>
                              <span>Went first {item.summary.went_first_count} times</span>
                              <span>{item.deckName ? `Deck: ${item.deckName}` : 'Deck tracked in session'}</span>
                            </div>
                            <p className="text-sm text-theme-muted">
                              Avg round duration {item.summary.average_round_duration_minutes ?? 'N/A'} min ·
                              {' '}App opponents {item.summary.app_user_rounds} · Other players {item.summary.other_player_rounds}
                            </p>
                          </div>
                          <Link
                            href={`/my-events/${item.event.event_id}/live`}
                            className="theme-button-ghost inline-flex rounded-md px-4 py-2 text-sm"
                          >
                            View Live Session
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-theme-foreground mb-2">Past Events</h3>
                    <p className="text-sm text-theme-muted">Events you&apos;ve participated in or missed.</p>
                  </div>
                  {pastEvents.map((event) => renderEventCard(event, false))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-theme-muted">No event history yet. Participate in tournaments to see your results here.</p>
            </div>
          )}
        </div>
      )}

      {activePromptEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="theme-overlay absolute inset-0"></div>
          <div className="theme-card relative z-10 w-full max-w-lg rounded-xl p-6">
            <button
              type="button"
              onClick={() =>
                setDismissedLiveEventIds((prev) => [...prev, activePromptEvent.event.event_id])
              }
              className="theme-button-ghost absolute right-3 top-3 rounded-full px-3 py-1 text-sm"
            >
              Close
            </button>
            <div className="space-y-3">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-800">
                Event Starting
              </span>
              <h2 className="text-2xl font-semibold text-theme-foreground">{activePromptEvent.event.name}</h2>
              <p className="text-theme-muted">
                Your registered event is ready for live tracking. Join the live room to choose your deck, vote on the round timer, and report results round by round.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href={`/my-events/${activePromptEvent.event.event_id}/live`}
                  className="theme-button inline-flex rounded-md px-4 py-2 text-sm"
                >
                  Open Live Room
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    setDismissedLiveEventIds((prev) => [...prev, activePromptEvent.event.event_id])
                  }
                  className="theme-button-ghost rounded-md px-4 py-2 text-sm"
                >
                  Remind Me Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
