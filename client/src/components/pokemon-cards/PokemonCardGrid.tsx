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
          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          {card.image_url && (
            <div className="aspect-square bg-gray-100 relative">
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
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{card.number_plus_name}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium text-gray-900">${card.market_price?.toFixed(2) || "N/A"}</span>
              </div>
              {card.illustrator && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Illustrator:</span>
                  <span className="text-gray-700 truncate ml-2">{card.illustrator}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


