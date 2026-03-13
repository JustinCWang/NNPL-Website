"use client";
/*
  Pokemon Cards grid.
  - Renders card tiles for the current page slice
  - Uses plain <img> since these are remote images from Supabase/Pokemon sources and may not be configured in next.config yet
*/

import type { PokemonCard } from "@/types/pokemonCard";

type PokemonCardGridProps = {
  cards: PokemonCard[];
  gridKeyPrefix: number;
};

export default function PokemonCardGrid({ cards, gridKeyPrefix }: PokemonCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={gridKeyPrefix + index}
          className="theme-card theme-card-hover rounded-lg overflow-hidden"
        >
          {card.image_url && (
            <div className="aspect-square theme-panel relative">
              <img
                src={card.image_url}
                alt={card.number_plus_name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
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
  );
}


