"use client";

import { useEffect, useState } from "react";
import type { EventPlayerRoundStat, EventRoundMatch, LiveEventResult, MatchResultPayload } from "@/types/liveEvent";

interface MatchResultPanelProps {
  currentMatch: EventRoundMatch | null;
  existingStat: EventPlayerRoundStat | null;
  opponentName: string;
  pending: boolean;
  onSubmit: (payload: MatchResultPayload) => void | Promise<void>;
}

export default function MatchResultPanel({
  currentMatch,
  existingStat,
  opponentName,
  pending,
  onSubmit,
}: MatchResultPanelProps) {
  const [roundResult, setRoundResult] = useState<LiveEventResult>("win");
  const [gamesWon, setGamesWon] = useState("2");
  const [gamesLost, setGamesLost] = useState("0");
  const [gamesTied, setGamesTied] = useState("0");
  const [wentFirst, setWentFirst] = useState("");
  const [roundDurationMinutes, setRoundDurationMinutes] = useState("");
  const [opponentArchetype, setOpponentArchetype] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!existingStat) {
      return;
    }

    setRoundResult(existingStat.round_result);
    setGamesWon(String(existingStat.games_won));
    setGamesLost(String(existingStat.games_lost));
    setGamesTied(String(existingStat.games_tied));
    setWentFirst(existingStat.went_first === null ? "" : existingStat.went_first ? "yes" : "no");
    setRoundDurationMinutes(existingStat.round_duration_minutes ? String(existingStat.round_duration_minutes) : "");
    setOpponentArchetype(existingStat.opponent_archetype ?? "");
    setNotes(existingStat.notes ?? "");
  }, [existingStat]);

  if (!currentMatch) {
    return (
      <section className="theme-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-theme-foreground">Match Result</h2>
        <p className="mt-2 text-sm text-theme-muted">
          Choose an opponent first, then report the match outcome and round details here.
        </p>
      </section>
    );
  }

  return (
    <section className="theme-card rounded-xl p-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-theme-foreground">Report Match</h2>
        <p className="text-sm text-theme-muted">
          Opponent: <span className="font-medium text-theme-foreground">{opponentName}</span>
          {" · "}
          Match status: <span className="font-medium text-theme-foreground">{currentMatch.result_status}</span>
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-theme-foreground" htmlFor="round-result">
            Round result
          </label>
          <select
            id="round-result"
            value={roundResult}
            onChange={(event) => setRoundResult(event.target.value as LiveEventResult)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: "var(--theme-border-soft)" }}
          >
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="tie">Tie</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-theme-foreground" htmlFor="round-duration">
            Round duration (minutes)
          </label>
          <input
            id="round-duration"
            type="number"
            min={1}
            max={180}
            value={roundDurationMinutes}
            onChange={(event) => setRoundDurationMinutes(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: "var(--theme-border-soft)" }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-theme-foreground" htmlFor="games-won">
              Games won
            </label>
            <input
              id="games-won"
              type="number"
              min={0}
              value={gamesWon}
              onChange={(event) => setGamesWon(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
              style={{ borderColor: "var(--theme-border-soft)" }}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-theme-foreground" htmlFor="games-lost">
              Games lost
            </label>
            <input
              id="games-lost"
              type="number"
              min={0}
              value={gamesLost}
              onChange={(event) => setGamesLost(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
              style={{ borderColor: "var(--theme-border-soft)" }}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-theme-foreground" htmlFor="games-tied">
              Games tied
            </label>
            <input
              id="games-tied"
              type="number"
              min={0}
              value={gamesTied}
              onChange={(event) => setGamesTied(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
              style={{ borderColor: "var(--theme-border-soft)" }}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-theme-foreground" htmlFor="went-first">
            Went first?
          </label>
          <select
            id="went-first"
            value={wentFirst}
            onChange={(event) => setWentFirst(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: "var(--theme-border-soft)" }}
          >
            <option value="">Prefer not to say</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-theme-foreground" htmlFor="opponent-archetype">
            Opponent archetype
          </label>
          <input
            id="opponent-archetype"
            type="text"
            value={opponentArchetype}
            onChange={(event) => setOpponentArchetype(event.target.value)}
            placeholder="Example: Dragapult"
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: "var(--theme-border-soft)" }}
          />
        </div>

        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-medium text-theme-foreground" htmlFor="round-notes">
            Notes
          </label>
          <textarea
            id="round-notes"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Key observations, matchup notes, or anything useful to revisit later."
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: "var(--theme-border-soft)" }}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() =>
            void onSubmit({
              roundResult,
              gamesWon: Number(gamesWon || 0),
              gamesLost: Number(gamesLost || 0),
              gamesTied: Number(gamesTied || 0),
              wentFirst: wentFirst === "" ? null : wentFirst === "yes",
              roundDurationMinutes: roundDurationMinutes ? Number(roundDurationMinutes) : null,
              opponentArchetype,
              notes,
            })
          }
          disabled={pending}
          className="theme-button rounded-md px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {existingStat ? "Update Result" : "Report Result"}
        </button>
      </div>
    </section>
  );
}
