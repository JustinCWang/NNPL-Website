"use client";

import { useMemo } from "react";
import type { EventRoundTimerVote, EventSessionRound } from "@/types/liveEvent";

interface RoundTimerVotePanelProps {
  currentRound: EventSessionRound | null;
  votes: EventRoundTimerVote[];
  connectedCount: number;
  currentUserId: string;
  customMinutes: string;
  pending: boolean;
  onCustomMinutesChange: (value: string) => void;
  onVote: (minutes: number) => void | Promise<void>;
}

function formatVoteCount(votes: EventRoundTimerVote[], minutes: number): number {
  return votes.filter((vote) => vote.requested_minutes === minutes).length;
}

export default function RoundTimerVotePanel({
  currentRound,
  votes,
  connectedCount,
  currentUserId,
  customMinutes,
  pending,
  onCustomMinutesChange,
  onVote,
}: RoundTimerVotePanelProps) {
  const majorityRequired = useMemo(() => Math.floor(connectedCount / 2) + 1, [connectedCount]);
  const currentUserVote = votes.find((vote) => vote.user_id === currentUserId)?.requested_minutes ?? null;

  return (
    <section className="theme-card rounded-xl p-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-theme-foreground">Round Timer</h2>
        <p className="text-sm text-theme-muted">
          The timer starts only after a majority of connected attendees vote for the same duration.
        </p>
        <p className="text-sm text-theme-muted">
          Current round status: <span className="font-medium text-theme-foreground">{currentRound?.status ?? "pending"}</span>
          {" · "}
          Majority needed: <span className="font-medium text-theme-foreground">{majorityRequired}</span>
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[30, 50].map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => void onVote(minutes)}
            disabled={pending || !currentRound}
            className={`${currentUserVote === minutes ? "theme-button" : "theme-button-ghost"} rounded-md px-4 py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <div className="font-semibold">{minutes} min</div>
            <div className="text-xs opacity-80">{formatVoteCount(votes, minutes)} votes</div>
          </button>
        ))}

        <div className="rounded-lg border p-3" style={{ borderColor: "var(--theme-border-soft)" }}>
          <div className="text-sm font-medium text-theme-foreground">Custom</div>
          <div className="mt-2 flex gap-2">
            <input
              type="number"
              min={1}
              max={90}
              value={customMinutes}
              onChange={(event) => onCustomMinutesChange(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
              style={{ borderColor: "var(--theme-border-soft)" }}
            />
            <button
              type="button"
              onClick={() => void onVote(Number(customMinutes))}
              disabled={pending || !currentRound || !customMinutes}
              className="theme-button rounded-md px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Vote
            </button>
          </div>
          <div className="mt-2 text-xs text-theme-muted">
            {currentUserVote && ![30, 50].includes(currentUserVote) ? `${formatVoteCount(votes, currentUserVote)} votes for ${currentUserVote} min` : "1-90 minutes"}
          </div>
        </div>
      </div>
    </section>
  );
}
