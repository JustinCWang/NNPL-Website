"use client";

import { formatDisplayDate, formatDisplayTime, formatTimeZoneLabel } from "@/lib/dateUtils";
import { getLiveEventBestOfLabel } from "@/lib/liveEventMatchUtils";
import type { Event } from "@/types/event";
import type { EventSession, EventSessionRound, LiveEventBestOf } from "@/types/liveEvent";

interface LiveEventBannerProps {
  event: Event;
  session: EventSession;
  currentRound: EventSessionRound | null;
  connectedCount: number;
  canManageEvent: boolean;
  pending: boolean;
  stopTimerPending: boolean;
  resetRoundPending: boolean;
  configuredRounds: number;
  configuredBestOf: LiveEventBestOf;
  timerRemainingSeconds: number | null;
  isInTurns: boolean;
  onConfiguredRoundsChange: (value: number) => void;
  onConfiguredBestOfChange: (value: LiveEventBestOf) => void;
  onSaveSettings: () => void | Promise<void>;
  onStopTimer: () => void | Promise<void>;
  onResetRound: () => void | Promise<void>;
}

function formatTimerLabel(round: EventSessionRound | null, timerRemainingSeconds: number | null): string {
  if (!round) {
    return "No timer yet";
  }

  if (timerRemainingSeconds === null) {
    return round.status === "completed" ? "Round complete" : "Waiting for timer vote";
  }

  const minutes = Math.floor(timerRemainingSeconds / 60);
  const seconds = timerRemainingSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")} remaining`;
}

export default function LiveEventBanner({
  event,
  session,
  currentRound,
  connectedCount,
  canManageEvent,
  pending,
  stopTimerPending,
  resetRoundPending,
  configuredRounds,
  configuredBestOf,
  timerRemainingSeconds,
  isInTurns,
  onConfiguredRoundsChange,
  onConfiguredBestOfChange,
  onSaveSettings,
  onStopTimer,
  onResetRound,
}: LiveEventBannerProps) {
  const canStopTimer = canManageEvent && session.status !== "completed" && Boolean(currentRound?.timer_started_at);
  const canResetRound = canManageEvent && session.status !== "completed" && !!currentRound;
  const isSessionLocked = session.status === "completed";
  const timerSummaryLabel = isSessionLocked
    ? "Event complete"
    : formatTimerLabel(currentRound, timerRemainingSeconds);

  return (
    <section className="theme-card rounded-xl p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="theme-chip rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide">
              Live Event
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
              {session.status}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-theme-foreground">{event.name}</h1>
            <p className="mt-2 text-theme-muted">
              {formatDisplayDate(event.start_at, event.timezone)} at {formatDisplayTime(event.start_at, event.timezone)}
            </p>
            <p className="text-sm text-theme-muted">{formatTimeZoneLabel(event.timezone)}</p>
            {event.store && (
              <p className="mt-2 text-sm text-theme-muted">
                {event.store.name} · {event.store.location}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border-soft)" }}>
            <div className="text-xs uppercase tracking-wide text-theme-muted">Round</div>
            <div className="mt-1 text-2xl font-semibold text-theme-foreground">
              {session.current_round}/{session.total_rounds}
            </div>
            <div className="text-sm text-theme-muted">
              {currentRound ? `Round ${currentRound.round_number} is ${currentRound.status}` : "Waiting for round setup"}
            </div>
          </div>

          <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border-soft)" }}>
            <div className="text-xs uppercase tracking-wide text-theme-muted">Timer</div>
            <div className="mt-1 text-2xl font-semibold text-theme-foreground">
              {isSessionLocked ? "Stopped" : isInTurns ? "Turns" : currentRound?.timer_minutes ? `${currentRound.timer_minutes} min` : "Vote"}
            </div>
            <div className="text-sm text-theme-muted">{timerSummaryLabel}</div>
          </div>

          <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border-soft)" }}>
            <div className="text-xs uppercase tracking-wide text-theme-muted">Connected</div>
            <div className="mt-1 text-2xl font-semibold text-theme-foreground">{connectedCount}</div>
            <div className="text-sm text-theme-muted">
              Majority start requires over half of connected attendees.
            </div>
          </div>

          <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border-soft)" }}>
            <div className="text-xs uppercase tracking-wide text-theme-muted">Session Setup</div>
            <div className="mt-2 grid gap-2">
              <label className="text-xs font-medium text-theme-muted" htmlFor="live-total-rounds">
                Total rounds
              </label>
              <input
                id="live-total-rounds"
                type="number"
                min={session.current_round}
                max={20}
                value={configuredRounds}
                onChange={(event) => onConfiguredRoundsChange(Number(event.target.value))}
                disabled={isSessionLocked}
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
                style={{ borderColor: "var(--theme-border-soft)" }}
              />
              <label className="text-xs font-medium text-theme-muted" htmlFor="live-best-of">
                Match format
              </label>
              <select
                id="live-best-of"
                value={configuredBestOf}
                onChange={(event) => onConfiguredBestOfChange(Number(event.target.value) as LiveEventBestOf)}
                disabled={isSessionLocked}
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
                style={{ borderColor: "var(--theme-border-soft)" }}
              >
                <option value={1}>Best of 1</option>
                <option value={3}>Best of 3</option>
              </select>
              <button
                type="button"
                onClick={() => void onSaveSettings()}
                disabled={pending || isSessionLocked}
                className="theme-button rounded-md px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
            <div className="mt-2 text-sm text-theme-muted">
              Current format: {getLiveEventBestOfLabel(session.best_of)}.{" "}
              {isSessionLocked
                ? "Session setup is locked because this event is complete."
                : canManageEvent
                  ? "Managers can override this at any time."
                  : "Anyone in the room can keep rounds in sync."}
            </div>
          </div>
        </div>

        {canManageEvent && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void onStopTimer()}
              disabled={!canStopTimer || stopTimerPending}
              className="theme-button-ghost rounded-md px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {stopTimerPending ? "Stopping Timer..." : "Stop Timer"}
            </button>
            <button
              type="button"
              onClick={() => void onResetRound()}
              disabled={!canResetRound || resetRoundPending}
              className="theme-button-ghost rounded-md px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetRoundPending ? "Resetting Round..." : "Reset Round"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
