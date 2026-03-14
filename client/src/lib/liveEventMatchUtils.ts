import type { LiveEventBestOf, LiveEventResult, MatchResultPayload } from "@/types/liveEvent";

export function normalizeLiveEventBestOf(value: number | null | undefined): LiveEventBestOf {
  return value === 1 ? 1 : 3;
}

export function getLiveEventBestOfLabel(bestOf: LiveEventBestOf): string {
  return bestOf === 1 ? "Best of 1" : "Best of 3";
}

export function getGameCountOptions(_bestOf: LiveEventBestOf): number[] {
  return [0, 1, 2];
}

export function deriveMatchResultFromScore(payload: Pick<MatchResultPayload, "gamesWon" | "gamesLost">): LiveEventResult {
  if (payload.gamesWon > payload.gamesLost) {
    return "win";
  }

  if (payload.gamesLost > payload.gamesWon) {
    return "loss";
  }

  return "tie";
}

export function validateMatchResultPayload(payload: MatchResultPayload, bestOf: LiveEventBestOf): string | null {
  const values = [payload.gamesWon, payload.gamesLost, payload.gamesTied];

  if (values.some((value) => !Number.isInteger(value) || value < 0)) {
    return "Game counts must be whole numbers of zero or greater.";
  }

  const totalGames = payload.gamesWon + payload.gamesLost + payload.gamesTied;
  if (totalGames > bestOf) {
    return `${getLiveEventBestOfLabel(bestOf)} matches cannot have more than ${bestOf} game${bestOf === 1 ? "" : "s"}.`;
  }

  const derivedResult = deriveMatchResultFromScore(payload);
  if (derivedResult !== payload.roundResult) {
    return "Round result must match the completed game score.";
  }

  return null;
}
