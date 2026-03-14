/*
  Live event API helpers.
  - Loads shared live-event state from Supabase
  - Wraps RPCs for joining, voting, pairing, reporting, and completing events
  - Provides a lightweight Realtime subscription helper for live pages
*/

import { fetchMyDecklists } from "@/lib/decklistApi";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { Event } from "@/types/event";
import type {
  DeckSelectionOption,
  EventPlayerRoundStat,
  EventRoundProgressVote,
  EventPlayerSummary,
  EventRoundMatch,
  EventRoundTimerVote,
  EventSession,
  EventSessionAttendee,
  EventSessionRound,
  LiveEventHistoryItem,
  LiveEventOverview,
  LiveEventBestOf,
  LiveEventProgressAction,
  LiveEventState,
  MatchResultPayload,
} from "@/types/liveEvent";

const LIVE_EVENT_JOIN_GRACE_MS = 10 * 60 * 1000;

async function getAuthenticatedUser() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("You must be signed in to access live events.");
  }

  return data.user;
}

async function fetchCurrentUserRole(userId: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("Users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.role ?? null;
}

function isSessionLive(session: EventSession | null): boolean {
  return !!session && session.status !== "completed";
}

export function isLiveEventAvailable(event: Event, session: EventSession | null): boolean {
  if (session?.status === "completed") {
    return false;
  }

  const startTime = new Date(event.start_at).getTime();
  const joinClosesAt = startTime + LIVE_EVENT_JOIN_GRACE_MS;
  const now = Date.now();

  if (!session) {
    return now >= startTime && now <= joinClosesAt;
  }

  const sessionHasStarted = !["not_started", "voting"].includes(session.timer_status);
  if (sessionHasStarted) {
    return false;
  }

  return now <= joinClosesAt;
}

export function getTimerRemainingSeconds(round: EventSessionRound | null): number | null {
  if (!round?.timer_expires_at) {
    return null;
  }

  const remainingMs = new Date(round.timer_expires_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function isRoundTimerExpired(round: EventSessionRound | null): boolean {
  const remaining = getTimerRemainingSeconds(round);
  return remaining !== null && remaining <= 0;
}

export async function fetchDeckSelectionOptions(): Promise<DeckSelectionOption[]> {
  return fetchMyDecklists();
}

export async function fetchLiveEventOverviews(eventIds: string[]): Promise<LiveEventOverview[]> {
  if (eventIds.length === 0) {
    return [];
  }

  const supabase = getSupabaseClient();

  const [{ data: eventsData, error: eventsError }, { data: sessionsData, error: sessionsError }] = await Promise.all([
    supabase
      .from("Events")
      .select(`
        *,
        store:Stores(name, location)
      `)
      .in("event_id", eventIds),
    supabase
      .from("EventSessions")
      .select("*")
      .in("event_id", eventIds),
  ]);

  if (eventsError) {
    throw eventsError;
  }

  if (sessionsError) {
    throw sessionsError;
  }

  const sessionsByEventId = new Map<string, EventSession>(
    ((sessionsData ?? []) as EventSession[]).map((session) => [session.event_id, session]),
  );

  return ((eventsData ?? []) as Event[]).map((event) => {
    const session = sessionsByEventId.get(event.event_id) ?? null;
    return {
      event,
      session,
      isLive: isSessionLive(session),
      isCompleted: session?.status === "completed",
      canJoin: isLiveEventAvailable(event, session),
    };
  });
}

export async function fetchLiveEventState(eventId: string): Promise<LiveEventState> {
  const supabase = getSupabaseClient();
  const user = await getAuthenticatedUser();

  const [eventResponse, sessionResponse, roleResponse] = await Promise.all([
    supabase
      .from("Events")
      .select(`
        *,
        store:Stores(name, location)
      `)
      .eq("event_id", eventId)
      .maybeSingle(),
    supabase
      .from("EventSessions")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle(),
    fetchCurrentUserRole(user.id),
  ]);

  if (eventResponse.error) {
    throw eventResponse.error;
  }

  if (sessionResponse.error) {
    throw sessionResponse.error;
  }

  const event = eventResponse.data as Event | null;
  if (!event) {
    throw new Error("Event not found.");
  }

  const session = (sessionResponse.data as EventSession | null) ?? null;
  const currentUserRole = roleResponse;
  const canManageEvent = currentUserRole === "admin" || event.created_by === user.id;

  if (!session) {
    return {
      currentUserId: user.id,
      currentUserRole,
      canManageEvent,
      event,
      session: null,
      attendees: [],
      rounds: [],
      votes: [],
      progressVotes: [],
      matches: [],
      currentUserStats: [],
      summary: null,
      currentRound: null,
      currentUserAttendee: null,
      currentUserMatch: null,
    };
  }

  const [attendeesResponse, roundsResponse, summaryResponse] = await Promise.all([
    supabase
      .from("EventSessionAttendees")
      .select("*")
      .eq("session_id", session.session_id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("EventSessionRounds")
      .select("*")
      .eq("session_id", session.session_id)
      .order("round_number", { ascending: true }),
    supabase
      .from("EventPlayerSummaries")
      .select("*")
      .eq("session_id", session.session_id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (attendeesResponse.error) {
    throw attendeesResponse.error;
  }

  if (roundsResponse.error) {
    throw roundsResponse.error;
  }

  if (summaryResponse.error) {
    throw summaryResponse.error;
  }

  const attendees = (attendeesResponse.data ?? []) as EventSessionAttendee[];
  const rounds = (roundsResponse.data ?? []) as EventSessionRound[];
  const currentRound = rounds.find((round) => round.round_number === session.current_round) ?? null;
  const roundIds = rounds.map((round) => round.round_id);

  let votes: EventRoundTimerVote[] = [];
  let progressVotes: EventRoundProgressVote[] = [];
  let matches: EventRoundMatch[] = [];
  let currentUserStats: EventPlayerRoundStat[] = [];

  if (currentRound) {
    const [votesResponse, progressVotesResponse] = await Promise.all([
      supabase
        .from("EventRoundTimerVotes")
        .select("*")
        .eq("round_id", currentRound.round_id),
      supabase
        .from("EventRoundProgressVotes")
        .select("*")
        .eq("round_id", currentRound.round_id),
    ]);

    if (votesResponse.error) {
      throw votesResponse.error;
    }

    if (progressVotesResponse.error) {
      throw progressVotesResponse.error;
    }

    votes = (votesResponse.data ?? []) as EventRoundTimerVote[];
    progressVotes = (progressVotesResponse.data ?? []) as EventRoundProgressVote[];
  }

  if (roundIds.length > 0) {
    const matchesResponse = await supabase
      .from("EventRoundMatches")
      .select("*")
      .in("round_id", roundIds)
      .order("created_at", { ascending: true });

    if (matchesResponse.error) {
      throw matchesResponse.error;
    }

    matches = (matchesResponse.data ?? []) as EventRoundMatch[];

    const matchIds = matches.map((match) => match.match_id);
    if (matchIds.length > 0) {
      const statsResponse = await supabase
        .from("EventPlayerRoundStats")
        .select("*")
        .in("match_id", matchIds)
        .eq("user_id", user.id)
        .order("reported_at", { ascending: true });

      if (statsResponse.error) {
        throw statsResponse.error;
      }

      currentUserStats = (statsResponse.data ?? []) as EventPlayerRoundStat[];
    }
  }

  const currentUserAttendee = attendees.find((attendee) => attendee.user_id === user.id) ?? null;
  const currentUserMatch =
    matches.find(
      (match) =>
        match.round_id === currentRound?.round_id &&
        (match.player_user_id === user.id || match.opponent_user_id === user.id),
    ) ?? null;

  return {
    currentUserId: user.id,
    currentUserRole,
    canManageEvent,
    event,
    session,
    attendees,
    rounds,
    votes,
    progressVotes,
    matches,
    currentUserStats,
    summary: (summaryResponse.data as EventPlayerSummary | null) ?? null,
    currentRound,
    currentUserAttendee,
    currentUserMatch,
  };
}

export async function fetchMyLiveEventHistory(): Promise<LiveEventHistoryItem[]> {
  const supabase = getSupabaseClient();
  const user = await getAuthenticatedUser();

  const { data: summariesData, error: summariesError } = await supabase
    .from("EventPlayerSummaries")
    .select("*")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  if (summariesError) {
    throw summariesError;
  }

  const summaries = (summariesData ?? []) as EventPlayerSummary[];
  if (summaries.length === 0) {
    return [];
  }

  const sessionIds = summaries.map((summary) => summary.session_id);

  const { data: sessionsData, error: sessionsError } = await supabase
    .from("EventSessions")
    .select("*")
    .in("session_id", sessionIds);

  if (sessionsError) {
    throw sessionsError;
  }

  const sessions = (sessionsData ?? []) as EventSession[];
  const eventIds = sessions.map((session) => session.event_id);
  const deckIds = summaries.map((summary) => summary.deck_id).filter((deckId): deckId is string => !!deckId);

  const [{ data: eventsData, error: eventsError }, { data: decksData, error: decksError }] = await Promise.all([
    supabase
      .from("Events")
      .select(`
        *,
        store:Stores(name, location)
      `)
      .in("event_id", eventIds),
    deckIds.length > 0
      ? supabase
          .from("Decklists")
          .select("deck_id, name")
          .in("deck_id", deckIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (eventsError) {
    throw eventsError;
  }

  if (decksError) {
    throw decksError;
  }

  const sessionsById = new Map(sessions.map((session) => [session.session_id, session]));
  const eventsById = new Map(((eventsData ?? []) as Event[]).map((event) => [event.event_id, event]));
  const deckNamesById = new Map(((decksData ?? []) as Array<{ deck_id: string; name: string }>).map((deck) => [deck.deck_id, deck.name]));

  return summaries
    .map((summary) => {
      const session = sessionsById.get(summary.session_id);
      const event = session ? eventsById.get(session.event_id) : undefined;

      if (!session || !event) {
        return null;
      }

      return {
        summary,
        session,
        event,
        deckName: summary.deck_id ? deckNamesById.get(summary.deck_id) ?? null : null,
      };
    })
    .filter((item): item is LiveEventHistoryItem => item !== null);
}

export async function startEventSession(eventId: string, totalRounds: number, bestOf: LiveEventBestOf): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("start_event_session_configured", {
    p_event_id: eventId,
    p_total_rounds: totalRounds,
    p_best_of: bestOf,
  });

  if (error) {
    throw error;
  }

  return data as string;
}

export async function joinEventSession(eventId: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("join_event_session", {
    p_event_id: eventId,
  });

  if (error) {
    throw error;
  }

  return data as string;
}

export async function heartbeatEventSession(sessionId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("heartbeat_event_session", {
    p_session_id: sessionId,
  });

  if (error) {
    throw error;
  }
}

export async function leaveEventSession(sessionId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("leave_event_session", {
    p_session_id: sessionId,
  });

  if (error) {
    throw error;
  }
}

export async function configureEventSession(
  sessionId: string,
  totalRounds: number,
  bestOf: LiveEventBestOf,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("configure_event_session_settings", {
    p_session_id: sessionId,
    p_total_rounds: totalRounds,
    p_best_of: bestOf,
  });

  if (error) {
    throw error;
  }
}

export async function selectEventDeck(sessionId: string, deckId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("select_event_deck", {
    p_session_id: sessionId,
    p_deck_id: deckId,
  });

  if (error) {
    throw error;
  }
}

export async function voteRoundTimer(roundId: string, minutes: number): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("vote_round_timer", {
    p_round_id: roundId,
    p_minutes: minutes,
  });

  if (error) {
    throw error;
  }
}

export async function stopEventRoundTimer(roundId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("stop_event_round_timer", {
    p_round_id: roundId,
  });

  if (error) {
    throw error;
  }
}

export async function resetEventRound(roundId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("reset_event_round", {
    p_round_id: roundId,
  });

  if (error) {
    throw error;
  }
}

export async function syncEventRoundTimer(roundId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("sync_event_round_timer", {
    p_round_id: roundId,
  });

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function createOrUpdateMatch(
  roundId: string,
  opponentUserId: string | null,
  opponentLabel: string,
): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("create_or_update_match", {
    p_round_id: roundId,
    p_opponent_user_id: opponentUserId,
    p_opponent_label: opponentLabel || null,
  });

  if (error) {
    throw error;
  }

  return data as string;
}

export async function reportMatchResult(matchId: string, payload: MatchResultPayload): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("report_match_result_checked", {
    p_match_id: matchId,
    p_round_result: payload.roundResult,
    p_games_won: payload.gamesWon,
    p_games_lost: payload.gamesLost,
    p_games_tied: payload.gamesTied,
    p_went_first: payload.wentFirst,
    p_round_duration_minutes: payload.roundDurationMinutes,
    p_opponent_archetype: payload.opponentArchetype || null,
    p_notes: payload.notes || null,
  });

  if (error) {
    throw error;
  }

  return data as string;
}

export async function voteRoundProgress(
  sessionId: string,
  action: LiveEventProgressAction,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("vote_round_progress", {
    p_session_id: sessionId,
    p_action: action,
  });

  if (error) {
    throw error;
  }
}

export function subscribeToLiveEvent(
  sessionId: string,
  currentRoundId: string | null,
  currentUserId: string,
  onRefresh: () => void,
) {
  const supabase = getSupabaseClient();
  const channel = supabase.channel(`live-event-${sessionId}-${currentRoundId ?? "none"}`);

  channel
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "EventSessions",
      filter: `session_id=eq.${sessionId}`,
    }, onRefresh)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "EventSessionAttendees",
      filter: `session_id=eq.${sessionId}`,
    }, onRefresh)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "EventSessionRounds",
      filter: `session_id=eq.${sessionId}`,
    }, onRefresh)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "EventPlayerSummaries",
      filter: `session_id=eq.${sessionId}`,
    }, onRefresh)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "EventPlayerRoundStats",
      filter: `user_id=eq.${currentUserId}`,
    }, onRefresh);

  if (currentRoundId) {
    channel.on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "EventRoundTimerVotes",
      filter: `round_id=eq.${currentRoundId}`,
    }, onRefresh)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "EventRoundProgressVotes",
      filter: `round_id=eq.${currentRoundId}`,
    }, onRefresh)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "EventRoundMatches",
      filter: `round_id=eq.${currentRoundId}`,
    }, onRefresh);
  }

  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
