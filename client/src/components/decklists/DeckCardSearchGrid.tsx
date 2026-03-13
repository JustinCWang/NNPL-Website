"use client";
/*
  Deck card search results grid.
  - Reuses the PokemonCard search dataset
  - Adds deck-specific quantity controls for each result
*/

import { useEffect, useMemo, useState } from "react";
import type { PokemonCard } from "@/types/pokemonCard";
import { getPokemonCardKey } from "@/types/decklist";

interface DeckCardSearchGridProps {
  cards: PokemonCard[];
  quantitiesByCard: Record<string, number>;
  onAddCard: (card: PokemonCard) => void;
  onIncreaseCard: (card: PokemonCard) => void;
  onDecreaseCard: (cardKey: string) => void;
  canIncreaseCard: (card: PokemonCard) => boolean;
  tileSize: "compact" | "comfortable" | "large";
}

export default function DeckCardSearchGrid({
  cards,
  quantitiesByCard,
  onAddCard,
  onIncreaseCard,
  onDecreaseCard,
  canIncreaseCard,
  tileSize,
}: DeckCardSearchGridProps) {
  const [previewCard, setPreviewCard] = useState<PokemonCard | null>(null);

  useEffect(() => {
    if (!previewCard) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewCard(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [previewCard]);

  const layout = useMemo(() => {
    switch (tileSize) {
      case "large":
        return {
          grid: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          imageWrap: "theme-panel flex h-40 items-center justify-center p-3 sm:h-44",
          body: "p-3 space-y-2",
          title: "text-sm font-semibold text-theme-foreground line-clamp-2 leading-tight",
          meta: "mt-1 text-xs text-theme-muted line-clamp-1",
          illustrator: "text-xs text-theme-muted truncate",
          actionRow: "flex items-center justify-between gap-2 pt-1",
          button: "theme-button rounded-md px-3 py-1.5 text-xs",
          ghostButton: "theme-button-ghost rounded-md px-2.5 py-1 text-sm",
          quantityText: "min-w-5 text-center text-sm font-medium text-theme-foreground",
          chip: "theme-chip inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        };
      case "comfortable":
        return {
          grid: "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5",
          imageWrap: "theme-panel flex h-32 items-center justify-center p-2 sm:h-36",
          body: "p-2.5 space-y-1.5",
          title: "text-xs font-semibold text-theme-foreground line-clamp-2 leading-tight",
          meta: "mt-0.5 text-[11px] text-theme-muted line-clamp-1",
          illustrator: "text-[11px] text-theme-muted truncate",
          actionRow: "flex items-center justify-between gap-2 pt-0.5",
          button: "theme-button rounded-md px-2.5 py-1 text-[11px]",
          ghostButton: "theme-button-ghost rounded-md px-2 py-0.5 text-sm",
          quantityText: "min-w-4 text-center text-xs font-medium text-theme-foreground",
          chip: "theme-chip inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
        };
      default:
        return {
          grid: "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5",
          imageWrap: "theme-panel flex h-28 items-center justify-center p-2 sm:h-32",
          body: "p-2 space-y-1",
          title: "text-xs font-semibold text-theme-foreground line-clamp-2 leading-tight",
          meta: "mt-0.5 text-[10px] text-theme-muted line-clamp-1",
          illustrator: "text-[10px] text-theme-muted truncate",
          actionRow: "flex items-center justify-between gap-2 pt-0.5",
          button: "theme-button rounded-md px-2.5 py-1 text-[10px]",
          ghostButton: "theme-button-ghost rounded-md px-2 py-0.5 text-xs",
          quantityText: "min-w-4 text-center text-xs font-medium text-theme-foreground",
          chip: "theme-chip inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium",
        };
    }
  }, [tileSize]);

  return (
    <>
      <div className={layout.grid}>
        {cards.map((card) => {
          const cardKey = getPokemonCardKey(card);
          const quantity = quantitiesByCard[cardKey] ?? 0;
          const canIncrease = canIncreaseCard(card);

          return (
            <div
              key={cardKey}
              className="theme-card theme-card-hover rounded-lg overflow-hidden"
            >
              {card.image_url && (
                <button
                  type="button"
                  className={`${layout.imageWrap} w-full cursor-zoom-in`}
                  onClick={() => setPreviewCard(card)}
                  aria-label={`Preview ${card.number_plus_name}`}
                >
                  <img
                    src={card.image_url}
                    alt={card.number_plus_name}
                    className="max-h-full w-auto max-w-full object-contain"
                    onError={(event) => {
                      (event.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </button>
              )}
              <div className={layout.body}>
                <div>
                  <h3 className={layout.title}>{card.number_plus_name}</h3>
                  <p className={layout.meta}>
                    {card.set_name}
                    {card.card_number ? ` • #${card.card_number}` : ""}
                    {card.market_price != null ? ` • $${card.market_price.toFixed(2)}` : ""}
                  </p>
                </div>

                {card.illustrator && (
                  <p className={layout.illustrator} title={card.illustrator}>
                    Illus. {card.illustrator}
                  </p>
                )}

                <div className={layout.actionRow}>
                  {quantity > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDecreaseCard(cardKey);
                        }}
                        className={layout.ghostButton}
                        aria-label={`Remove one copy of ${card.name}`}
                      >
                        -
                      </button>
                      <span className={layout.meta}>In deck</span>
                      <span className={layout.quantityText}>{quantity}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onIncreaseCard(card);
                        }}
                        className={`${layout.ghostButton} disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={!canIncrease}
                        aria-label={`Add one more copy of ${card.name}`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onAddCard(card);
                        }}
                        className={layout.button}
                      >
                        Add
                      </button>
                      <span className={layout.meta}>In deck 0</span>
                    </div>
                  )}

                  {card.regulation_mark && (
                    <span className={layout.chip}>
                      Reg {card.regulation_mark}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {previewCard && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewCard(null)}
        >
          <div
            className="theme-card max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl p-4 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-theme-foreground">
                  {previewCard.number_plus_name}
                </h2>
                <p className="mt-1 text-sm text-theme-muted">
                  {previewCard.set_name}
                  {previewCard.card_number ? ` • #${previewCard.card_number}` : ""}
                  {previewCard.market_price != null ? ` • $${previewCard.market_price.toFixed(2)}` : ""}
                </p>
                {previewCard.illustrator && (
                  <p className="mt-1 text-sm text-theme-muted">
                    Illustrator: {previewCard.illustrator}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewCard(null)}
                className="theme-button-ghost rounded-md px-3 py-1.5 text-sm"
              >
                Close
              </button>
            </div>

            <div className="flex justify-center rounded-lg p-4 theme-panel">
              <img
                src={previewCard.image_url}
                alt={previewCard.number_plus_name}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
