"use client";

import type { EventPlayerSummary, EventSessionAttendee } from "@/types/liveEvent";

interface CurrentRecordCardProps {
  attendee: EventSessionAttendee | null;
  summary: EventPlayerSummary | null;
}

export default function CurrentRecordCard({ attendee, summary }: CurrentRecordCardProps) {
  const wins = attendee?.current_record_wins ?? 0;
  const losses = attendee?.current_record_losses ?? 0;
  const ties = attendee?.current_record_ties ?? 0;

  return (
    <section className="theme-card rounded-xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-theme-foreground">Current Record</h2>
          <p className="mt-1 text-sm text-theme-muted">Your live tournament standing and tracked session stats.</p>
        </div>
        <div className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
          {wins}-{losses}-{ties}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border-soft)" }}>
          <div className="text-xs uppercase tracking-wide text-theme-muted">Rounds Played</div>
          <div className="mt-1 text-xl font-semibold text-theme-foreground">{summary?.rounds_played ?? wins + losses + ties}</div>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border-soft)" }}>
          <div className="text-xs uppercase tracking-wide text-theme-muted">Games</div>
          <div className="mt-1 text-xl font-semibold text-theme-foreground">
            {(summary?.total_games_won ?? 0)}-{(summary?.total_games_lost ?? 0)}-{(summary?.total_games_tied ?? 0)}
          </div>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border-soft)" }}>
          <div className="text-xs uppercase tracking-wide text-theme-muted">Went First</div>
          <div className="mt-1 text-xl font-semibold text-theme-foreground">{summary?.went_first_count ?? 0}</div>
        </div>
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border-soft)" }}>
          <div className="text-xs uppercase tracking-wide text-theme-muted">Avg Round Time</div>
          <div className="mt-1 text-xl font-semibold text-theme-foreground">
            {summary?.average_round_duration_minutes ? `${summary.average_round_duration_minutes}m` : "N/A"}
          </div>
        </div>
      </div>
    </section>
  );
}
