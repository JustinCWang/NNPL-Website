"use client";

import type { DeckSelectionOption } from "@/types/liveEvent";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

interface DeckSelectionPanelProps {
  decks: DeckSelectionOption[];
  selectedDeckId: string | null;
  pending: boolean;
  onSelectDeck: (deckId: string) => void | Promise<void>;
}

export default function DeckSelectionPanel({
  decks,
  selectedDeckId,
  pending,
  onSelectDeck,
}: DeckSelectionPanelProps) {
  return (
    <section className="theme-card rounded-xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-theme-foreground">Choose Your Deck</h2>
          <p className="mt-1 text-sm text-theme-muted">Pick the saved decklist you are using for this event.</p>
        </div>
      </div>

      {decks.length === 0 ? (
        <div className="mt-4 rounded-lg border p-4 text-sm text-theme-muted" style={{ borderColor: "var(--theme-border-soft)" }}>
          Create a decklist first so you can attach a deck to your live event run.
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          {decks.map((deck) => {
            const isSelected = deck.deck_id === selectedDeckId;

            return (
              <div
                key={deck.deck_id}
                className={`rounded-lg border p-4 transition-colors ${isSelected ? "ring-2 ring-offset-2 ring-offset-transparent" : ""}`}
                style={{
                  borderColor: isSelected ? "var(--theme-color)" : "var(--theme-border-soft)",
                }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-theme-foreground">{deck.name}</h3>
                      {deck.format && (
                        <span className="theme-chip rounded-full px-2.5 py-1 text-xs font-medium">{deck.format}</span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${deck.is_public ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"}`}>
                        {deck.is_public ? "Public" : "Private"}
                      </span>
                    </div>
                    {deck.description && <p className="text-sm text-theme-muted">{deck.description}</p>}
                    <div className="flex flex-wrap gap-3 text-sm text-theme-muted">
                      <span>{deck.total_cards} cards</span>
                      <span>{deck.unique_cards} unique</span>
                      <span>{currencyFormatter.format(deck.estimated_price)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isSelected && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        Selected
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => void onSelectDeck(deck.deck_id)}
                      disabled={pending}
                      className={`${isSelected ? "theme-button-ghost" : "theme-button"} rounded-md px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {isSelected ? "Using This Deck" : "Use This Deck"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
