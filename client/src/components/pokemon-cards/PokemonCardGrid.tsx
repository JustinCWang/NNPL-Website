"use client";
/*
  Pokemon Cards grid.
  - Renders card tiles for the current page slice
  - Uses plain <img> since these are remote images from Supabase/Pokemon sources and may not be configured in next.config yet
*/

import { useEffect, useState } from "react";
import type { PokemonCard } from "@/types/pokemonCard";

type PokemonCardGridProps = {
  cards: PokemonCard[];
  gridKeyPrefix: number;
};

export default function PokemonCardGrid({ cards, gridKeyPrefix }: PokemonCardGridProps) {
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

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={gridKeyPrefix + index}
            className="theme-card theme-card-hover rounded-lg overflow-hidden"
          >
            {card.image_url && (
              <button
                type="button"
                className="aspect-square theme-panel relative w-full cursor-zoom-in"
                onClick={() => setPreviewCard(card)}
                aria-label={`Preview ${card.number_plus_name}`}
              >
                <img
                  src={card.image_url}
                  alt={card.number_plus_name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </button>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-theme-foreground mb-2 line-clamp-2">{card.number_plus_name}</h3>
              {card.set_name && (
                <p className="text-xs text-theme-muted mb-2 truncate">{card.set_name}</p>
              )}
              <div className="space-y-1 text-sm">
                {card.card_number && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Card #:</span>
                    <span className="text-theme-foreground font-medium">{card.card_number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-theme-muted">Price:</span>
                  <span className="font-medium text-theme-foreground">${card.market_price?.toFixed(2) || "N/A"}</span>
                </div>
                {card.illustrator && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Illustrator:</span>
                    <span className="text-theme-foreground truncate ml-2">{card.illustrator}</span>
                  </div>
                )}
                {card.regulation_mark && (
                  <div className="flex justify-between">
                    <span className="text-theme-muted">Regulation:</span>
                    <span className="text-theme-foreground font-medium">{card.regulation_mark}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewCard && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewCard(null)}
        >
          <div
            className="theme-card max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl p-4 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-theme-foreground">{previewCard.number_plus_name}</h2>
                <p className="mt-1 text-sm text-theme-muted">
                  {previewCard.set_name}
                  {previewCard.card_number ? ` • #${previewCard.card_number}` : ""}
                  {previewCard.market_price != null ? ` • $${previewCard.market_price.toFixed(2)}` : ""}
                </p>
                {previewCard.illustrator && (
                  <p className="mt-1 text-sm text-theme-muted">Illustrator: {previewCard.illustrator}</p>
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

            <div className="theme-panel flex justify-center rounded-lg p-4">
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


