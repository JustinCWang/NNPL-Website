import type { DecklistSummary } from "@/types/decklist";
import type { Event } from "@/types/event";

export type LiveEventSessionStatus = "pending" | "active" | "completed";
export type LiveEventTimerStatus = "not_started" | "voting" | "running" | "expired" | "completed";
export type LiveEventRoundStatus = "pending" | "active" | "completed";
export type LiveEventMatchSource = "app_user" | "other_player";
export type LiveEventMatchStatus = "pending" | "reported" | "confirmed" | "disputed" | "unverified";
export type LiveEventResult = "win" | "loss" | "tie";
export type LiveEventProgressAction = "advance" | "finish";
export type LiveEventBestOf = 1 | 3;

export interface EventSession {
  session_id: string;
  event_id: string;
  status: LiveEventSessionStatus;
  total_rounds: number;
  best_of: LiveEventBestOf;
  current_round: number;
  timer_minutes: number | null;
  timer_status: LiveEventTimerStatus;
  timer_started_at: string | null;
  timer_expires_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  started_by: string | null;
}

export interface EventSessionAttendee {
  session_id: string;
  user_id: string;
  display_name: string;
  selected_deck_id: string | null;
  joined_at: string;
  last_seen_at: string;
  is_connected: boolean;
  current_record_wins: number;
  current_record_losses: number;
  current_record_ties: number;
}

export interface EventSessionRound {
  round_id: string;
  session_id: string;
  round_number: number;
  status: LiveEventRoundStatus;
  timer_minutes: number | null;
  timer_started_at: string | null;
  timer_expires_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface EventRoundTimerVote {
  round_id: string;
  user_id: string;
  requested_minutes: number;
  voted_at: string;
}

export interface EventRoundProgressVote {
  round_id: string;
  user_id: string;
  action: LiveEventProgressAction;
  voted_at: string;
}

export interface EventRoundMatch {
  match_id: string;
  round_id: string;
  player_user_id: string;
  opponent_user_id: string | null;
  opponent_label: string | null;
  source_type: LiveEventMatchSource;
  result_status: LiveEventMatchStatus;
  player_reported_result: LiveEventResult | null;
  opponent_reported_result: LiveEventResult | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventPlayerRoundStat {
  match_id: string;
  user_id: string;
  games_won: number;
  games_lost: number;
  games_tied: number;
  round_result: LiveEventResult;
  went_first: boolean | null;
  round_duration_minutes: number | null;
  opponent_archetype: string | null;
  notes: string | null;
  reported_at: string;
}

export interface EventPlayerSummary {
  session_id: string;
  user_id: string;
  deck_id: string | null;
  final_wins: number;
  final_losses: number;
  final_ties: number;
  rounds_played: number;
  total_games_won: number;
  total_games_lost: number;
  total_games_tied: number;
  went_first_count: number;
  average_round_duration_minutes: number | null;
  app_user_rounds: number;
  other_player_rounds: number;
  completed_at: string;
}

export interface LiveEventOverview {
  event: Event;
  session: EventSession | null;
  isLive: boolean;
  isCompleted: boolean;
  canJoin: boolean;
}

export interface LiveEventState {
  currentUserId: string;
  currentUserRole: string | null;
  canManageEvent: boolean;
  event: Event;
  session: EventSession | null;
  attendees: EventSessionAttendee[];
  rounds: EventSessionRound[];
  votes: EventRoundTimerVote[];
  progressVotes: EventRoundProgressVote[];
  matches: EventRoundMatch[];
  currentUserStats: EventPlayerRoundStat[];
  summary: EventPlayerSummary | null;
  currentRound: EventSessionRound | null;
  currentUserAttendee: EventSessionAttendee | null;
  currentUserMatch: EventRoundMatch | null;
}

export interface MatchResultPayload {
  roundResult: LiveEventResult;
  gamesWon: number;
  gamesLost: number;
  gamesTied: number;
  wentFirst: boolean | null;
  roundDurationMinutes: number | null;
  opponentArchetype: string;
  notes: string;
}

export interface LiveEventHistoryItem {
  summary: EventPlayerSummary;
  session: EventSession;
  event: Event;
  deckName: string | null;
}

export type DeckSelectionOption = Pick<
  DecklistSummary,
  | "deck_id"
  | "name"
  | "format"
  | "description"
  | "is_public"
  | "updated_at"
  | "total_cards"
  | "unique_cards"
  | "estimated_price"
>;
