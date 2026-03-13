"use client";

import { formatDisplayDate, formatDisplayTime, formatTimeZoneLabel } from "@/lib/dateUtils";
import type { Event } from "@/types/event";
import type { EventSession, EventSessionRound } from "@/types/liveEvent";

interface LiveEventBannerProps {
  event: Event;
  session: EventSession;
  currentRound: EventSessionRound | null;
  connectedCount: number;
  canManageEvent: boolean;
  pending: boolean;
  configuredRounds: number;
  timerRemainingSeconds: number | null;
  onConfiguredRoundsChange: (value: number) => void;
  onSaveRounds: () => void | Promise<void>;
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
  configuredRounds,
  timerRemainingSeconds,
  onConfiguredRoundsChange,
  onSaveRounds,
}: LiveEventBannerProps) {
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
              {currentRound?.timer_minutes ? `${currentRound.timer_minutes} min` : "Vote"}
            </div>
            <div className="text-sm text-theme-muted">{formatTimerLabel(currentRound, timerRemainingSeconds)}</div>
          </div>

          <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border-soft)" }}>
            <div className="text-xs uppercase tracking-wide text-theme-muted">Connected</div>
            <div className="mt-1 text-2xl font-semibold text-theme-foreground">{connectedCount}</div>
            <div className="text-sm text-theme-muted">Majority start requires over half of connected attendees.</div>
          </div>

          <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border-soft)" }}>
            <div className="text-xs uppercase tracking-wide text-theme-muted">Total Rounds</div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={session.current_round}
                max={20}
                value={configuredRounds}
                onChange={(event) => onConfiguredRoundsChange(Number(event.target.value))}
                className="w-20 rounded-md border px-3 py-2 text-sm bg-transparent"
                style={{ borderColor: "var(--theme-border-soft)" }}
              />
              <button
                type="button"
                onClick={() => void onSaveRounds()}
                disabled={pending || session.status === "completed"}
                className="theme-button rounded-md px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
            <div className="mt-2 text-sm text-theme-muted">
              {canManageEvent ? "Managers can override this at any time." : "Anyone in the room can keep rounds in sync."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
