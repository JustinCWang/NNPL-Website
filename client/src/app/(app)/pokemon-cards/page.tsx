"use client";
/*
  Protected Pokemon Cards page ("/pokemon-cards").
  - Rendered inside the authenticated `(app)` layout (shared protected header/nav)
  - Shows Pokemon card pricing and details
  - Comprehensive filtering system with multiple criteria
  - Pagination support
*/

import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchPokemonCards } from "@/lib/pokemonCardApi";
import { AVAILABLE_POKEMON_SETS } from "@/lib/pokemonCardSets";
import type { PokemonCard, PokemonCardFilters } from "@/types/pokemonCard";
import PokemonCardFilter from "@/components/pokemon-cards/PokemonCardFilter";
import PokemonCardGrid from "@/components/pokemon-cards/PokemonCardGrid";
import Pagination from "@/components/pokemon-cards/Pagination";

export default function PokemonCardsPage() {
  const [filters, setFilters] = useState<PokemonCardFilters>({
    setID: "",
    name: "",
    cardNumber: "",
    illustrator: "",
    regulationMark: "",
    priceMin: "",
    priceMax: "",
  });
  const [allCards, setAllCards] = useState<PokemonCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<PokemonCard[]>([]);
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

  // Apply client-side filters to cards
  const applyClientFilters = useCallback((cards: PokemonCard[], currentFilters: PokemonCardFilters): PokemonCard[] => {
    return cards.filter((card) => {
      // Name filter (case-insensitive partial match)
      if (currentFilters.name && !card.name.toLowerCase().includes(currentFilters.name.toLowerCase())) {
        return false;
      }

      // Card number filter (exact match)
      if (currentFilters.cardNumber && card.card_number !== currentFilters.cardNumber) {
        return false;
      }

      // Illustrator filter (case-insensitive partial match)
      if (currentFilters.illustrator && card.illustrator) {
        if (!card.illustrator.toLowerCase().includes(currentFilters.illustrator.toLowerCase())) {
          return false;
        }
      } else if (currentFilters.illustrator && !card.illustrator) {
        return false;
      }

      // Regulation mark filter (exact match)
      if (currentFilters.regulationMark && card.regulation_mark !== currentFilters.regulationMark) {
        return false;
      }

      // Price range filters
      if (currentFilters.priceMin) {
        const minPrice = parseFloat(currentFilters.priceMin);
        if (!isNaN(minPrice) && (card.market_price === null || card.market_price < minPrice)) {
          return false;
        }
      }

      if (currentFilters.priceMax) {
        const maxPrice = parseFloat(currentFilters.priceMax);
        if (!isNaN(maxPrice) && (card.market_price === null || card.market_price > maxPrice)) {
          return false;
        }
      }

      return true;
    });
  }, []);

  // Apply client-side filters when filters or allCards change
  useEffect(() => {
    const filtered = applyClientFilters(allCards, filters);
    setFilteredCards(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [allCards, filters, applyClientFilters]);

  // Calculate pagination.
  const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCards = filteredCards.slice(startIndex, endIndex);

  async function handleLoadCards() {
    // Check if at least one filter is provided
    const hasAnyFilter = !!(
      filters.setID ||
      filters.name ||
      filters.cardNumber ||
      filters.illustrator ||
      filters.regulationMark ||
      filters.priceMin ||
      filters.priceMax
    );

    if (!hasAnyFilter) {
      setError("Please provide at least one filter criteria to search for cards.");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1); // Reset to first page on new search.

    try {
      // Fetch cards with server-side filters (setID is optional, searches across all sets if not provided)
      const data = await fetchPokemonCards(filters);
      setAllCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cards");
      setAllCards([]);
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
        <p className="mt-2 text-gray-600">Browse Pokemon card pricing and details with advanced filtering.</p>
      </div>

      <PokemonCardFilter
        filters={filters}
        onFiltersChange={setFilters}
        availableSets={AVAILABLE_POKEMON_SETS}
        totalCards={allCards.length}
        filteredCards={filteredCards.length}
      />

      {/* Load Cards Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleLoadCards}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? "Loading..." : "Search Cards"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700" role="alert">
          {error}
        </div>
      )}

      {filteredCards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Showing {filteredCards.length} card{filteredCards.length !== 1 ? "s" : ""}
              {allCards.length !== filteredCards.length && ` (of ${allCards.length} total)`}
            </h2>
            {totalPages > 1 && (
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, filteredCards.length)}{" "}
                of {filteredCards.length}
              </p>
            )}
          </div>

          <PokemonCardGrid cards={currentCards} gridKeyPrefix={startIndex} />

          {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onChange={goToPage} />}
        </div>
      )}

      {!loading && filteredCards.length === 0 && allCards.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No cards match the current filters.</p>
          <p className="text-sm mt-2">Try adjusting your filter criteria.</p>
        </div>
      )}

      {!loading && allCards.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          <p>No cards found. Use the filters above and click "Search Cards" to find cards.</p>
        </div>
      )}
    </main>
  );
}


