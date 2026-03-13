"use client";
/*
  Deck builder screen.
  - Reuses the Pokemon card search flow for deck construction
  - Maintains local deck state, validation, and save behavior
*/

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AVAILABLE_POKEMON_SETS } from "@/lib/pokemonCardSets";
import { fetchPokemonCards } from "@/lib/pokemonCardApi";
import { fetchDecklist, saveDecklist } from "@/lib/decklistApi";
import { canIgnoreCopyLimit, getDeckEstimatedPrice, getDeckTotalCards, MAX_NON_ENERGY_COPIES, validateDecklist } from "@/lib/deckValidation";
import Pagination from "@/components/pokemon-cards/Pagination";
import PokemonCardFilter from "@/components/pokemon-cards/PokemonCardFilter";
import DeckCardSearchGrid from "@/components/decklists/DeckCardSearchGrid";
import type { DecklistCard, DecklistFormValues, DecklistWithCards } from "@/types/decklist";
import { DECK_FORMAT_OPTIONS, getPokemonCardKey, mapPokemonCardToDecklistCard } from "@/types/decklist";
import type { PokemonCard, PokemonCardFilters } from "@/types/pokemonCard";

const emptyDeckForm: DecklistFormValues = {
  name: "",
  format: "Standard",
  description: "",
  is_public: false,
};

