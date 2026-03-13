/*
  Decklist API helpers.
  - Loads user-owned decklists from Supabase
  - Saves deck metadata and card snapshots through an atomic RPC
*/

import { getSupabaseClient } from "@/lib/supabaseClient";
import { getDeckEstimatedPrice, getDeckTotalCards, validateDecklist } from "@/lib/deckValidation";
import type { Decklist, DecklistCard, DecklistSummary, DecklistWithCards, SaveDecklistInput } from "@/types/decklist";

type DecklistRpcPayload = {
  card_key: string;
  quantity: number;
  set_id: string;
  local_id: string;
  name: string;
  image_url: string | null;
  set_name: string | null;
  card_number: string | null;
  market_price: number | null;
  regulation_mark: string | null | undefined;
};

function buildDeckSummary(deck: Decklist, cards: DecklistCard[]): DecklistSummary {
  return {
    ...deck,
    total_cards: getDeckTotalCards(cards),
    unique_cards: cards.length,
    estimated_price: getDeckEstimatedPrice(cards),
  };
}

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("You must be signed in to manage decklists.");
  }

  return data.user.id;
}

async function fetchCardsForDecks(deckIds: string[]): Promise<Record<string, DecklistCard[]>> {
  if (deckIds.length === 0) {
    return {};
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("DecklistCards")
    .select("*")
    .in("deck_id", deckIds)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  const cardsByDeck = new Map<string, DecklistCard[]>();

  (data ?? []).forEach((card) => {
    const deckCards = cardsByDeck.get(card.deck_id) ?? [];
    deckCards.push(card as DecklistCard);
    cardsByDeck.set(card.deck_id, deckCards);
  });

  return Object.fromEntries(cardsByDeck.entries());
}

function buildRpcPayload(cards: DecklistCard[]): DecklistRpcPayload[] {
  return cards.map((card) => ({
    card_key: card.card_key,
    quantity: card.quantity,
    set_id: card.set_id,
    local_id: card.local_id,
    name: card.name,
    image_url: card.image_url,
    set_name: card.set_name,
    card_number: card.card_number,
    market_price: card.market_price,
    regulation_mark: card.regulation_mark,
  }));
}

export async function fetchMyDecklists(): Promise<DecklistSummary[]> {
  const userId = await getAuthenticatedUserId();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("Decklists")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const decks = (data ?? []) as Decklist[];
  const cardsByDeck = await fetchCardsForDecks(decks.map((deck) => deck.deck_id));

  return decks.map((deck) => buildDeckSummary(deck, cardsByDeck[deck.deck_id] ?? []));
}

export async function fetchDecklist(deckId: string): Promise<DecklistWithCards | null> {
  const userId = await getAuthenticatedUserId();
  const supabase = getSupabaseClient();

  const { data: deckData, error: deckError } = await supabase
    .from("Decklists")
    .select("*")
    .eq("deck_id", deckId)
    .eq("user_id", userId)
    .maybeSingle();

  if (deckError) {
    throw deckError;
  }

  if (!deckData) {
    return null;
  }

  const { data: cardData, error: cardsError } = await supabase
    .from("DecklistCards")
    .select("*")
    .eq("deck_id", deckId)
    .order("name", { ascending: true });

  if (cardsError) {
    throw cardsError;
  }

  const cards = (cardData ?? []) as DecklistCard[];

  return {
    ...buildDeckSummary(deckData as Decklist, cards),
    cards,
  };
}

export async function saveDecklist(input: SaveDecklistInput): Promise<string> {
  const validation = validateDecklist(input.name, input.cards);

  if (!validation.isValid) {
    throw new Error(validation.errors[0] ?? "Deck validation failed.");
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("upsert_decklist", {
    p_deck_id: input.deck_id ?? null,
    p_name: input.name,
    p_format: input.format || null,
    p_description: input.description || null,
    p_is_public: input.is_public,
    p_cards: buildRpcPayload(input.cards),
  });

  if (error) {
    throw error;
  }

  return data as string;
}

export async function updateDecklistVisibility(deckId: string, isPublic: boolean): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("Decklists")
    .update({ is_public: isPublic })
    .eq("deck_id", deckId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function deleteDecklist(deckId: string): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("Decklists")
    .delete()
    .eq("deck_id", deckId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
