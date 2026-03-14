"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deriveMatchResultFromScore,
  getGameCountOptions,
  getLiveEventBestOfLabel,
  validateMatchResultPayload,
} from "@/lib/liveEventMatchUtils";
import type {
  EventPlayerRoundStat,
  EventRoundMatch,
  LiveEventBestOf,
  LiveEventResult,
  MatchResultPayload,
} from "@/types/liveEvent";

interface MatchResultPanelProps {
  currentMatch: EventRoundMatch | null;
  existingStat: EventPlayerRoundStat | null;
  opponentName: string;
  bestOf: LiveEventBestOf;
  pending: boolean;
  onSubmit: (payload: MatchResultPayload) => void | Promise<void>;
}

type ScoreField = "gamesWon" | "gamesLost" | "gamesTied";

interface CountSelectorProps {
  label: string;
  value: number;
  options: number[];
  disabledOptions?: number[];
  onChange: (value: number) => void;
}

function CountSelector({ label, value, options, disabledOptions = [], onChange }: CountSelectorProps) {
  return (
    <div>
      <div className="mb-2 block text-sm font-medium text-theme-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isDisabled = disabledOptions.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              disabled={isDisabled}
              className={`${value === option ? "theme-button" : "theme-button-ghost"} min-w-10 rounded-md px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function normalizeScoreSelection(
  bestOf: LiveEventBestOf,
  field: ScoreField,
  value: number,
  currentScore: Record<ScoreField, number>,
): Record<ScoreField, number> {
  const nextScore = {
    ...currentScore,
    [field]: value,
  };

  if (bestOf === 1) {
    if (value === 1) {
      return {
        gamesWon: field === "gamesWon" ? 1 : 0,
        gamesLost: field === "gamesLost" ? 1 : 0,
        gamesTied: field === "gamesTied" ? 1 : 0,
      };
    }

    return nextScore;
  }

  if ((field === "gamesWon" || field === "gamesLost") && value === 2) {
    return {
      gamesWon: field === "gamesWon" ? 2 : 0,
      gamesLost: field === "gamesLost" ? 2 : 0,
      gamesTied: 0,
    };
  }

  return nextScore;
}

function getResultLabel(result: LiveEventResult): string {
  if (result === "win") {
    return "Win";
  }

  if (result === "loss") {
    return "Loss";
  }

  return "Tie";
}

export default function MatchResultPanel({
  currentMatch,
  existingStat,
  opponentName,
  bestOf,
  pending,
  onSubmit,
}: MatchResultPanelProps) {
  const [gamesWon, setGamesWon] = useState(0);
  const [gamesLost, setGamesLost] = useState(0);
  const [gamesTied, setGamesTied] = useState(0);
  const [wentFirst, setWentFirst] = useState<"" | "yes" | "no">("");
  const [roundDurationMinutes, setRoundDurationMinutes] = useState("");
  const [opponentArchetype, setOpponentArchetype] = useState("");
  const [notes, setNotes] = useState("");
  const gameCountOptions = useMemo(() => getGameCountOptions(bestOf), [bestOf]);
  const derivedRoundResult = useMemo<LiveEventResult>(
    () => deriveMatchResultFromScore({ gamesWon, gamesLost }),
    [gamesLost, gamesWon],
  );

  useEffect(() => {
    if (existingStat) {
      return;
    }

    setGamesWon(0);
    setGamesLost(0);
    setGamesTied(0);
  }, [bestOf, existingStat]);

  useEffect(() => {
    if (!existingStat) {
      return;
    }

    setGamesWon(existingStat.games_won);
    setGamesLost(existingStat.games_lost);
    setGamesTied(existingStat.games_tied);
    setWentFirst(existingStat.went_first === null ? "" : existingStat.went_first ? "yes" : "no");
    setRoundDurationMinutes(existingStat.round_duration_minutes ? String(existingStat.round_duration_minutes) : "");
    setOpponentArchetype(existingStat.opponent_archetype ?? "");
    setNotes(existingStat.notes ?? "");
  }, [existingStat]);

  const handleScoreChange = (field: ScoreField, value: number) => {
    const normalizedScore = normalizeScoreSelection(
      bestOf,
      field,
      value,
      { gamesWon, gamesLost, gamesTied },
    );

    setGamesWon(normalizedScore.gamesWon);
    setGamesLost(normalizedScore.gamesLost);
    setGamesTied(normalizedScore.gamesTied);
  };

  const submissionPayload = useMemo<MatchResultPayload>(
    () => ({
      roundResult: derivedRoundResult,
      gamesWon,
      gamesLost,
      gamesTied,
      wentFirst: wentFirst === "" ? null : wentFirst === "yes",
      roundDurationMinutes: roundDurationMinutes ? Number(roundDurationMinutes) : null,
      opponentArchetype,
      notes,
    }),
    [derivedRoundResult, gamesLost, gamesTied, gamesWon, notes, opponentArchetype, roundDurationMinutes, wentFirst],
  );

  const validationMessage = useMemo(
    () => validateMatchResultPayload(submissionPayload, bestOf),
    [bestOf, submissionPayload],
  );

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
          {" | "}
          Match status: <span className="font-medium text-theme-foreground">{currentMatch.result_status}</span>
        </p>
        <p className="text-sm text-theme-muted">
          Match format: <span className="font-medium text-theme-foreground">{getLiveEventBestOfLabel(bestOf)}</span>
        </p>
        <p className="text-sm text-theme-muted">
          Round result: <span className="font-medium text-theme-foreground">{getResultLabel(derivedRoundResult)}</span>
        </p>
        <p className="text-xs text-theme-muted">
          In best of 1, selecting a `1` forces the other scores to `0`. In best of 3, selecting `2` wins or losses
          closes out the match immediately. Leaving everything at `0` records the round as a tie.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
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

        <div>
          <div className="mb-2 block text-sm font-medium text-theme-foreground">Went first?</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setWentFirst("")}
              className={`${wentFirst === "" ? "theme-button" : "theme-button-ghost"} rounded-md px-3 py-2 text-sm`}
            >
              Don't Remember
            </button>
            <button
              type="button"
              onClick={() => setWentFirst("yes")}
              className={`${wentFirst === "yes" ? "theme-button" : "theme-button-ghost"} rounded-md px-3 py-2 text-sm`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setWentFirst("no")}
              className={`${wentFirst === "no" ? "theme-button" : "theme-button-ghost"} rounded-md px-3 py-2 text-sm`}
            >
              No
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:col-span-2 sm:grid-cols-3">
          <CountSelector
            label="Games won"
            value={gamesWon}
            options={gameCountOptions}
            disabledOptions={bestOf === 1 ? [2] : []}
            onChange={(value) => handleScoreChange("gamesWon", value)}
          />
          <CountSelector
            label="Games lost"
            value={gamesLost}
            options={gameCountOptions}
            disabledOptions={bestOf === 1 ? [2] : []}
            onChange={(value) => handleScoreChange("gamesLost", value)}
          />
          <CountSelector
            label="Games tied"
            value={gamesTied}
            options={gameCountOptions}
            disabledOptions={bestOf === 1 ? [2] : []}
            onChange={(value) => handleScoreChange("gamesTied", value)}
          />
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

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-red-600">{validationMessage ?? ""}</div>
        <button
          type="button"
          onClick={() => void onSubmit(submissionPayload)}
          disabled={pending || validationMessage !== null}
          className="theme-button rounded-md px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {existingStat ? "Update Result" : "Report Result"}
        </button>
      </div>
    </section>
  );
}