const emptySearchFilters: PokemonCardFilters = {
  setID: "",
  name: "",
  cardNumber: "",
  illustrator: "",
  regulationMark: "",
  priceMin: "",
  priceMax: "",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

interface DeckBuilderProps {
  deckId?: string;
}

export default function DeckBuilder({ deckId }: DeckBuilderProps) {
  const router = useRouter();
  const isExistingDeck = Boolean(deckId);
  const [isEditMode, setIsEditMode] = useState(!deckId);

  const [deckForm, setDeckForm] = useState<DecklistFormValues>(emptyDeckForm);
  const [deckCards, setDeckCards] = useState<DecklistCard[]>([]);
  const [loadedDeck, setLoadedDeck] = useState<DecklistWithCards | null>(null);
  const [isDeckLoading, setIsDeckLoading] = useState(isExistingDeck);
  const [deckLoadError, setDeckLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [filters, setFilters] = useState<PokemonCardFilters>(emptySearchFilters);
  const [allCards, setAllCards] = useState<PokemonCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<PokemonCard[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [windowWidth, setWindowWidth] = useState(0);
  const [tileSize, setTileSize] = useState<"compact" | "comfortable" | "large">("compact");
  const [previewDeckCard, setPreviewDeckCard] = useState<DecklistCard | null>(null);

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }

    setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!previewDeckCard) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewDeckCard(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [previewDeckCard]);

  useEffect(() => {
    if (!deckId) {
      return;
    }

    const targetDeckId = deckId;
    let isMounted = true;

    async function loadDeck() {
      try {
        setIsDeckLoading(true);
        setDeckLoadError(null);

        const deck = await fetchDecklist(targetDeckId);
        if (!isMounted) {
          return;
        }

        if (!deck) {
          setDeckLoadError("We couldn't find that deck, or you no longer have access to it.");
          return;
        }

        setLoadedDeck(deck);
        setDeckForm({
          name: deck.name,
          format: "Standard",
          description: deck.description ?? "",
          is_public: deck.is_public,
        });
        setDeckCards(deck.cards);
      } catch (error) {
        console.error("Error loading deck:", error);
        if (isMounted) {
          setDeckLoadError("Failed to load this deck. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsDeckLoading(false);
        }
      }
    }

    loadDeck();

    return () => {
      isMounted = false;
    };
  }, [deckId]);

  const itemsPerPage = useMemo(() => {
    if (windowWidth === 0) return 15;
    if (windowWidth < 640) return 12;
    if (windowWidth < 1024) return 15;
    if (windowWidth < 1536) return 20;
    return 25;
  }, [windowWidth]);

  const applyClientFilters = useCallback((cards: PokemonCard[], currentFilters: PokemonCardFilters): PokemonCard[] => {
    return cards.filter((card) => {
      if (currentFilters.name && !card.name.toLowerCase().includes(currentFilters.name.toLowerCase())) {
        return false;
      }

      if (currentFilters.cardNumber && card.card_number !== currentFilters.cardNumber) {
        return false;
      }

      if (currentFilters.illustrator && card.illustrator) {
        if (!card.illustrator.toLowerCase().includes(currentFilters.illustrator.toLowerCase())) {
          return false;
        }
      } else if (currentFilters.illustrator && !card.illustrator) {
        return false;
      }

      if (currentFilters.regulationMark && card.regulation_mark !== currentFilters.regulationMark) {
        return false;
      }

      if (currentFilters.priceMin) {
        const minPrice = parseFloat(currentFilters.priceMin);
        if (!Number.isNaN(minPrice) && (card.market_price === null || card.market_price < minPrice)) {
          return false;
        }
      }

      if (currentFilters.priceMax) {
        const maxPrice = parseFloat(currentFilters.priceMax);
        if (!Number.isNaN(maxPrice) && (card.market_price === null || card.market_price > maxPrice)) {
          return false;
        }
      }

      return true;
    });
  }, []);

  useEffect(() => {
    const nextFilteredCards = applyClientFilters(allCards, filters);
    setFilteredCards(nextFilteredCards);
    setCurrentPage(1);
  }, [allCards, filters, applyClientFilters]);

  const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
  const paginatedCards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCards.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredCards, itemsPerPage]);

  const quantitiesByCard = useMemo(() => {
    return Object.fromEntries(deckCards.map((card) => [card.card_key, card.quantity]));
  }, [deckCards]);

  const sortedDeckCards = useMemo(() => {
    return [...deckCards].sort((left, right) => left.name.localeCompare(right.name));
  }, [deckCards]);

  const validation = useMemo(() => validateDecklist(deckForm.name, deckCards), [deckForm.name, deckCards]);
  const totalCards = useMemo(() => getDeckTotalCards(deckCards), [deckCards]);
  const estimatedPrice = useMemo(() => getDeckEstimatedPrice(deckCards), [deckCards]);

  const updateDeckForm = (key: keyof DecklistFormValues, value: string | boolean) => {
    setDeckForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const canIncreaseDeckCard = useCallback((card: Pick<PokemonCard, "set_id" | "localId" | "name" | "regulation_mark">) => {
    const cardKey = getPokemonCardKey(card);
    const existingCard = deckCards.find((entry) => entry.card_key === cardKey);

    if (!existingCard) {
      return true;
    }

    if (canIgnoreCopyLimit({
      name: card.name,
      regulation_mark: card.regulation_mark,
    })) {
      return true;
    }

    return existingCard.quantity < MAX_NON_ENERGY_COPIES;
  }, [deckCards]);

  const addCardToDeck = useCallback((card: PokemonCard) => {
    const cardKey = getPokemonCardKey(card);
    const ignoresCopyLimit = canIgnoreCopyLimit({
      name: card.name,
      regulation_mark: card.regulation_mark,
    });

    setDeckCards((prev) => {
      const existingCard = prev.find((entry) => entry.card_key === cardKey);
      if (existingCard) {
        if (!ignoresCopyLimit && existingCard.quantity >= MAX_NON_ENERGY_COPIES) {
          return prev;
        }

        return prev.map((entry) =>
          entry.card_key === cardKey
            ? {
                ...entry,
                quantity: entry.quantity + 1,
                regulation_mark: card.regulation_mark,
              }
            : entry
        );
      }

      return [...prev, mapPokemonCardToDecklistCard(card)];
    });
  }, []);

  const increaseDeckCard = useCallback((card: PokemonCard) => {
    addCardToDeck(card);
  }, [addCardToDeck]);

  const decreaseDeckCard = useCallback((cardKey: string) => {
    setDeckCards((prev) =>
      prev.flatMap((entry) => {
        if (entry.card_key !== cardKey) {
          return [entry];
        }

        if (entry.quantity <= 1) {
          return [];
        }

        return [{ ...entry, quantity: entry.quantity - 1 }];
      })
    );
  }, []);

  const removeDeckCard = useCallback((cardKey: string) => {
    setDeckCards((prev) => prev.filter((entry) => entry.card_key !== cardKey));
  }, []);

  const getCardForDeckIncrease = useCallback((card: DecklistCard): Pick<PokemonCard, "set_id" | "localId" | "name" | "regulation_mark"> => {
    const searchedCard = allCards.find((entry) => entry.set_id === card.set_id && entry.localId === card.local_id);

    if (searchedCard) {
      return searchedCard;
    }

    return {
      set_id: card.set_id,
      localId: card.local_id,
      name: card.name,
      regulation_mark: card.regulation_mark ?? null,
    };
  }, [allCards]);

  const buildDeckIncreaseCard = useCallback((card: DecklistCard): PokemonCard => {
    const increaseSource = getCardForDeckIncrease(card);

    return {
      set_id: card.set_id,
      name: card.name,
      number_plus_name: card.name,
      image_url: card.image_url ?? "",
      set_name: card.set_name ?? "",
      localId: card.local_id,
      market_price: card.market_price,
      card_number: card.card_number ?? "",
      illustrator: null,
      regulation_mark: increaseSource.regulation_mark ?? null,
    };
  }, [getCardForDeckIncrease]);

  const clearDeck = () => {
    setDeckCards([]);
  };

  const previewDeckCardModal = previewDeckCard ? (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
      onClick={() => setPreviewDeckCard(null)}
    >
      <div
        className="theme-card max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl p-4 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-theme-foreground">{previewDeckCard.name}</h2>
            <p className="mt-1 text-sm text-theme-muted">
              {previewDeckCard.set_name ?? "Unknown Set"}
              {previewDeckCard.card_number ? ` • #${previewDeckCard.card_number}` : ""}
              {previewDeckCard.market_price != null ? ` • ${currencyFormatter.format(previewDeckCard.market_price)}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPreviewDeckCard(null)}
            className="theme-button-ghost rounded-md px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>

        <div className="theme-panel flex justify-center rounded-lg p-4">
          {previewDeckCard.image_url ? (
            <img
              src={previewDeckCard.image_url}
              alt={previewDeckCard.name}
              className="max-h-[70vh] w-auto max-w-full object-contain"
            />
          ) : (
            <div className="py-16 text-sm text-theme-muted">No card image available</div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  const handleSearchCards = async () => {
    const hasAnyFilter = Boolean(
      filters.setID ||
        filters.name ||
        filters.cardNumber ||
        filters.illustrator ||
        filters.regulationMark ||
        filters.priceMin ||
        filters.priceMax
    );

    if (!hasAnyFilter) {
      setSearchError("Please provide at least one search filter before loading cards.");
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      setCurrentPage(1);

      const data = await fetchPokemonCards(filters);
      setAllCards(data);
    } catch (error) {
      console.error("Error fetching Pokemon cards:", error);
      setSearchError(error instanceof Error ? error.message : "Failed to fetch cards.");
      setAllCards([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSaveDeck = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      const savedDeckId = await saveDecklist({
        deck_id: deckId,
        ...deckForm,
        cards: deckCards,
      });

      if (!deckId) {
        router.replace(`/decklists/${savedDeckId}`);
        return;
      }

      setLoadedDeck((prev) =>
        prev
          ? {
              ...prev,
              name: deckForm.name,
              format: deckForm.format,
              description: deckForm.description,
              is_public: deckForm.is_public,
              total_cards: totalCards,
              unique_cards: deckCards.length,
              estimated_price: estimatedPrice,
              cards: deckCards,
            }
          : prev
      );
      setSaveSuccess("Deck saved successfully.");
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving deck:", error);
      setSaveError(error instanceof Error ? error.message : "Failed to save the deck.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isDeckLoading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-theme border-t-transparent"></div>
        <p className="mt-3 text-theme-muted">Loading deck builder...</p>
      </div>
    );
  }

  if (deckLoadError) {
    return (
      <div className="theme-card rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-theme-foreground">Deck not available</h1>
        <p className="mt-2 text-theme-muted">{deckLoadError}</p>
        <Link href="/decklists" className="theme-button mt-4 inline-flex rounded-md px-4 py-2">
          Back to My Decklists
        </Link>
      </div>
    );
  }

  if (isExistingDeck && !isEditMode) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-theme-muted">
              <Link href="/decklists" className="hover:text-theme transition-colors">
                My Decklists
              </Link>
              <span className="mx-2">/</span>
              <span>{loadedDeck?.name ?? deckForm.name}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold text-theme-foreground">
                {deckForm.name || loadedDeck?.name}
              </h1>
              <span className="theme-chip inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium">
                {deckForm.format}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  validation.isValid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {validation.isValid ? "Valid Deck" : "Incomplete Deck"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  deckForm.is_public ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700"
                }`}
              >
                {deckForm.is_public ? "Public" : "Private"}
              </span>
            </div>
            <p className="mt-2 text-theme-muted">
              {deckForm.description || "No deck notes yet."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="theme-button rounded-md px-4 py-2 text-sm"
            >
              Edit Deck
            </button>
            <Link href="/decklists" className="theme-button-ghost inline-flex rounded-md px-4 py-2 text-sm">
              Back to My Decklists
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="theme-panel rounded-lg p-4">
            <div className="text-xs text-theme-muted">Total Cards</div>
            <div className="mt-1 text-2xl font-semibold text-theme-foreground">{totalCards}</div>
          </div>
          <div className="theme-panel rounded-lg p-4">
            <div className="text-xs text-theme-muted">Unique Cards</div>
            <div className="mt-1 text-2xl font-semibold text-theme-foreground">{deckCards.length}</div>
          </div>
          <div className="theme-panel rounded-lg p-4">
            <div className="text-xs text-theme-muted">Estimated Value</div>
            <div className="mt-1 text-2xl font-semibold text-theme-foreground">
              {currencyFormatter.format(estimatedPrice)}
            </div>
          </div>
          <div className="theme-panel rounded-lg p-4">
            <div className="text-xs text-theme-muted">Status</div>
            <div className="mt-1 text-lg font-semibold text-theme-foreground">
              {validation.isValid ? "Ready to Play" : `${totalCards}/60 cards`}
            </div>
          </div>
        </div>

        {!validation.isValid && validation.errors.length > 0 && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            <ul className="space-y-1">
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-theme-foreground">Deck Cards</h2>
            <span className="text-sm text-theme-muted">{deckCards.length} entries</span>
          </div>

          {sortedDeckCards.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-theme-muted" style={{ borderColor: "var(--theme-border-soft)" }}>
              This deck does not have any cards yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {sortedDeckCards.map((card) => (
                <button
                  key={card.card_key}
                  type="button"
                  onClick={() => setPreviewDeckCard(card)}
                  className="theme-card theme-card-hover rounded-lg overflow-hidden text-left cursor-zoom-in"
                  aria-label={`Preview ${card.name}`}
                >
                  <div className="theme-panel relative flex h-36 items-center justify-center p-2">
                    {card.image_url ? (
                      <img
                        src={card.image_url}
                        alt={card.name}
                        className="max-h-full w-auto max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-xs text-theme-muted">No image</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-black/75 px-2 py-1 text-center text-xs font-semibold text-white">
                      x{card.quantity}
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="truncate text-[11px] font-medium text-theme-foreground" title={card.name}>
                      {card.name}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-theme-muted">
                      {card.set_name ?? "Unknown Set"}
                      {card.card_number ? ` • #${card.card_number}` : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {previewDeckCardModal}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm text-theme-muted">
            <Link href="/decklists" className="hover:text-theme transition-colors">
              My Decklists
            </Link>
            <span className="mx-2">/</span>
            <span>{isExistingDeck ? loadedDeck?.name ?? "Edit Deck" : "New Deck"}</span>
          </div>
          <h1 className="mt-1 text-3xl font-semibold text-theme-foreground">
            {isExistingDeck ? "Edit Deck" : "Create Deck"}
          </h1>
          <p className="mt-2 text-theme-muted">
            Search cards, build your list, validate it, and save it to your account.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isExistingDeck && (
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className="theme-button-ghost rounded-md px-4 py-2 text-sm"
            >
              View Deck
            </button>
          )}
          <Link href="/decklists" className="theme-button-ghost inline-flex rounded-md px-4 py-2 text-sm">
            Back to My Decklists
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
        <section className="space-y-6">
          <PokemonCardFilter
            filters={filters}
            onFiltersChange={setFilters}
            availableSets={AVAILABLE_POKEMON_SETS}
            totalCards={allCards.length}
            filteredCards={filteredCards.length}
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSearchCards}
              disabled={searchLoading}
              className="theme-button rounded-md px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {searchLoading ? "Loading Cards..." : "Search Cards"}
            </button>
            <span className="text-sm text-theme-muted">
              Search for cards, then add them directly into your deck list.
            </span>
          </div>

          {searchError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
              {searchError}
            </div>
          )}

          {filteredCards.length > 0 && (
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-theme-foreground">
                Search Results ({filteredCards.length})
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-theme-muted">Tile size</span>
                  <div className="flex items-center gap-1 rounded-md border px-1 py-1" style={{ borderColor: "var(--theme-border-soft)" }}>
                    {[
                      { id: "compact", label: "S" },
                      { id: "comfortable", label: "M" },
                      { id: "large", label: "L" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTileSize(option.id as "compact" | "comfortable" | "large")}
                        className={`rounded px-2 py-1 text-xs transition-colors ${
                          tileSize === option.id ? "theme-button" : "theme-button-ghost"
                        }`}
                        aria-label={`Set card tile size to ${option.id}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                {totalPages > 1 && (
                  <p className="text-sm text-theme-muted">
                    Page {currentPage} of {totalPages}
                  </p>
                )}
              </div>
            </div>
          )}

          {paginatedCards.length > 0 && (
            <DeckCardSearchGrid
              cards={paginatedCards}
              quantitiesByCard={quantitiesByCard}
              onAddCard={addCardToDeck}
              onIncreaseCard={increaseDeckCard}
              onDecreaseCard={decreaseDeckCard}
              canIncreaseCard={canIncreaseDeckCard}
              tileSize={tileSize}
            />
          )}

          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
          )}

          {!searchLoading && filteredCards.length === 0 && allCards.length > 0 && (
            <div className="py-12 text-center text-theme-muted">
              <p>No cards match the current filters.</p>
              <p className="mt-2 text-sm">Try adjusting your search criteria or clearing filters.</p>
            </div>
          )}

          {!searchLoading && allCards.length === 0 && !searchError && (
            <div className="py-12 text-center text-theme-muted">
              <p>No cards loaded yet.</p>
              <p className="mt-2 text-sm">Use the filters above and click Search Cards to browse cards for your deck.</p>
            </div>
          )}
        </section>

        <aside className="xl:sticky xl:top-8 h-fit">
          <div className="theme-card rounded-lg p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="deck-name" className="block text-sm font-medium text-theme-foreground mb-1">
                  Deck Name
                </label>
                <input
                  id="deck-name"
                  type="text"
                  value={deckForm.name}
                  onChange={(event) => updateDeckForm("name", event.target.value)}
                  className="theme-input w-full rounded-md px-3 py-2"
                  placeholder="Enter your deck name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-foreground mb-1">
                  Format
                </label>
                <div className="theme-input w-full rounded-md px-3 py-2 opacity-80">
                  {DECK_FORMAT_OPTIONS[0]}
                </div>
                <p className="mt-1 text-sm text-theme-muted">
                  Only Standard format is supported right now.
                </p>
              </div>

              <div>
                <label htmlFor="deck-description" className="block text-sm font-medium text-theme-foreground mb-1">
                  Notes
                </label>
                <textarea
                  id="deck-description"
                  value={deckForm.description}
                  onChange={(event) => updateDeckForm("description", event.target.value)}
                  className="theme-input w-full rounded-md px-3 py-2 min-h-24"
                  placeholder="Strategy notes, matchup goals, tech cards..."
                />
              </div>

              <label className="flex items-start gap-3 rounded-md border p-3" style={{ borderColor: "var(--theme-border-soft)" }}>
                <input
                  type="checkbox"
                  checked={deckForm.is_public}
                  onChange={(event) => updateDeckForm("is_public", event.target.checked)}
                  className="mt-1 h-4 w-4 rounded"
                  style={{ accentColor: "var(--theme-border-color)" }}
                />
                <div>
                  <div className="font-medium text-theme-foreground">Public deck</div>
                  <p className="text-sm text-theme-muted">
                    Keep it private by default, or mark it public when you want to share it later.
                  </p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="theme-panel rounded-md p-3">
                <div className="text-xs text-theme-muted">Total Cards</div>
                <div className="mt-1 text-lg font-semibold text-theme-foreground">{totalCards}</div>
              </div>
              <div className="theme-panel rounded-md p-3">
                <div className="text-xs text-theme-muted">Unique Cards</div>
                <div className="mt-1 text-lg font-semibold text-theme-foreground">{deckCards.length}</div>
              </div>
              <div className="theme-panel rounded-md p-3">
                <div className="text-xs text-theme-muted">Est. Value</div>
                <div className="mt-1 text-lg font-semibold text-theme-foreground">
                  {currencyFormatter.format(estimatedPrice)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-theme-foreground">Validation</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${validation.isValid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {validation.isValid ? "Ready to Save" : "Needs Attention"}
                </span>
              </div>

              {validation.errors.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <ul className="space-y-1">
                    {validation.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  <ul className="space-y-1">
                    {validation.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {saveError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {saveSuccess}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveDeck}
                disabled={isSaving || !validation.isValid}
                className="theme-button flex-1 rounded-md px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : isExistingDeck ? "Save Changes" : "Save Deck"}
              </button>
              <button
                type="button"
                onClick={clearDeck}
                disabled={deckCards.length === 0}
                className="theme-button-ghost rounded-md px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-theme-foreground">Deck Cards</h2>
                <span className="text-sm text-theme-muted">{deckCards.length} entries</span>
              </div>

              {sortedDeckCards.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-theme-muted" style={{ borderColor: "var(--theme-border-soft)" }}>
                  Your deck is empty. Search for cards and add them from the results list.
                </div>
              ) : (
                <div className="grid max-h-[36rem] grid-cols-2 gap-2 overflow-y-auto pr-1">
                  {sortedDeckCards.map((card) => (
                    <div
                      key={card.card_key}
                      className="rounded-md border p-2"
                      style={{ borderColor: "var(--theme-border-soft)" }}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewDeckCard(card)}
                        className="flex w-full items-start gap-2 text-left cursor-zoom-in"
                        aria-label={`Preview ${card.name}`}
                      >
                        <div className="theme-panel flex h-14 w-10 shrink-0 items-center justify-center overflow-hidden rounded">
                          {card.image_url ? (
                            <img
                              src={card.image_url}
                              alt={card.name}
                              className="max-h-full w-auto max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-[9px] text-theme-muted">No image</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-[11px] font-medium text-theme-foreground">{card.name}</h3>
                          <p className="truncate text-[10px] text-theme-muted">
                            {card.set_name ?? "Unknown Set"}
                            {card.card_number ? ` • #${card.card_number}` : ""}
                          </p>
                          <p className="mt-0.5 text-[10px] text-theme-muted">
                            {currencyFormatter.format((card.market_price ?? 0) * card.quantity)}
                          </p>
                        </div>
                      </button>

                      <div className="mt-2 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => decreaseDeckCard(card.card_key)}
                            className="theme-button-ghost rounded px-2 py-0.5 text-[10px]"
                          >
                            -
                          </button>
                          <span className="min-w-4 text-center text-[10px] font-medium text-theme-foreground">{card.quantity}</span>
                          <button
                            type="button"
                            onClick={() => increaseDeckCard(buildDeckIncreaseCard(card))}
                            disabled={!canIncreaseDeckCard(getCardForDeckIncrease(card))}
                            className="theme-button-ghost rounded px-2 py-0.5 text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDeckCard(card.card_key)}
                          className="rounded px-2 py-0.5 text-[10px] text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {previewDeckCardModal}
    </div>
  );
}
