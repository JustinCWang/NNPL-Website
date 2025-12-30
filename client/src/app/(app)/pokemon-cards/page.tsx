"use client";
/*
  Protected Pokemon Cards page ("/pokemon-cards").
  - Rendered inside the authenticated `(app)` layout (shared protected header/nav)
  - Shows Pokemon card pricing and details
  - Allows searching by Pokemon set ID
  - Pagination support
*/

import { useEffect, useMemo, useState } from "react";
import { fetchPokemonCards } from "@/lib/pokemonCardApi";
import { AVAILABLE_POKEMON_SETS } from "@/lib/pokemonCardSets";
import type { PokemonCard } from "@/types/pokemonCard";
import PokemonCardsSearch from "@/components/pokemon-cards/PokemonCardsSearch";
import PokemonCardGrid from "@/components/pokemon-cards/PokemonCardGrid";
import Pagination from "@/components/pokemon-cards/Pagination";

export default function PokemonCardsPage() {
  const [setID, setSetID] = useState("");
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [windowWidth, setWindowWidth] = useState(0);

  // Track window width for responsive pagination.
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }

    setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate items per page based on screen size.
  const itemsPerPage = useMemo(() => {
    if (windowWidth === 0) return 12; // Default before hydration.

    // Match the grid breakpoints: 1 col (mobile), 2 cols (sm), 3 cols (md), 4 cols (lg)
    if (windowWidth < 640) return 12; // Mobile: 1 column, 12 cards
    if (windowWidth < 768) return 16; // Small: 2 columns, 8 rows = 16 cards
    if (windowWidth < 1024) return 18; // Medium: 3 columns, 6 rows = 18 cards
    return 20; // Large: 4 columns, 5 rows = 20 cards
  }, [windowWidth]);

  // Calculate pagination.
  const totalPages = Math.ceil(cards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCards = cards.slice(startIndex, endIndex);

  // Reset to page 1 when new cards are loaded.
  useEffect(() => {
    setCurrentPage(1);
  }, [cards.length]);

  async function handleFetch() {
    if (!setID) {
      setError("Please select a set.");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1); // Reset to first page on new search.

    try {
      const data = await fetchPokemonCards(setID);
      setCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cards");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }

  function goToPage(page: number) {
    setCurrentPage(page);
    // Scroll to top of results.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Pokemon Cards</h1>
        <p className="mt-2 text-gray-600">Browse Pokemon card pricing and details.</p>
      </div>

      <PokemonCardsSearch
        setID={setID}
        onSetIDChange={setSetID}
        availableSets={AVAILABLE_POKEMON_SETS}
        onSubmit={handleFetch}
        isSubmitting={loading}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700" role="alert">
          {error}
        </div>
      )}

      {cards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Found {cards.length} card{cards.length !== 1 ? "s" : ""}
            </h2>
            {totalPages > 1 && (
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, cards.length)} of{" "}
                {cards.length}
              </p>
            )}
          </div>

          <PokemonCardGrid cards={currentCards} gridKeyPrefix={startIndex} />

          {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onChange={goToPage} />}
        </div>
      )}

      {!loading && cards.length === 0 && !error && setID && (
        <div className="text-center py-12 text-gray-500">
          <p>No cards found for this set.</p>
          <p className="text-sm mt-2">Try selecting a different set.</p>
        </div>
      )}
    </main>
  );
}


