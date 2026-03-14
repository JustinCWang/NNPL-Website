"use client";

import type { EventRoundProgressVote, LiveEventProgressAction } from "@/types/liveEvent";

interface RoundProgressVotePanelProps {
  progressVotes: EventRoundProgressVote[];
  currentUserId: string;
  isFinalRound: boolean;
  pending: boolean;
  dropPending: boolean;
  canDrop: boolean;
  requiredPairVotes: number;
  advancePairVotes: number;
  finishPairVotes: number;
  onVote: (action: LiveEventProgressAction) => void | Promise<void>;
  onDrop: () => void | Promise<void>;
}

export default function RoundProgressVotePanel({
  progressVotes,
  currentUserId,
  isFinalRound,
  pending,
  dropPending,
  canDrop,
  requiredPairVotes,
  advancePairVotes,
  finishPairVotes,
  onVote,
  onDrop,
}: RoundProgressVotePanelProps) {
  const currentUserVote = progressVotes.find((vote) => vote.user_id === currentUserId)?.action ?? null;

  return (
    <section className="theme-card rounded-xl p-5">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-theme-foreground">
          {isFinalRound ? "Finish Event Vote" : "Next Round Vote"}
        </h2>
        <p className="text-sm text-theme-muted">
          Once results are in, each active finished pairing gets one counted vote to continue the event flow.
        </p>
        <p className="text-sm text-theme-muted">
          Pair votes needed: <span className="font-medium text-theme-foreground">{requiredPairVotes}</span>
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
            Advance Round ({advancePairVotes})
          </button>
        )}

        <button
          type="button"
          onClick={() => void onVote("finish")}
          disabled={pending || !isFinalRound}
          className={`${currentUserVote === "finish" ? "theme-button" : "theme-button-ghost"} rounded-md px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          Finish Event ({finishPairVotes})
        </button>

        <button
          type="button"
          onClick={() => void onDrop()}
          disabled={!canDrop || dropPending}
          className="theme-button-ghost rounded-md px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {dropPending ? "Dropping..." : "Drop After Round"}
        </button>
      </div>
    </section>
  );
}
