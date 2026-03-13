"use client";

import type { EventRoundProgressVote, LiveEventProgressAction } from "@/types/liveEvent";

interface RoundProgressVotePanelProps {
  progressVotes: EventRoundProgressVote[];
  connectedCount: number;
  currentUserId: string;
  isFinalRound: boolean;
  pending: boolean;
  onVote: (action: LiveEventProgressAction) => void | Promise<void>;
}

function countVotes(progressVotes: EventRoundProgressVote[], action: LiveEventProgressAction) {
  return progressVotes.filter((vote) => vote.action === action).length;
}

export default function RoundProgressVotePanel({
  progressVotes,
  connectedCount,
  currentUserId,
  isFinalRound,
  pending,
  onVote,
}: RoundProgressVotePanelProps) {
  const currentUserVote = progressVotes.find((vote) => vote.user_id === currentUserId)?.action ?? null;
  const majorityRequired = Math.floor(connectedCount / 2) + 1;

  return (
    <section className="theme-card rounded-xl p-5">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-theme-foreground">
          {isFinalRound ? "Finish Event Vote" : "Next Round Vote"}
        </h2>
        <p className="text-sm text-theme-muted">
          Once results are in, connected attendees vote together to continue the event flow.
        </p>
        <p className="text-sm text-theme-muted">
          Majority needed: <span className="font-medium text-theme-foreground">{majorityRequired}</span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {!isFinalRound && (
          <button
            type="button"
            onClick={() => void onVote("advance")}
            disabled={pending}
            className={`${currentUserVote === "advance" ? "theme-button" : "theme-button-ghost"} rounded-md px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            Advance Round ({countVotes(progressVotes, "advance")})
          </button>
        )}

        <button
          type="button"
          onClick={() => void onVote("finish")}
          disabled={pending || !isFinalRound}
          className={`${currentUserVote === "finish" ? "theme-button" : "theme-button-ghost"} rounded-md px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          Finish Event ({countVotes(progressVotes, "finish")})
        </button>
      </div>
    </section>
  );
}
