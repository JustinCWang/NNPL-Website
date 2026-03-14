"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CurrentRecordCard from "@/components/live-events/CurrentRecordCard";
import DeckSelectionPanel from "@/components/live-events/DeckSelectionPanel";
import LiveEventBanner from "@/components/live-events/LiveEventBanner";
import MatchResultPanel from "@/components/live-events/MatchResultPanel";
import OpponentSelectionPanel from "@/components/live-events/OpponentSelectionPanel";
import RoundProgressVotePanel from "@/components/live-events/RoundProgressVotePanel";
import RoundHistoryList from "@/components/live-events/RoundHistoryList";
import RoundTimerVotePanel from "@/components/live-events/RoundTimerVotePanel";
import { normalizeLiveEventBestOf, validateMatchResultPayload } from "@/lib/liveEventMatchUtils";
import {
  configureEventSession,
  createOrUpdateMatch,
  fetchDeckSelectionOptions,
  fetchLiveEventState,
  heartbeatEventSession,
  isLiveEventAvailable,
  isRoundTimerExpired,
  joinEventSession,
  leaveEventSession,
  reportMatchResult,
  resetEventRound,
  selectEventDeck,
  syncEventRoundTimer,
  startEventSession,
  stopEventRoundTimer,
  subscribeToLiveEvent,
  voteRoundProgress,
  voteRoundTimer,
} from "@/lib/liveEventApi";
import type {
  DeckSelectionOption,
  LiveEventBestOf,
  EventRoundTimerVote,
  EventPlayerRoundStat,
  LiveEventProgressAction,
  LiveEventState,
  MatchResultPayload,
} from "@/types/liveEvent";

const PRESET_TIMER_OPTIONS = [30, 50] as const;
const MIN_CUSTOM_TIMER_MINUTES = 1;
const MAX_CUSTOM_TIMER_MINUTES = 90;

function isConnected(lastSeenAt: string, isConnectedFlag: boolean): boolean {
  return isConnectedFlag && Date.now() - new Date(lastSeenAt).getTime() <= 90_000;
}

function isPresetTimerOption(minutes: number): boolean {
  return PRESET_TIMER_OPTIONS.includes(minutes as (typeof PRESET_TIMER_OPTIONS)[number]);
}

function isValidTimerMinutes(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= MIN_CUSTOM_TIMER_MINUTES && minutes <= MAX_CUSTOM_TIMER_MINUTES;
}

function getLeadingCustomTimerMinutes(votes: EventRoundTimerVote[], currentUserId: string): number | null {
  const currentUserCustomVote =
    votes.find((vote) => vote.user_id === currentUserId && !isPresetTimerOption(vote.requested_minutes))
      ?.requested_minutes ?? null;

  if (currentUserCustomVote !== null) {
    return currentUserCustomVote;
  }

  const groupedCustomVotes = new Map<number, { count: number; latestVoteAt: number }>();

  for (const vote of votes) {
    if (isPresetTimerOption(vote.requested_minutes)) {
      continue;
    }

    const existingGroup = groupedCustomVotes.get(vote.requested_minutes);
    const votedAtMs = new Date(vote.voted_at).getTime();

    groupedCustomVotes.set(vote.requested_minutes, {
      count: (existingGroup?.count ?? 0) + 1,
      latestVoteAt: Math.max(existingGroup?.latestVoteAt ?? 0, votedAtMs),
    });
  }

  return [...groupedCustomVotes.entries()]
    .sort((left, right) => {
      const [, leftGroup] = left;
      const [, rightGroup] = right;

      if (rightGroup.count !== leftGroup.count) {
        return rightGroup.count - leftGroup.count;
      }

      if (rightGroup.latestVoteAt !== leftGroup.latestVoteAt) {
        return rightGroup.latestVoteAt - leftGroup.latestVoteAt;
      }

      return left[0] - right[0];
    })[0]?.[0] ?? null;
}

function getOpponentName(state: LiveEventState | null): string {
  if (!state?.currentUserMatch) {
    return "No opponent selected";
  }

  if (state.currentUserMatch.source_type === "other_player") {
    return state.currentUserMatch.opponent_label ?? "Other Player";
  }

  const opponentId =
    state.currentUserMatch.player_user_id === state.currentUserId
      ? state.currentUserMatch.opponent_user_id
      : state.currentUserMatch.player_user_id;

  return state.attendees.find((attendee) => attendee.user_id === opponentId)?.display_name ?? "Connected attendee";
}

function getActionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const message = "message" in error && typeof error.message === "string" ? error.message : null;
    const details = "details" in error && typeof error.details === "string" ? error.details : null;
    const hint = "hint" in error && typeof error.hint === "string" ? error.hint : null;
    const code = "code" in error && typeof error.code === "string" ? error.code : null;

    const parts = [
      message,
      details,
      hint ? `Hint: ${hint}` : null,
      code ? `Code: ${code}` : null,
    ].filter((part): part is string => Boolean(part));

    if (parts.length > 0) {
      return parts.join(" ");
    }
  }

  return "Something went wrong. Please try again.";
}

export default function LiveEventPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = Array.isArray(params?.eventId) ? params.eventId[0] : params?.eventId;
  const refreshTimeoutRef = useRef<number | null>(null);

  const [liveState, setLiveState] = useState<LiveEventState | null>(null);
  const [decks, setDecks] = useState<DeckSelectionOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [selectedOpponentUserId, setSelectedOpponentUserId] = useState("");
  const [otherOpponentLabel, setOtherOpponentLabel] = useState("");
  const [customTimerMinutes, setCustomTimerMinutes] = useState("45");
  const [hasCustomTimerDraft, setHasCustomTimerDraft] = useState(false);
  const [configuredRounds, setConfiguredRounds] = useState(4);
  const [configuredBestOf, setConfiguredBestOf] = useState<LiveEventBestOf>(3);
  const [nowMs, setNowMs] = useState(Date.now());
  const [isEditingDisputedResult, setIsEditingDisputedResult] = useState(false);

  const loadState = useCallback(async (showLoading: boolean = false) => {
    if (!eventId) {
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }
      const state = await fetchLiveEventState(eventId);
      setLiveState(state);
      setConfiguredRounds(state.session?.total_rounds ?? 4);
      setConfiguredBestOf(normalizeLiveEventBestOf(state.session?.best_of ?? 3));
    } catch (loadError) {
      console.error("Error loading live event:", loadError);
      setError("Failed to load the live event room. Please try again.");
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [eventId]);

  const scheduleSilentRefresh = useCallback(() => {
    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      void loadState(false);
      refreshTimeoutRef.current = null;
    }, 150);
  }, [loadState]);

  const loadDecks = useCallback(async () => {
    try {
      const options = await fetchDeckSelectionOptions();
      setDecks(options);
    } catch (deckError) {
      console.error("Error loading deck options:", deckError);
      setError("Failed to load your decklists. Please try again.");
    }
  }, []);

  useEffect(() => {
    void loadState(true);
    void loadDecks();
  }, [loadDecks, loadState]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!liveState?.session || !liveState.currentUserAttendee) {
      return;
    }

    const unsubscribe = subscribeToLiveEvent(
      liveState.session.session_id,
      liveState.currentRound?.round_id ?? null,
      liveState.currentUserId,
      () => {
        scheduleSilentRefresh();
      },
    );

    const heartbeatId = window.setInterval(() => {
      void heartbeatEventSession(liveState.session!.session_id).catch((heartbeatError) => {
        console.error("Heartbeat failed:", heartbeatError);
      });
    }, 30_000);

    const handlePageHide = () => {
      void leaveEventSession(liveState.session!.session_id).catch(() => {
        // Ignore best-effort disconnect errors during page navigation.
      });
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      unsubscribe();
      window.clearInterval(heartbeatId);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [liveState, scheduleSilentRefresh]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!error && !notice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setError(null);
      setNotice(null);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [error, notice]);

  const connectedAttendees = useMemo(
    () => liveState?.attendees.filter((attendee) => isConnected(attendee.last_seen_at, attendee.is_connected)) ?? [],
    [liveState],
  );

  const existingStat = useMemo<EventPlayerRoundStat | null>(() => {
    if (!liveState?.currentUserMatch) {
      return null;
    }

    return liveState.currentUserStats.find((stat) => stat.match_id === liveState.currentUserMatch?.match_id) ?? null;
  }, [liveState]);

  const timerRemainingSeconds = useMemo(() => {
    if (!liveState?.currentRound?.timer_expires_at) {
      return null;
    }

    const remaining = Math.ceil((new Date(liveState.currentRound.timer_expires_at).getTime() - nowMs) / 1000);
    return Math.max(0, remaining);
  }, [liveState?.currentRound?.timer_expires_at, nowMs]);

  const isCurrentMatchDisputed = liveState?.currentUserMatch?.result_status === "disputed";
  const matchBestOf = useMemo(
    () => normalizeLiveEventBestOf(liveState?.session?.best_of ?? configuredBestOf),
    [configuredBestOf, liveState?.session?.best_of],
  );
  const currentUserTimerVote =
    liveState?.votes.find((vote) => vote.user_id === liveState.currentUserId)?.requested_minutes ?? null;
  const leadingCustomTimerMinutes = useMemo(
    () => (liveState ? getLeadingCustomTimerMinutes(liveState.votes, liveState.currentUserId) : null),
    [liveState],
  );

  useEffect(() => {
    if (!liveState) {
      return;
    }

    const preferredCustomTimerMinutes = leadingCustomTimerMinutes ?? 45;
    const shouldSyncDraft = !hasCustomTimerDraft;

    if (!shouldSyncDraft) {
      return;
    }

    const nextValue = String(preferredCustomTimerMinutes);
    setCustomTimerMinutes((previousValue) => (previousValue === nextValue ? previousValue : nextValue));
    setHasCustomTimerDraft(false);
  }, [currentUserTimerVote, hasCustomTimerDraft, leadingCustomTimerMinutes, liveState]);

  useEffect(() => {
    if (!isCurrentMatchDisputed) {
      setIsEditingDisputedResult(false);
    }
  }, [isCurrentMatchDisputed]);

  useEffect(() => {
    if (!liveState?.currentRound || !isRoundTimerExpired(liveState.currentRound)) {
      return;
    }

    if (liveState.session?.timer_status === "expired" || liveState.session?.status === "completed") {
      return;
    }

    void syncEventRoundTimer(liveState.currentRound.round_id)
      .then(() => loadState(false))
      .catch((syncError) => {
        console.error("Error syncing round timer:", syncError);
      });
  }, [liveState, loadState]);

  const handleAction = useCallback(
    async (actionKey: string, callback: () => Promise<void>, successMessage: string) => {
      try {
        setPendingAction(actionKey);
        setError(null);
        await callback();
        setNotice(successMessage);
        await loadState(false);
      } catch (actionError) {
        console.error(`Error during ${actionKey}:`, actionError);
        setError(getActionErrorMessage(actionError));
      } finally {
        setPendingAction(null);
      }
    },
    [loadState],
  );

  const handleCustomTimerMinutesChange = useCallback((value: string) => {
    if (value === "") {
      setCustomTimerMinutes("");
      setHasCustomTimerDraft(true);
      return;
    }

    if (!/^\d+$/.test(value)) {
      return;
    }

    const parsedMinutes = Number.parseInt(value, 10);
    if (!Number.isInteger(parsedMinutes)) {
      return;
    }

    setCustomTimerMinutes(String(Math.min(MAX_CUSTOM_TIMER_MINUTES, Math.max(MIN_CUSTOM_TIMER_MINUTES, parsedMinutes))));
    setHasCustomTimerDraft(true);
  }, []);

  const handleCustomTimerMinutesBlur = useCallback(() => {
    if (customTimerMinutes === "") {
      setCustomTimerMinutes(String(leadingCustomTimerMinutes ?? 45));
      setHasCustomTimerDraft(false);
      return;
    }

    const parsedMinutes = Number.parseInt(customTimerMinutes, 10);
    if (!Number.isInteger(parsedMinutes)) {
      setCustomTimerMinutes(String(leadingCustomTimerMinutes ?? 45));
      setHasCustomTimerDraft(false);
      return;
    }

    setCustomTimerMinutes(String(Math.min(MAX_CUSTOM_TIMER_MINUTES, Math.max(MIN_CUSTOM_TIMER_MINUTES, parsedMinutes))));
    setHasCustomTimerDraft(true);
  }, [customTimerMinutes, leadingCustomTimerMinutes]);

  const handleReportMatchResult = useCallback(
    async (payload: MatchResultPayload, options?: { closeDisputedEditor?: boolean }) => {
      if (!liveState?.currentUserMatch) {
        throw new Error("Select an opponent before reporting a result.");
      }

      const validationMessage = validateMatchResultPayload(payload, matchBestOf);
      if (validationMessage) {
        throw new Error(validationMessage);
      }

      await reportMatchResult(liveState.currentUserMatch.match_id, payload);

      if (options?.closeDisputedEditor) {
        setIsEditingDisputedResult(false);
      }
    },
    [liveState, matchBestOf],
  );

  if (!eventId) {
    return (
      <main className="py-16 text-center">
        <p className="text-theme-muted">Invalid live event route.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-theme border-t-transparent"></div>
        <p className="mt-3 text-theme-muted">Loading live event room...</p>
      </main>
    );
  }

  if (!liveState) {
    return (
      <main className="space-y-4">
        <p className="text-red-600">Unable to load this live event.</p>
        <Link href="/my-events" className="theme-button inline-flex rounded-md px-4 py-2">
          Back to My Events
        </Link>
      </main>
    );
  }

  const canJoin = isLiveEventAvailable(liveState.event, liveState.session);
  const hasJoinedSession = !!liveState.currentUserAttendee;
  const selectedDeckId = liveState.currentUserAttendee?.selected_deck_id ?? null;
  const isSessionLocked = liveState.session?.status === "completed";
  const hasSelectedDeck = !!selectedDeckId;
  const hasLockedOpponent = !!liveState.currentUserMatch;
  const roundTimerStarted = !!liveState.currentRound?.timer_started_at;
  const roundTimerExpired = !!liveState.currentRound && isRoundTimerExpired(liveState.currentRound);
  const hasSubmittedResult = !!existingStat;
  const canStartEvent = connectedAttendees.length >= 2;
  const isFinalRound =
    liveState.session !== null && liveState.currentRound?.round_number === liveState.session.total_rounds;
  const currentUserProgressVote =
    liveState.progressVotes.find((vote) => vote.user_id === liveState.currentUserId)?.action ?? null;
  const roundResultsSettled = liveState.matches
    .filter((match) => match.round_id === liveState.currentRound?.round_id)
    .every((match) => ["confirmed", "unverified"].includes(match.result_status));

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/my-events" className="text-sm text-theme hover:opacity-80">
            ← Back to My Events
          </Link>
        </div>
        {liveState.session?.status === "completed" && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
            Event locked
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-green-700">
          {notice}
        </div>
      )}

      {!liveState.session ? (
        <section className="theme-card rounded-xl p-6">
          <h1 className="text-3xl font-semibold text-theme-foreground">{liveState.event.name}</h1>
          <p className="mt-2 text-theme-muted">
            {canJoin
              ? "This event is ready for live tracking. Join the room to choose your deck, vote on the timer, and report your rounds."
              : "This live room is not available yet. It opens when the event starts, or earlier if an event manager starts it."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {canJoin && (
              <button
                type="button"
                onClick={() =>
                  void handleAction(
                        "join-session",
                        async () => {
                          if (liveState.canManageEvent) {
                        await startEventSession(eventId, configuredRounds, configuredBestOf);
                          }
                          await joinEventSession(eventId);
                        },
                    liveState.canManageEvent ? "Started and joined the live event room." : "Joined the live event room.",
                  )
                }
                disabled={pendingAction === "join-session"}
                className="theme-button rounded-md px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {liveState.canManageEvent ? "Start And Join Live Event" : "Join Live Event"}
              </button>
            )}
          </div>

          {liveState.canManageEvent && (
            <div className="mt-4 grid max-w-md gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-theme-foreground" htmlFor="prestart-rounds">
                  Initial total rounds
                </label>
                <input
                  id="prestart-rounds"
                  type="number"
                  min={1}
                  max={20}
                  value={configuredRounds}
                  onChange={(event) => setConfiguredRounds(Number(event.target.value))}
                  className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
                  style={{ borderColor: "var(--theme-border-soft)" }}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-theme-foreground" htmlFor="prestart-best-of">
                  Match format
                </label>
                <select
                  id="prestart-best-of"
                  value={configuredBestOf}
                  onChange={(event) => setConfiguredBestOf(normalizeLiveEventBestOf(Number(event.target.value)))}
                  className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
                  style={{ borderColor: "var(--theme-border-soft)" }}
                >
                  <option value={1}>Best of 1</option>
                  <option value={3}>Best of 3</option>
                </select>
              </div>
            </div>
          )}
        </section>
      ) : (
        <>
          <LiveEventBanner
            event={liveState.event}
            session={liveState.session}
            currentRound={liveState.currentRound}
            connectedCount={connectedAttendees.length}
            canManageEvent={liveState.canManageEvent}
            pending={pendingAction === "save-rounds"}
            stopTimerPending={pendingAction === "stop-timer"}
            resetRoundPending={pendingAction === "reset-round"}
            configuredRounds={configuredRounds}
            configuredBestOf={configuredBestOf}
            timerRemainingSeconds={timerRemainingSeconds}
            onConfiguredRoundsChange={setConfiguredRounds}
            onConfiguredBestOfChange={setConfiguredBestOf}
            onSaveSettings={() =>
              handleAction(
                "save-rounds",
                async () => {
                  await configureEventSession(liveState.session!.session_id, configuredRounds, configuredBestOf);
                },
                "Updated live event settings.",
              )
            }
            onStopTimer={() =>
              handleAction(
                "stop-timer",
                async () => {
                  if (!liveState.currentRound) {
                    throw new Error("There is no active round timer to stop.");
                  }

                  await stopEventRoundTimer(liveState.currentRound.round_id);
                },
                "Stopped the round timer.",
              )
            }
            onResetRound={async () => {
              if (!liveState.currentRound) {
                setError("There is no active round to reset.");
                return;
              }

              const shouldResetRound = window.confirm(
                "Reset this round? This should clear the current round timer, votes, pairings, and reported results.",
              );

              if (!shouldResetRound) {
                return;
              }

              await handleAction(
                "reset-round",
                async () => {
                  await resetEventRound(liveState.currentRound!.round_id);
                },
                "Reset the current round.",
              );
            }}
          />

          {!hasJoinedSession ? (
            <section className="theme-card rounded-xl p-6">
              <h2 className="text-xl font-semibold text-theme-foreground">
                {canJoin ? "Join This Live Room" : "Live Room Closed"}
              </h2>
              <p className="mt-2 text-theme-muted">
                {canJoin
                  ? "The event session is already active. Join now to pick your deck and start tracking your rounds."
                  : "New entries close once round play begins, or 10 minutes after the scheduled event start if the room never starts."}
              </p>
              {canJoin && (
                <button
                  type="button"
                  onClick={() =>
                    void handleAction(
                      "join-active-session",
                      async () => {
                        if (!isLiveEventAvailable(liveState.event, liveState.session)) {
                          throw new Error("This live room is no longer accepting new attendees.");
                        }

                        await joinEventSession(eventId);
                      },
                      "Joined the live event room.",
                    )
                  }
                  disabled={pendingAction === "join-active-session"}
                  className="theme-button mt-4 rounded-md px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Join Active Room
                </button>
              )}
            </section>
          ) : (
            <>
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <DeckSelectionPanel
                  decks={decks}
                  selectedDeckId={selectedDeckId}
                  pending={pendingAction === "select-deck" || isSessionLocked || roundTimerStarted}
                  onSelectDeck={(deckId) =>
                    handleAction(
                      "select-deck",
                      async () => {
                        await selectEventDeck(liveState.session!.session_id, deckId);
                      },
                      "Updated your event deck.",
                    )
                  }
                />

                <CurrentRecordCard attendee={liveState.currentUserAttendee} summary={liveState.summary} />
              </div>

              {isSessionLocked ? (
                <section className="theme-card rounded-xl p-5">
                  <h2 className="text-lg font-semibold text-theme-foreground">Event Complete</h2>
                  <p className="mt-2 text-sm text-theme-muted">
                    This live event is now locked. Your recorded rounds and statistics are available below in round history.
                  </p>
                </section>
              ) : !hasSelectedDeck ? (
                <section className="theme-card rounded-xl p-5">
                  <h2 className="text-lg font-semibold text-theme-foreground">Step 1: Choose Your Deck</h2>
                  <p className="mt-2 text-sm text-theme-muted">
                    Select your deck before you can lock an opponent and participate in the round flow.
                  </p>
                </section>
              ) : !hasLockedOpponent && !roundTimerStarted ? (
                <>
                  <section className="theme-card rounded-xl p-5">
                    <h2 className="text-lg font-semibold text-theme-foreground">Step 2: Choose Your Opponent</h2>
                    <p className="mt-2 text-sm text-theme-muted">
                      Pair against a connected attendee or choose Other Player for someone outside the app.
                    </p>
                  </section>
                  <OpponentSelectionPanel
                    attendees={connectedAttendees}
                    currentUserId={liveState.currentUserId}
                    currentMatch={liveState.currentUserMatch}
                    selectedOpponentUserId={selectedOpponentUserId}
                    otherOpponentLabel={otherOpponentLabel}
                    pending={pendingAction === "create-match"}
                    onOpponentUserIdChange={(value) => {
                      setSelectedOpponentUserId(value);
                      if (value !== "other") {
                        setOtherOpponentLabel("");
                      }
                    }}
                    onOtherOpponentLabelChange={setOtherOpponentLabel}
                    onCreateMatch={() =>
                      handleAction(
                        "create-match",
                        async () => {
                          if (!liveState.currentRound) {
                            throw new Error("There is no active round to pair for.");
                          }

                          if (selectedOpponentUserId === "other") {
                            await createOrUpdateMatch(liveState.currentRound.round_id, null, otherOpponentLabel);
                            return;
                          }

                          if (!selectedOpponentUserId) {
                            throw new Error("Select an opponent before locking your match.");
                          }

                          await createOrUpdateMatch(liveState.currentRound.round_id, selectedOpponentUserId, "");
                        },
                        "Updated your round pairing.",
                      )
                    }
                  />
                </>
              ) : !hasLockedOpponent ? (
                <section className="theme-card rounded-xl p-5">
                  <h2 className="text-lg font-semibold text-theme-foreground">Round Already Started</h2>
                  <p className="mt-2 text-sm text-theme-muted">
                    The shared timer is already running for this round, so pairings are locked. Wait for the current round to finish before joining the next one.
                  </p>
                </section>
              ) : !canStartEvent ? (
                <section className="theme-card rounded-xl p-5">
                  <h2 className="text-lg font-semibold text-theme-foreground">Waiting For Another Player</h2>
                  <p className="mt-2 text-sm text-theme-muted">
                    At least 2 connected attendees are required before the event can start. Keep the room open so late arrivals can join during the 10-minute grace window.
                  </p>
                </section>
              ) : !roundTimerStarted ? (
                <>
                  <section className="theme-card rounded-xl p-5">
                    <h2 className="text-lg font-semibold text-theme-foreground">Step 3: Vote To Start The Round</h2>
                    <p className="mt-2 text-sm text-theme-muted">
                      Everyone locks their pairing first, then connected attendees vote on the shared timer length. The timer begins automatically once a majority agrees.
                    </p>
                  </section>
                  <RoundTimerVotePanel
                    currentRound={liveState.currentRound}
                    votes={liveState.votes}
                    connectedCount={connectedAttendees.length}
                    currentUserId={liveState.currentUserId}
                    customMinutes={customTimerMinutes}
                    pending={pendingAction === "vote-timer"}
                    onCustomMinutesChange={handleCustomTimerMinutesChange}
                    onCustomMinutesBlur={handleCustomTimerMinutesBlur}
                    onVote={(minutes) =>
                      handleAction(
                        "vote-timer",
                        async () => {
                          if (!liveState.currentRound) {
                            throw new Error("There is no active round to vote on.");
                          }
                          if (connectedAttendees.length < 2) {
                            throw new Error("At least 2 connected attendees are required before the event can start.");
                          }
                          if (!isValidTimerMinutes(minutes)) {
                            throw new Error("Round timers must be whole minutes between 1 and 90.");
                          }

                          await voteRoundTimer(liveState.currentRound.round_id, minutes);
                        },
                        "Submitted your timer vote.",
                      )
                    }
                  />
                </>
              ) : !roundTimerExpired ? (
                <section className="theme-card rounded-xl p-6 text-center">
                  <h2 className="text-2xl font-semibold text-theme-foreground">Round In Progress</h2>
                  <p className="mt-2 text-theme-muted">
                    Match vs <span className="font-medium text-theme-foreground">{getOpponentName(liveState)}</span>
                  </p>
                  <div className="mt-6 text-6xl font-semibold text-theme-foreground">
                    {Math.floor((timerRemainingSeconds ?? 0) / 60)}:{String((timerRemainingSeconds ?? 0) % 60).padStart(2, "0")}
                  </div>
                  <p className="mt-3 text-sm text-theme-muted">
                    The round timer is shared across the room. Results unlock for everyone once the countdown reaches zero.
                  </p>
                </section>
              ) : !hasSubmittedResult ? (
                <>
                  <section className="theme-card rounded-xl p-5">
                    <h2 className="text-lg font-semibold text-theme-foreground">Step 4: Report Your Result</h2>
                    <p className="mt-2 text-sm text-theme-muted">
                      The round timer is complete. Record the match outcome, game score, and any notes you want saved for later stats.
                    </p>
                  </section>
                  <MatchResultPanel
                    currentMatch={liveState.currentUserMatch}
                    existingStat={existingStat}
                    opponentName={getOpponentName(liveState)}
                    bestOf={matchBestOf}
                    pending={pendingAction === "report-result"}
                    onSubmit={(payload: MatchResultPayload) =>
                      handleAction(
                        "report-result",
                        async () => handleReportMatchResult(payload),
                        "Saved your match report.",
                      )
                    }
                  />
                </>
              ) : isCurrentMatchDisputed ? (
                <>
                  <section className="theme-card rounded-xl p-5">
                    <h2 className="text-lg font-semibold text-theme-foreground">Disputed Result</h2>
                    <p className="mt-2 text-sm text-theme-muted">
                      Your opponent reported a conflicting outcome for this round. Update your result so both players can agree on the final score.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditingDisputedResult((prev) => !prev)}
                        className="theme-button rounded-md px-4 py-2 text-sm"
                      >
                        {isEditingDisputedResult ? "Hide Edit Form" : "Edit My Result"}
                      </button>
                    </div>
                  </section>
                  {isEditingDisputedResult && (
                    <MatchResultPanel
                      currentMatch={liveState.currentUserMatch}
                      existingStat={existingStat}
                      opponentName={getOpponentName(liveState)}
                      bestOf={matchBestOf}
                      pending={pendingAction === "report-result"}
                      onSubmit={(payload: MatchResultPayload) =>
                        handleAction(
                          "report-result",
                          async () => handleReportMatchResult(payload, { closeDisputedEditor: true }),
                          "Updated your match report.",
                        )
                      }
                    />
                  )}
                </>
              ) : !roundResultsSettled ? (
                <>
                  <section className="theme-card rounded-xl p-5">
                    <h2 className="text-lg font-semibold text-theme-foreground">Step 5: Wait For The Room</h2>
                    <p className="mt-2 text-sm text-theme-muted">
                      Your result has been saved. Once all round results are confirmed, progression voting will open for the room.
                    </p>
                    {liveState.currentUserMatch && (
                      <p className="mt-2 text-sm text-theme-muted">
                        Match status: <span className="font-medium text-theme-foreground">{liveState.currentUserMatch.result_status}</span>
                      </p>
                    )}
                  </section>
                </>
              ) : (
                <>
                  <section className="theme-card rounded-xl p-5">
                    <h2 className="text-lg font-semibold text-theme-foreground">Step 5: Vote With The Room</h2>
                    <p className="mt-2 text-sm text-theme-muted">
                      All results are settled for this round. Vote with the room to continue to the next round or finish the event.
                    </p>
                    {liveState.currentUserMatch && (
                      <p className="mt-2 text-sm text-theme-muted">
                        Match status: <span className="font-medium text-theme-foreground">{liveState.currentUserMatch.result_status}</span>
                        {currentUserProgressVote ? (
                          <>
                            {" · "}
                            Your vote: <span className="font-medium text-theme-foreground">{currentUserProgressVote}</span>
                          </>
                        ) : null}
                      </p>
                    )}
                  </section>
                  <RoundProgressVotePanel
                    progressVotes={liveState.progressVotes}
                    connectedCount={connectedAttendees.length}
                    currentUserId={liveState.currentUserId}
                    isFinalRound={Boolean(isFinalRound)}
                    pending={pendingAction === "vote-progress"}
                    onVote={(action: LiveEventProgressAction) =>
                      handleAction(
                        "vote-progress",
                        async () => {
                          await voteRoundProgress(liveState.session!.session_id, action);
                        },
                        action === "finish" ? "Submitted your finish vote." : "Submitted your next-round vote.",
                      )
                    }
                  />
                </>
              )}

              <RoundHistoryList
                currentUserId={liveState.currentUserId}
                rounds={liveState.rounds}
                matches={liveState.matches}
                stats={liveState.currentUserStats}
                attendees={liveState.attendees}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}
