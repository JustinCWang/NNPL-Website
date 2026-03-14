"use client";

import type { EventPlayerSummary, EventSessionAttendee } from "@/types/liveEvent";

interface CurrentRecordCardProps {
  attendee: EventSessionAttendee | null;
  summary: EventPlayerSummary | null;
  compact?: boolean;
}

export default function CurrentRecordCard({ attendee, summary, compact = false }: CurrentRecordCardProps) {
  const wins = attendee?.current_record_wins ?? 0;
  const losses = attendee?.current_record_losses ?? 0;
  const ties = attendee?.current_record_ties ?? 0;
  const statItems = [
    { label: "Rounds", value: String(summary?.rounds_played ?? wins + losses + ties) },
    {
      label: "Games",
      value: `${summary?.total_games_won ?? 0}-${summary?.total_games_lost ?? 0}-${summary?.total_games_tied ?? 0}`,
    },
    { label: "Went First", value: String(summary?.went_first_count ?? 0) },
    {
      label: "Avg Time",
      value: summary?.average_round_duration_minutes ? `${summary.average_round_duration_minutes}m` : "N/A",
    },
  ];

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

      {compact ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--theme-border-soft)" }}
            >
              <div className="text-[11px] uppercase tracking-wide text-theme-muted">{item.label}</div>
              <div className="mt-1 text-base font-semibold text-theme-foreground">{item.value}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border p-4"
              style={{ borderColor: "var(--theme-border-soft)" }}
            >
              <div className="text-xs uppercase tracking-wide text-theme-muted">{item.label}</div>
              <div className="mt-1 text-xl font-semibold text-theme-foreground">{item.value}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
