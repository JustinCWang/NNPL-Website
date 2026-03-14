"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMyDecklists } from "@/lib/decklistApi";
import { formatDisplayDate, formatDisplayTime } from "@/lib/dateUtils";
import { fetchLiveEventOverviews, fetchMyLiveEventHistory } from "@/lib/liveEventApi";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { DecklistSummary } from "@/types/decklist";
import type { Event } from "@/types/event";
import type { LiveEventHistoryItem, LiveEventOverview } from "@/types/liveEvent";
import type { Store } from "@/types/store";

type DashboardDeckPerformance = {
  deckId: string | null;
  deckName: string;
  roundsPlayed: number;
  sessionsPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  averageRoundDurationMinutes: number | null;
  winRate: number;
};

function formatRecord(wins: number, losses: number, ties: number): string {
  return `${wins}-${losses}-${ties}`;
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatAverageMinutes(value: number | null): string {
  if (value === null) {
    return "N/A";
  }

  return `${value.toFixed(1)}m`;
}

function getEventTypeLabel(event: Event): string {
  if (event.is_cup) {
    return "Cup";
  }

  if (event.is_challenge) {
    return "Challenge";
  }

  if (event.is_prerelease) {
    return "Prerelease";
  }

  if (event.is_weekly) {
    return "Weekly";
  }

  return "Event";
}

function getLiveEventCta(overview: LiveEventOverview | null): { label: string; href: string } | null {
  if (!overview?.session) {
    return null;
  }

  if (overview.canReconnect) {
    return {
      label: "Reconnect Live Room",
      href: `/my-events/${overview.event.event_id}/live`,
    };
  }

  if (overview.canJoin || overview.isLive) {
    return {
      label: "Open Live Room",
      href: `/my-events/${overview.event.event_id}/live`,
    };
  }

  return null;
}

function aggregateDeckPerformance(historyItems: LiveEventHistoryItem[]): DashboardDeckPerformance[] {
  const deckMap = new Map<string, DashboardDeckPerformance & { durationWeight: number }>();

  for (const item of historyItems) {
    const deckId = item.summary.deck_id ?? null;
    const deckName = item.deckName ?? "Untracked Deck";
    const key = deckId ?? `untracked:${deckName}`;
    const existing = deckMap.get(key);
    const roundsPlayed = item.summary.rounds_played;
    const averageRoundDurationMinutes = item.summary.average_round_duration_minutes;

    const next = existing ?? {
      deckId,
      deckName,
      roundsPlayed: 0,
      sessionsPlayed: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      averageRoundDurationMinutes: null,
      durationWeight: 0,
      winRate: 0,
    };

    next.roundsPlayed += roundsPlayed;
    next.sessionsPlayed += 1;
    next.wins += item.summary.final_wins;
    next.losses += item.summary.final_losses;
    next.ties += item.summary.final_ties;

    if (averageRoundDurationMinutes !== null && roundsPlayed > 0) {
      const nextDurationWeight = next.durationWeight + roundsPlayed;
      const currentDurationTotal = (next.averageRoundDurationMinutes ?? 0) * next.durationWeight;
      const addedDurationTotal = averageRoundDurationMinutes * roundsPlayed;

      next.averageRoundDurationMinutes = (currentDurationTotal + addedDurationTotal) / nextDurationWeight;
      next.durationWeight = nextDurationWeight;
    }

    deckMap.set(key, next);
  }

  return [...deckMap.values()]
    .map((item) => ({
      deckId: item.deckId,
      deckName: item.deckName,
      roundsPlayed: item.roundsPlayed,
      sessionsPlayed: item.sessionsPlayed,
      wins: item.wins,
      losses: item.losses,
      ties: item.ties,
      averageRoundDurationMinutes: item.averageRoundDurationMinutes,
      winRate: item.roundsPlayed > 0 ? (item.wins / item.roundsPlayed) * 100 : 0,
    }))
    .sort((left, right) => {
      if (right.roundsPlayed !== left.roundsPlayed) {
        return right.roundsPlayed - left.roundsPlayed;
      }

      return right.sessionsPlayed - left.sessionsPlayed;
    });
}

export default function HomePage() {
  const [favoriteStores, setFavoriteStores] = useState<Store[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<Event[]>([]);
  const [registeredUpcomingEvents, setRegisteredUpcomingEvents] = useState<Event[]>([]);
  const [registeredUpcomingEventIds, setRegisteredUpcomingEventIds] = useState<string[]>([]);
  const [liveEventOverviews, setLiveEventOverviews] = useState<LiveEventOverview[]>([]);
  const [myDecklists, setMyDecklists] = useState<DecklistSummary[]>([]);
  const [historyItems, setHistoryItems] = useState<LiveEventHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    const supabase = getSupabaseClient();

    try {
      setLoading(true);
      setError(null);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setError("You must be logged in to view your dashboard.");
        return;
      }

      const userId = authData.user.id;
      const [favoriteStoresResponse, favoriteEventsResponse, registrationsResponse, decklists, liveHistory] = await Promise.all([
        supabase.from("FavoriteStores").select("store_id").eq("user_id", userId),
        supabase.from("FavoriteEvents").select("event_id").eq("user_id", userId),
        supabase.from("EventRegistrations").select("event_id").eq("user_id", userId),
        fetchMyDecklists(),
        fetchMyLiveEventHistory(),
      ]);

      if (favoriteStoresResponse.error) {
        throw favoriteStoresResponse.error;
      }

      if (favoriteEventsResponse.error) {
        throw favoriteEventsResponse.error;
      }

      if (registrationsResponse.error) {
        throw registrationsResponse.error;
      }

      const favoriteStoreIds = (favoriteStoresResponse.data ?? []).map((item) => item.store_id as string);
      const favoriteEventIds = (favoriteEventsResponse.data ?? []).map((item) => item.event_id as string);
      const registrationEventIds = (registrationsResponse.data ?? []).map((item) => item.event_id as string);
      const eventIdsToFetch = [...new Set([...favoriteEventIds, ...registrationEventIds])];

      const nowIso = new Date().toISOString();
      const [storesResponse, eventsResponse, liveOverviews] = await Promise.all([
        favoriteStoreIds.length > 0
          ? supabase.from("Stores").select("*").in("store_id", favoriteStoreIds).order("name")
          : Promise.resolve({ data: [], error: null }),
        eventIdsToFetch.length > 0
          ? supabase
              .from("Events")
              .select(`
                *,
                store:Stores(name, location)
              `)
              .in("event_id", eventIdsToFetch)
          : Promise.resolve({ data: [], error: null }),
        registrationEventIds.length > 0 ? fetchLiveEventOverviews(registrationEventIds) : Promise.resolve([]),
      ]);

      if (storesResponse.error) {
        throw storesResponse.error;
      }

      if (eventsResponse.error) {
        throw eventsResponse.error;
      }

      const events = (eventsResponse.data ?? []) as Event[];
      const eventsById = new Map(events.map((event) => [event.event_id, event]));
      const favoriteEventCards = favoriteEventIds
        .map((eventId) => eventsById.get(eventId) ?? null)
        .filter((event): event is Event => event !== null)
        .sort((left, right) => new Date(left.start_at).getTime() - new Date(right.start_at).getTime());
      const upcomingRegistered = registrationEventIds
        .map((eventId) => eventsById.get(eventId) ?? null)
        .filter((event): event is Event => event !== null)
        .filter((event) => event.start_at >= nowIso)
        .sort((left, right) => new Date(left.start_at).getTime() - new Date(right.start_at).getTime());

      setFavoriteStores((storesResponse.data ?? []) as Store[]);
      setFavoriteEvents(favoriteEventCards);
      setRegisteredUpcomingEvents(upcomingRegistered);
      setRegisteredUpcomingEventIds(registrationEventIds);
      setLiveEventOverviews(liveOverviews);
      setMyDecklists(decklists);
      setHistoryItems(liveHistory);
    } catch (loadError) {
      console.error("Error loading dashboard:", loadError);
      setError("Failed to load your dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const liveOverviewByEventId = useMemo(
    () => new Map(liveEventOverviews.map((overview) => [overview.event.event_id, overview])),
    [liveEventOverviews],
  );
  const deckPerformance = useMemo(() => aggregateDeckPerformance(historyItems), [historyItems]);
  const totalRecord = useMemo(
    () =>
      historyItems.reduce(
        (accumulator, item) => ({
          wins: accumulator.wins + item.summary.final_wins,
          losses: accumulator.losses + item.summary.final_losses,
          ties: accumulator.ties + item.summary.final_ties,
          rounds: accumulator.rounds + item.summary.rounds_played,
        }),
        { wins: 0, losses: 0, ties: 0, rounds: 0 },
      ),
    [historyItems],
  );
  const weightedAverageGameLength = useMemo(() => {
    let totalMinutes = 0;
    let totalRounds = 0;

    for (const item of historyItems) {
      if (item.summary.average_round_duration_minutes === null || item.summary.rounds_played === 0) {
        continue;
      }

      totalMinutes += item.summary.average_round_duration_minutes * item.summary.rounds_played;
      totalRounds += item.summary.rounds_played;
    }

    return totalRounds > 0 ? totalMinutes / totalRounds : null;
  }, [historyItems]);
  const mostPlayedDeck = deckPerformance[0] ?? null;
  const bestPerformingDeck = [...deckPerformance]
    .filter((deck) => deck.roundsPlayed > 0)
    .sort((left, right) => {
      if (right.winRate !== left.winRate) {
        return right.winRate - left.winRate;
      }

      return right.roundsPlayed - left.roundsPlayed;
    })[0] ?? null;
  const activeLiveOverview = liveEventOverviews.find((overview) => {
    const cta = getLiveEventCta(overview);
    return cta !== null;
  }) ?? null;

  if (loading) {
    return (
      <main className="py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-theme border-t-transparent"></div>
        <p className="mt-3 text-theme-muted">Building your dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>
        <button type="button" onClick={() => void loadDashboard()} className="theme-button rounded-md px-4 py-2 text-sm">
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main className="space-y-8 text-theme-foreground">
      <section className="theme-card overflow-hidden rounded-2xl border" style={{ borderColor: "var(--theme-border-soft)" }}>
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-theme">Player Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-theme-foreground">Your Pokemon TCG control center</h1>
            <p className="mt-3 max-w-2xl text-theme-muted">
              Track your deck trends, jump back into favorite stores and events, and keep the next live room one click away.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/my-events" className="theme-button rounded-md px-4 py-2 text-sm">
                Open My Events
              </Link>
              <Link href="/decklists" className="theme-button-ghost rounded-md px-4 py-2 text-sm">
                Manage Decklists
              </Link>
              <Link href="/my-stores" className="theme-button-ghost rounded-md px-4 py-2 text-sm">
                Favorite Stores
              </Link>
              {activeLiveOverview && getLiveEventCta(activeLiveOverview) && (
                <Link
                  href={getLiveEventCta(activeLiveOverview)!.href}
                  className="theme-button-ghost rounded-md px-4 py-2 text-sm"
                >
                  {getLiveEventCta(activeLiveOverview)!.label}
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {[
              { label: "Registered Events", value: registeredUpcomingEventIds.length, hint: "events on your radar" },
              { label: "Favorite Stores", value: favoriteStores.length, hint: "quick store shortcuts" },
              { label: "Tracked Decks", value: myDecklists.length, hint: "decklists ready to run" },
              { label: "Completed Runs", value: historyItems.length, hint: "live event summaries logged" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border px-4 py-3"
                style={{ borderColor: "var(--theme-border-soft)" }}
              >
                <div className="text-xs uppercase tracking-wide text-theme-muted">{item.label}</div>
                <div className="mt-2 text-2xl font-semibold text-theme-foreground">{item.value}</div>
                <div className="mt-1 text-sm text-theme-muted">{item.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Cumulative Record",
            value: formatRecord(totalRecord.wins, totalRecord.losses, totalRecord.ties),
            hint: totalRecord.rounds > 0 ? `${totalRecord.rounds} tracked rounds` : "No tracked rounds yet",
          },
          {
            label: "Average Round Length",
            value: formatAverageMinutes(weightedAverageGameLength),
            hint: "weighted across completed live events",
          },
          {
            label: "Most Played Deck",
            value: mostPlayedDeck?.deckName ?? "No data yet",
            hint: mostPlayedDeck ? `${mostPlayedDeck.roundsPlayed} rounds logged` : "Play more events to surface this",
          },
          {
            label: "Best Deck Win Rate",
            value: bestPerformingDeck ? formatPercent(bestPerformingDeck.winRate) : "No data yet",
            hint: bestPerformingDeck ? bestPerformingDeck.deckName : "Needs completed event results",
          },
          {
            label: "Favorite Event Count",
            value: String(favoriteEvents.length),
            hint: favoriteEvents.length > 0 ? "saved for quick access" : "Save events to pin them here",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="theme-card rounded-xl border p-4"
            style={{ borderColor: "var(--theme-border-soft)" }}
          >
            <div className="text-xs uppercase tracking-wide text-theme-muted">{item.label}</div>
            <div className="mt-2 text-xl font-semibold text-theme-foreground">{item.value}</div>
            <div className="mt-2 text-sm text-theme-muted">{item.hint}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="theme-card rounded-2xl border p-5" style={{ borderColor: "var(--theme-border-soft)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-theme-foreground">Deck Performance</h2>
              <p className="mt-1 text-sm text-theme-muted">
                Record and pacing rolled up by deck from your completed live events.
              </p>
            </div>
            <Link href="/decklists" className="text-sm font-medium text-theme hover:opacity-80">
              View all decklists
            </Link>
          </div>

          {deckPerformance.length === 0 ? (
            <div className="mt-4 rounded-xl border p-4 text-sm text-theme-muted" style={{ borderColor: "var(--theme-border-soft)" }}>
              Complete a live event with a selected deck to unlock deck-based performance summaries here.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-theme-muted">
                    <th className="pb-1 pr-4 font-medium">Deck</th>
                    <th className="pb-1 pr-4 font-medium">Record</th>
                    <th className="pb-1 pr-4 font-medium">Rounds</th>
                    <th className="pb-1 pr-4 font-medium">Sessions</th>
                    <th className="pb-1 pr-4 font-medium">Win Rate</th>
                    <th className="pb-1 font-medium">Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {deckPerformance.slice(0, 6).map((deck) => (
                    <tr
                      key={`${deck.deckId ?? deck.deckName}`}
                      className="rounded-xl"
                      style={{ backgroundColor: "var(--theme-surface-elevated)" }}
                    >
                      <td className="rounded-l-xl px-3 py-3 font-medium text-theme-foreground">{deck.deckName}</td>
                      <td className="px-3 py-3 text-theme-muted">{formatRecord(deck.wins, deck.losses, deck.ties)}</td>
                      <td className="px-3 py-3 text-theme-muted">{deck.roundsPlayed}</td>
                      <td className="px-3 py-3 text-theme-muted">{deck.sessionsPlayed}</td>
                      <td className="px-3 py-3 text-theme-muted">{formatPercent(deck.winRate)}</td>
                      <td className="rounded-r-xl px-3 py-3 text-theme-muted">{formatAverageMinutes(deck.averageRoundDurationMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="theme-card rounded-2xl border p-5" style={{ borderColor: "var(--theme-border-soft)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-theme-foreground">Favorite Stores</h2>
                <p className="mt-1 text-sm text-theme-muted">
                  Your fastest path back to the stores you care about most.
                </p>
              </div>
              <Link href="/my-stores" className="text-sm font-medium text-theme hover:opacity-80">
                Manage stores
              </Link>
            </div>

            {favoriteStores.length === 0 ? (
              <div className="mt-4 rounded-xl border p-4 text-sm text-theme-muted" style={{ borderColor: "var(--theme-border-soft)" }}>
                Favorite a store to pin it here with a direct shortcut into its event feed.
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {favoriteStores.slice(0, 4).map((store) => (
                  <div
                    key={store.store_id}
                    className="rounded-xl border px-4 py-3"
                    style={{ borderColor: "var(--theme-border-soft)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-theme-foreground">{store.name}</div>
                        <div className="mt-1 text-sm text-theme-muted">{store.location}</div>
                        <div className="mt-2 text-xs uppercase tracking-wide text-theme-muted">
                          Avg players {store.avg_players} · {store.has_league ? "League store" : "Event venue"}
                        </div>
                      </div>
                      <Link href={`/my-events?store=${store.store_id}`} className="theme-button-ghost rounded-md px-3 py-2 text-xs">
                        View Events
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="theme-card rounded-2xl border p-5" style={{ borderColor: "var(--theme-border-soft)" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-theme-foreground">Registered Events</h2>
                <p className="mt-1 text-sm text-theme-muted">
                  Upcoming events you registered for, with live-room shortcuts when available.
                </p>
              </div>
              <Link href="/my-events" className="text-sm font-medium text-theme hover:opacity-80">
                Open events
              </Link>
            </div>

            {registeredUpcomingEvents.length === 0 ? (
              <div className="mt-4 rounded-xl border p-4 text-sm text-theme-muted" style={{ borderColor: "var(--theme-border-soft)" }}>
                Register for an event to keep your next scheduled run front and center here.
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                {registeredUpcomingEvents.slice(0, 4).map((event) => {
                  const overview = liveOverviewByEventId.get(event.event_id) ?? null;
                  const liveCta = getLiveEventCta(overview);

                  return (
                    <div
                      key={event.event_id}
                      className="rounded-xl border px-4 py-3"
                      style={{ borderColor: "var(--theme-border-soft)" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-theme-foreground">{event.name}</div>
                          <div className="mt-1 text-sm text-theme-muted">
                            {formatDisplayDate(event.start_at, event.timezone)} at {formatDisplayTime(event.start_at, event.timezone)}
                          </div>
                          <div className="mt-1 text-sm text-theme-muted">
                            {event.store?.name ?? "Unknown store"} · {getEventTypeLabel(event)}
                          </div>
                        </div>
                        {liveCta ? (
                          <Link href={liveCta.href} className="theme-button rounded-md px-3 py-2 text-xs">
                            {liveCta.label}
                          </Link>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            Scheduled
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="theme-card rounded-2xl border p-5" style={{ borderColor: "var(--theme-border-soft)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-theme-foreground">Favorite Events</h2>
              <p className="mt-1 text-sm text-theme-muted">
                Saved events stay parked here so you can jump back in quickly.
              </p>
            </div>
            <Link href="/my-events" className="text-sm font-medium text-theme hover:opacity-80">
              Open favorites
            </Link>
          </div>

          {favoriteEvents.length === 0 ? (
            <div className="mt-4 rounded-xl border p-4 text-sm text-theme-muted" style={{ borderColor: "var(--theme-border-soft)" }}>
              Favorite events from My Events to pin them to your home dashboard.
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {favoriteEvents.slice(0, 4).map((event) => {
                  const overview = liveOverviewByEventId.get(event.event_id) ?? null;
                  const liveCta = getLiveEventCta(overview);

                  return (
                    <div
                      key={event.event_id}
                      className="rounded-xl border px-4 py-3"
                      style={{ borderColor: "var(--theme-border-soft)" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-theme-foreground">{event.name}</div>
                          <div className="mt-1 text-sm text-theme-muted">
                            {formatDisplayDate(event.start_at, event.timezone)} at {formatDisplayTime(event.start_at, event.timezone)}
                          </div>
                          <div className="mt-1 text-sm text-theme-muted">
                            {event.store?.name ?? "Unknown store"} · {getEventTypeLabel(event)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                            Favorite
                          </span>
                          <Link
                            href={liveCta?.href ?? "/my-events"}
                            className="theme-button-ghost rounded-md px-3 py-2 text-xs"
                          >
                            {liveCta?.label ?? "Open In My Events"}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>

        <section className="theme-card rounded-2xl border p-5" style={{ borderColor: "var(--theme-border-soft)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-theme-foreground">Insight Targets</h2>
              <p className="mt-1 text-sm text-theme-muted">
                Good candidates for the next data pass once more telemetry lands in Supabase.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              {
                title: "Most Played Archetype",
                description: "Track your most frequently faced decks once matchup tagging is broadened beyond round notes.",
              },
              {
                title: "Deck-by-Store Record",
                description: "Spot where each deck performs best once store-level rollups are materialized.",
              },
              {
                title: "Average Match Length By Deck",
                description: "Separate fast and grindy decks with a cleaner per-deck time model.",
              },
              {
                title: "Favorite Event Conversion",
                description: "Measure how often saved events turn into registrations, attendance, and live-room sessions.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border px-4 py-3"
                style={{ borderColor: "var(--theme-border-soft)" }}
              >
                <div className="font-medium text-theme-foreground">{item.title}</div>
                <div className="mt-2 text-sm text-theme-muted">{item.description}</div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
