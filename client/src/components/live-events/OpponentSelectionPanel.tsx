"use client";

import type { EventRoundMatch, EventSessionAttendee } from "@/types/liveEvent";

interface OpponentSelectionPanelProps {
  attendees: EventSessionAttendee[];
  currentUserId: string;
  currentMatch: EventRoundMatch | null;
  selectedOpponentUserId: string;
  otherOpponentLabel: string;
  pending: boolean;
  onOpponentUserIdChange: (value: string) => void;
  onOtherOpponentLabelChange: (value: string) => void;
  onCreateMatch: () => void | Promise<void>;
}

function getCurrentOpponentLabel(
  currentMatch: EventRoundMatch | null,
  attendees: EventSessionAttendee[],
  currentUserId: string,
): string {
  if (!currentMatch) {
    return "No opponent selected yet";
  }

  if (currentMatch.source_type === "other_player") {
    return currentMatch.opponent_label ?? "Other Player";
  }

  const opponentId =
    currentMatch.player_user_id === currentUserId ? currentMatch.opponent_user_id : currentMatch.player_user_id;
  const opponent = attendees.find((attendee) => attendee.user_id === opponentId);
  return opponent?.display_name ?? "Connected attendee";
}

export default function OpponentSelectionPanel({
  attendees,
  currentUserId,
  currentMatch,
  selectedOpponentUserId,
  otherOpponentLabel,
  pending,
  onOpponentUserIdChange,
  onOtherOpponentLabelChange,
  onCreateMatch,
}: OpponentSelectionPanelProps) {
  const availableOpponents = attendees.filter(
    (attendee) =>
      attendee.user_id !== currentUserId &&
      attendee.is_connected &&
      Date.now() - new Date(attendee.last_seen_at).getTime() <= 90_000,
  );

  return (
    <section className="theme-card rounded-xl p-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-theme-foreground">Opponent</h2>
        <p className="text-sm text-theme-muted">
          Pair yourself with another connected attendee or use Other Player for someone not using the app.
        </p>
        <p className="text-sm text-theme-muted">
          Current match: <span className="font-medium text-theme-foreground">{getCurrentOpponentLabel(currentMatch, attendees, currentUserId)}</span>
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div>
          <label className="mb-2 block text-sm font-medium text-theme-foreground" htmlFor="live-opponent-select">
            Connected attendee
          </label>
          <select
            id="live-opponent-select"
            value={selectedOpponentUserId}
            onChange={(event) => onOpponentUserIdChange(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: "var(--theme-border-soft)" }}
          >
            <option value="">Select an opponent</option>
            {availableOpponents.map((attendee) => (
              <option key={attendee.user_id} value={attendee.user_id}>
                {attendee.display_name}
              </option>
            ))}
            <option value="other">Other Player</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-theme-foreground" htmlFor="live-other-player">
            Other player name
          </label>
          <input
            id="live-other-player"
            type="text"
            value={otherOpponentLabel}
            onChange={(event) => onOtherOpponentLabelChange(event.target.value)}
            placeholder="Enter a name or label"
            disabled={selectedOpponentUserId !== "other"}
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent disabled:opacity-60"
            style={{ borderColor: "var(--theme-border-soft)" }}
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void onCreateMatch()}
            disabled={pending || (!selectedOpponentUserId && !currentMatch)}
            className="theme-button rounded-md px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {currentMatch ? "Update Match" : "Lock Opponent"}
          </button>
        </div>
      </div>
    </section>
  );
}
