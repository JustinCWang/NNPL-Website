"use client";
/*
  Decklist management list.
  - Shows saved deck summaries with visibility and action controls
*/

import Link from "next/link";
import type { DecklistSummary } from "@/types/decklist";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

interface DecklistListProps {
  decks: DecklistSummary[];
  pendingDeckId?: string | null;
  onToggleVisibility: (deckId: string, isPublic: boolean) => void;
  onDeleteDeck: (deckId: string) => void;
}

export default function DecklistList({
  decks,
  pendingDeckId,
  onToggleVisibility,
  onDeleteDeck,
}: DecklistListProps) {
  if (decks.length === 0) {
    return (
      <div className="theme-card rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-theme-foreground">No decklists yet</h2>
        <p className="mt-2 text-theme-muted">
          Build your first deck to save card quantities, validation status, and notes in one place.
        </p>
        <Link href="/decklists/new" className="theme-button mt-4 inline-flex rounded-md px-4 py-2">
          Create Your First Deck
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {decks.map((deck) => {
        const isPending = pendingDeckId === deck.deck_id;

        return (
          <div key={deck.deck_id} className="theme-card rounded-lg p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-theme-foreground">{deck.name}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${deck.is_public ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                    {deck.is_public ? "Public" : "Private"}
                  </span>
                  {deck.format && (
                    <span className="theme-chip inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium">
                      {deck.format}
                    </span>
                  )}
                </div>

                {deck.description && (
                  <p className="text-theme-muted">{deck.description}</p>
                )}

                <div className="flex flex-wrap gap-3 text-sm text-theme-muted">
                  <span>{deck.total_cards} cards</span>
                  <span>{deck.unique_cards} unique</span>
                  <span>{currencyFormatter.format(deck.estimated_price)}</span>
                  <span>Updated {new Date(deck.updated_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleVisibility(deck.deck_id, !deck.is_public)}
                  disabled={isPending}
                  className="theme-button-ghost rounded-md px-3 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deck.is_public ? "Make Private" : "Make Public"}
                </button>
                <Link href={`/decklists/${deck.deck_id}`} className="theme-button rounded-md px-3 py-2 text-sm">
                  View Deck
                </Link>
                <button
                  type="button"
                  onClick={() => onDeleteDeck(deck.deck_id)}
                  disabled={isPending}
                  className="rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
