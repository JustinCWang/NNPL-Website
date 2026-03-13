"use client";

import type {
  EventPlayerRoundStat,
  EventRoundMatch,
  EventSessionAttendee,
  EventSessionRound,
} from "@/types/liveEvent";

interface RoundHistoryListProps {
  currentUserId: string;
  rounds: EventSessionRound[];
  matches: EventRoundMatch[];
  stats: EventPlayerRoundStat[];
  attendees: EventSessionAttendee[];
}

function getOpponentName(
  currentUserId: string,
  match: EventRoundMatch,
  attendees: EventSessionAttendee[],
): string {
  if (match.source_type === "other_player") {
    return match.opponent_label ?? "Other Player";
  }

  const opponentId = match.player_user_id === currentUserId ? match.opponent_user_id : match.player_user_id;
  return attendees.find((attendee) => attendee.user_id === opponentId)?.display_name ?? "Connected attendee";
}

function getResultBadgeClasses(result: EventPlayerRoundStat["round_result"]) {
  if (result === "win") {
    return "bg-green-100 text-green-800";
  }
  if (result === "loss") {
    return "bg-red-100 text-red-800";
  }
  return "bg-yellow-100 text-yellow-800";
}

export default function RoundHistoryList({
  currentUserId,
  rounds,
  matches,
  stats,
  attendees,
}: RoundHistoryListProps) {
  const roundLookup = new Map(rounds.map((round) => [round.round_id, round]));
  const matchLookup = new Map(matches.map((match) => [match.match_id, match]));
  const statsWithContext = stats
    .map((stat) => {
      const match = matchLookup.get(stat.match_id);
      const round = match ? roundLookup.get(match.round_id) : undefined;

      if (!match || !round) {
        return null;
      }

      return {
        stat,
        match,
        round,
      };
    })
    .filter((item): item is { stat: EventPlayerRoundStat; match: EventRoundMatch; round: EventSessionRound } => item !== null)
    .sort((left, right) => left.round.round_number - right.round.round_number);

  return (
    <section className="theme-card rounded-xl p-5">
      <div>
        <h2 className="text-lg font-semibold text-theme-foreground">Round History</h2>
        <p className="mt-1 text-sm text-theme-muted">Your tracked rounds, game scores, and matchup notes for this event.</p>
      </div>

      {statsWithContext.length === 0 ? (
        <div className="mt-4 rounded-lg border p-4 text-sm text-theme-muted" style={{ borderColor: "var(--theme-border-soft)" }}>
          No round reports yet. Once you submit a result, your history will appear here.
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          {statsWithContext.map(({ stat, match, round }) => (
            <div key={stat.match_id} className="rounded-lg border p-4" style={{ borderColor: "var(--theme-border-soft)" }}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-theme-foreground">Round {round.round_number}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getResultBadgeClasses(stat.round_result)}`}>
                      {stat.round_result}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {match.result_status}
                    </span>
                  </div>
                  <p className="text-sm text-theme-muted">
                    Opponent: <span className="font-medium text-theme-foreground">{getOpponentName(currentUserId, match, attendees)}</span>
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-theme-muted">
                    <span>
                      Games: {stat.games_won}-{stat.games_lost}-{stat.games_tied}
                    </span>
                    <span>Went first: {stat.went_first === null ? "N/A" : stat.went_first ? "Yes" : "No"}</span>
                    <span>Duration: {stat.round_duration_minutes ? `${stat.round_duration_minutes} min` : "N/A"}</span>
                  </div>
                </div>

                {(stat.opponent_archetype || stat.notes) && (
                  <div className="max-w-xl space-y-1 text-sm text-theme-muted">
                    {stat.opponent_archetype && (
                      <p>
                        Archetype: <span className="font-medium text-theme-foreground">{stat.opponent_archetype}</span>
                      </p>
                    )}
                    {stat.notes && <p>{stat.notes}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
