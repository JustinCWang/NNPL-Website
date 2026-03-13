/*
  Deck validation helpers.
  - Calculates total card counts and estimated deck price
  - Applies first-version validation rules for saved decklists
*/

import type { DecklistCard } from "@/types/decklist";

export const TARGET_DECK_SIZE = 60;
export const MAX_NON_ENERGY_COPIES = 4;

const BASIC_ENERGY_NAMES = new Set([
  "Basic Grass Energy",
  "Basic Fire Energy",
  "Basic Water Energy",
  "Basic Lightning Energy",
  "Basic Psychic Energy",
  "Basic Fighting Energy",
  "Basic Darkness Energy",
  "Basic Metal Energy",
]);

export interface DeckValidationResult {
  totalCards: number;
  uniqueCards: number;
  estimatedPrice: number;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export function getDeckTotalCards(cards: DecklistCard[]): number {
  return cards.reduce((total, card) => total + card.quantity, 0);
}

export function getDeckEstimatedPrice(cards: DecklistCard[]): number {
  return cards.reduce((total, card) => total + (card.market_price ?? 0) * card.quantity, 0);
}

export function isBasicEnergyCard(cardName: string): boolean {
  if (BASIC_ENERGY_NAMES.has(cardName)) {
    return true;
  }

  return /^Basic .+ Energy$/i.test(cardName.trim());
}

export function canIgnoreCopyLimit(card: Pick<DecklistCard, "name" | "regulation_mark">): boolean {
  if (card.regulation_mark == null) {
    return true;
  }

  return isBasicEnergyCard(card.name);
}

export function validateDecklist(name: string, cards: DecklistCard[]): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trimmedName = name.trim();
  const totalCards = getDeckTotalCards(cards);
  const estimatedPrice = getDeckEstimatedPrice(cards);

  if (!trimmedName) {
    errors.push("Deck name is required.");
  }

  if (cards.length === 0) {
    errors.push("Add at least one card before saving your deck.");
  }

  cards.forEach((card) => {
    if (!Number.isInteger(card.quantity) || card.quantity < 1) {
      errors.push(`"${card.name}" must have a quantity of at least 1.`);
    }

    if (!canIgnoreCopyLimit(card) && card.quantity > MAX_NON_ENERGY_COPIES) {
      errors.push(`"${card.name}" cannot exceed ${MAX_NON_ENERGY_COPIES} copies in this version of deck validation.`);
    }

    if (card.market_price == null) {
      warnings.push(`"${card.name}" is missing pricing data, so the deck total may be incomplete.`);
    }
  });

  if (totalCards !== TARGET_DECK_SIZE) {
    errors.push(`Decks must contain exactly ${TARGET_DECK_SIZE} cards. This deck currently has ${totalCards}.`);
  }

  return {
    totalCards,
    uniqueCards: cards.length,
    estimatedPrice,
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}
