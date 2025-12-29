"use client";
/*
  Pokemon Cards page ("/pokemon-cards").
  - Accessible without authentication
  - Shows Pokemon card pricing and details
  - Allows searching by Pokemon set ID
  - Pagination support
*/
import { useState, useEffect, useMemo } from "react";
import { fetchPokemonCards } from "@/lib/pokemonCardApi";

interface PokemonCard {
  number_plus_name: string;
  market_price: number;
  image_url: string;
  illustrator: string;
}

// Available Pokemon card sets
const AVAILABLE_SETS = [
  { value: "sv01", label: "Scarlet & Violet Base Set" },
  { value: "sv02", label: "Scarlet & Violet—Paldea Evolved" },
  { value: "sv03", label: "Scarlet & Violet—Obsidian Flames" },
  { value: "sv03.5", label: "Scarlet & Violet—151" },
  { value: "sv04", label: "Scarlet & Violet—Paradox Rift" },
  { value: "sv04.5", label: "Scarlet & Violet—Paldean Fates" },
  { value: "sv05", label: "Scarlet & Violet—Temporal Forces" },
  { value: "sv06", label: "Scarlet & Violet—Twilight Masquerade" },
  { value: "sv06.5", label: "Scarlet & Violet—Shrouded Fable" },
  { value: "sv07", label: "Scarlet & Violet—Stellar Crown" },
  { value: "sv08", label: "Scarlet & Violet—Surging Sparks" },
  { value: "sv08.5", label: "Scarlet & Violet—Prismatic Evolutions" },
  { value: "sv09", label: "Scarlet & Violet—Journey Together" },
  { value: "sv10", label: "Scarlet & Violet—Destined Rivals" },
  { value: "sv10.5b", label: "Scarlet & Violet—Black Bolt" },
  { value: "sv10.5w", label: "Scarlet & Violet—White Flare" },
  { value: "me01", label: "Mega Evolution Base Set" },
  { value: "me02", label: "Mega Evolution—Phantasmal Flames" },
  //{ value: "me02.5", label: "Mega Evolution—Ascended Heroes" },
];

export default function PokemonCardsPage() {
  const [setID, setSetID] = useState("");
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [windowWidth, setWindowWidth] = useState(0);

  // Track window width for responsive pagination
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);
      window.addEventListener("resize", handleResize);
    }
    
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  // Calculate items per page based on screen size
  const itemsPerPage = useMemo(() => {
    if (windowWidth === 0) return 12; // Default before hydration
    
    // Match the grid breakpoints: 1 col (mobile), 2 cols (sm), 3 cols (md), 4 cols (lg)
    if (windowWidth < 640) return 12;      // Mobile: 1 column, 12 cards
    if (windowWidth < 768) return 16;      // Small: 2 columns, 8 rows = 16 cards
    if (windowWidth < 1024) return 18;     // Medium: 3 columns, 6 rows = 18 cards
    return 20;                              // Large: 4 columns, 5 rows = 20 cards
  }, [windowWidth]);

  // Calculate pagination
  const totalPages = Math.ceil(cards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCards = cards.slice(startIndex, endIndex);

  // Reset to page 1 when new cards are loaded
  useEffect(() => {
    setCurrentPage(1);
  }, [cards.length]);

  const handleFetch = async () => {
    if (!setID) {
      setError("Please select a set");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1); // Reset to first page on new search

    try {
      const data = await fetchPokemonCards(setID);
      setCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch cards");
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Pokemon Cards</h1>
        <p className="mt-2 text-gray-600">Browse Pokemon card pricing and details.</p>
      </div>

      {/* Search Form */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="setID" className="block text-sm font-medium text-gray-700 mb-2">
              Select Set
            </label>
            <select
              id="setID"
              value={setID}
              onChange={(e) => setSetID(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">-- Select a Pokemon Set --</option>
              {AVAILABLE_SETS.map((set) => (
                <option key={set.value} value={set.value}>
                  {set.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleFetch}
            disabled={loading || !setID}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Loading..." : "Load Cards"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Cards Grid */}
      {cards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Found {cards.length} card{cards.length !== 1 ? "s" : ""}
            </h2>
            {totalPages > 1 && (
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, cards.length)} of {cards.length}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentCards.map((card, index) => (
              <div
                key={startIndex + index}
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
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {card.number_plus_name}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-gray-900">
                        ${card.market_price?.toFixed(2) || "N/A"}
                      </span>
                    </div>
                    {card.illustrator && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Illustrator:</span>
                        <span className="text-gray-700 truncate ml-2">
                          {card.illustrator}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (() => {
            // Build array of page numbers to display
            const pagesToShow: (number | 'ellipsis')[] = [];
            
            // Always show first page
            pagesToShow.push(1);
            
            // Calculate range around current page
            const startPage = Math.max(2, currentPage - 1);
            const endPage = Math.min(totalPages - 1, currentPage + 1);
            
            // Add ellipsis before current range if needed
            if (startPage > 2) {
              pagesToShow.push('ellipsis');
            }
            
            // Add pages around current (excluding first and last which are handled separately)
            for (let i = startPage; i <= endPage; i++) {
              if (i !== 1 && i !== totalPages) {
                pagesToShow.push(i);
              }
            }
            
            // Add ellipsis after current range if needed
            if (endPage < totalPages - 1) {
              pagesToShow.push('ellipsis');
            }
            
            // Always show last page (if more than 1 page total)
            if (totalPages > 1) {
              pagesToShow.push(totalPages);
            }
            
            return (
              <div className="mt-6 flex items-center justify-center gap-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {pagesToShow.map((item, index) => {
                    if (item === 'ellipsis') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-1 text-gray-400 text-xs">
                          ...
                        </span>
                      );
                    }
                    
                    return (
                      <button
                        key={item}
                        onClick={() => goToPage(item)}
                        className={`px-2 py-1 min-w-[28px] border rounded text-xs font-medium transition-colors ${
                          currentPage === item
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Empty State */}
      {!loading && cards.length === 0 && !error && setID && (
        <div className="text-center py-12 text-gray-500">
          <p>No cards found for this set.</p>
          <p className="text-sm mt-2">Try selecting a different set.</p>
        </div>
      )}
    </main>
  );
}