"use client";

import { useMemo } from "react";
import type { EventRoundTimerVote, EventSessionRound } from "@/types/liveEvent";

const PRESET_TIMER_OPTIONS = [30, 50] as const;
const MIN_CUSTOM_TIMER_MINUTES = 1;
const MAX_CUSTOM_TIMER_MINUTES = 90;

interface RoundTimerVotePanelProps {
  currentRound: EventSessionRound | null;
  votes: EventRoundTimerVote[];
  connectedCount: number;
  currentUserId: string;
  customMinutes: string;
  pending: boolean;
  onCustomMinutesChange: (value: string) => void;
  onCustomMinutesBlur: () => void;
  onVote: (minutes: number) => void | Promise<void>;
}

function formatVoteCount(votes: EventRoundTimerVote[], minutes: number): number {
  return votes.filter((vote) => vote.requested_minutes === minutes).length;
}

function isPresetTimerOption(minutes: number): boolean {
  return PRESET_TIMER_OPTIONS.includes(minutes as (typeof PRESET_TIMER_OPTIONS)[number]);
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

function parseCustomTimerMinutes(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsedMinutes = Number.parseInt(value, 10);
  if (!Number.isInteger(parsedMinutes)) {
    return null;
  }

  if (parsedMinutes < MIN_CUSTOM_TIMER_MINUTES || parsedMinutes > MAX_CUSTOM_TIMER_MINUTES) {
    return null;
  }

  return parsedMinutes;
}

export default function RoundTimerVotePanel({
  currentRound,
  votes,
  connectedCount,
  currentUserId,
  customMinutes,
  pending,
  onCustomMinutesChange,
  onCustomMinutesBlur,
  onVote,
}: RoundTimerVotePanelProps) {
  const majorityRequired = useMemo(() => Math.floor(connectedCount / 2) + 1, [connectedCount]);
  const currentUserVote = votes.find((vote) => vote.user_id === currentUserId)?.requested_minutes ?? null;
  const leadingCustomTimerMinutes = useMemo(
    () => getLeadingCustomTimerMinutes(votes, currentUserId),
    [currentUserId, votes],
  );
  const parsedCustomMinutes = useMemo(() => parseCustomTimerMinutes(customMinutes), [customMinutes]);
  const displayedCustomMinutes = parsedCustomMinutes ?? leadingCustomTimerMinutes;
  const displayedCustomVoteCount =
    displayedCustomMinutes === null ? 0 : formatVoteCount(votes, displayedCustomMinutes);
  const displayedCustomVotesNeeded = Math.max(0, majorityRequired - displayedCustomVoteCount);
  const roomCustomVoteCount =
    leadingCustomTimerMinutes === null ? 0 : formatVoteCount(votes, leadingCustomTimerMinutes);
  const isCurrentUserOnCustomVote = currentUserVote !== null && !isPresetTimerOption(currentUserVote);
  const canVoteCustom = !pending && !!currentRound && parsedCustomMinutes !== null;

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
        {PRESET_TIMER_OPTIONS.map((minutes) => (
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              aria-label="Custom round timer in minutes"
              value={customMinutes}
              onChange={(event) => onCustomMinutesChange(event.target.value)}
              onBlur={onCustomMinutesBlur}
              className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
              style={{ borderColor: "var(--theme-border-soft)" }}
            />
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => {
                if (parsedCustomMinutes !== null) {
                  void onVote(parsedCustomMinutes);
                }
              }}
              disabled={!canVoteCustom}
              className={`${isCurrentUserOnCustomVote ? "theme-button" : "theme-button-ghost"} rounded-md px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              Vote
            </button>
          </div>
          <div className="mt-2 space-y-1 text-xs text-theme-muted">
            <div>
              {displayedCustomMinutes === null
                ? `Enter a whole number from ${MIN_CUSTOM_TIMER_MINUTES}-${MAX_CUSTOM_TIMER_MINUTES} minutes`
                : `${displayedCustomVoteCount} of ${majorityRequired} votes for ${displayedCustomMinutes} min${
                    displayedCustomVotesNeeded > 0 ? `, needs ${displayedCustomVotesNeeded} more` : ", ready to start"
                  }`}
            </div>
            {leadingCustomTimerMinutes !== null &&
              displayedCustomMinutes !== leadingCustomTimerMinutes && (
                <div>
                  Room custom vote: {leadingCustomTimerMinutes} min with {roomCustomVoteCount} vote
                  {roomCustomVoteCount === 1 ? "" : "s"}.
                </div>
              )}
          </div>
        </div>
      </div>
    </section>
  );
}
