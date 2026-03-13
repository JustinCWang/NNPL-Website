/*
  TypeScript types for user decklists and deck builder helpers.
  - Models Decklists and DecklistCards from Supabase
  - Provides shared helpers for converting PokemonCard results into deck entries
*/

import type { PokemonCard } from "@/types/pokemonCard";

export const DECK_FORMAT_OPTIONS = [
  "Standard",
] as const;

export type DeckFormat = (typeof DECK_FORMAT_OPTIONS)[number];

export interface Decklist {
  deck_id: string;
  user_id: string;
  name: string;
  format: string | null;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DecklistCard {
  deck_id?: string;
  card_key: string;
  quantity: number;
  set_id: string;
  local_id: string;
  name: string;
  image_url: string | null;
  set_name: string | null;
  card_number: string | null;
  market_price: number | null;
  regulation_mark?: string | null;
}

export interface DecklistSummary extends Decklist {
  total_cards: number;
  unique_cards: number;
  estimated_price: number;
}

export interface DecklistWithCards extends DecklistSummary {
  cards: DecklistCard[];
}

export interface DecklistFormValues {
  name: string;
  format: DeckFormat;
  description: string;
  is_public: boolean;
}

export interface SaveDecklistInput extends DecklistFormValues {
  deck_id?: string;
  cards: DecklistCard[];
}

export function getPokemonCardKey(card: Pick<PokemonCard, "set_id" | "localId">): string {
  return `${card.set_id}:${card.localId}`;
}

export function mapPokemonCardToDecklistCard(card: PokemonCard, quantity = 1): DecklistCard {
  return {
    card_key: getPokemonCardKey(card),
    quantity,
    set_id: card.set_id,
    local_id: card.localId,
    name: card.name,
    image_url: card.image_url,
    set_name: card.set_name,
    card_number: card.card_number,
    market_price: card.market_price,
    regulation_mark: card.regulation_mark,
  };
}
