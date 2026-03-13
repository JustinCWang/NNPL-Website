"use client";
/*
  Pokemon Card Filters component for filtering cards on the Pokemon Cards page.
  - Set selection dropdown
  - Card name search
  - Card number search
  - Illustrator filter
  - Regulation mark filter
  - Price range (min/max)
  - Collapsible interface with active filters summary
  - Follows the style pattern from UserEventFilters component
*/

import { useState, useMemo, useCallback } from "react";
import type { PokemonCardFilters } from "@/types/pokemonCard";
import type { PokemonSetOption } from "./PokemonCardsSearch";

interface PokemonCardFilterProps {
  filters: PokemonCardFilters;
  onFiltersChange: (filters: PokemonCardFilters) => void;
  availableSets: PokemonSetOption[];
  totalCards: number;
  filteredCards: number;
}

export default function PokemonCardFilter({
  filters,
  onFiltersChange,
  availableSets,
  totalCards,
  filteredCards,
}: PokemonCardFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = useCallback(
    (key: keyof PokemonCardFilters, value: string) => {
      onFiltersChange({
        ...filters,
        [key]: value,
      });
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange({
      setID: "",
      name: "",
      cardNumber: "",
      illustrator: "",
      regulationMark: "",
      priceMin: "",
      priceMax: "",
    });
  }, [onFiltersChange]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.setID ||
      filters.name ||
      filters.cardNumber ||
      filters.illustrator ||
      filters.regulationMark ||
      filters.priceMin ||
      filters.priceMax
    );
  }, [filters]);

  return (
    <div className="theme-card rounded-lg mb-6">
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--theme-border-soft)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-theme-foreground">Filter Cards</h3>
            {totalCards > 0 && (
              <span className="theme-chip inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                {filteredCards} of {totalCards} cards
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="theme-button-ghost rounded-md px-2 py-1 text-sm"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="theme-button-ghost flex items-center space-x-1 rounded-md px-2 py-1"
            >
              <span className="text-sm font-medium">{showFilters ? "Hide Filters" : "Show Filters"}</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${showFilters ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Set Selection */}
            <div>
              <label htmlFor="setID" className="block text-xs font-medium text-theme-foreground mb-1">
                Pokemon Set
              </label>
              <select
                id="setID"
                value={filters.setID}
                onChange={(e) => handleFilterChange("setID", e.target.value)}
                className="theme-input w-full px-2 py-1.5 text-sm rounded-md"
              >
                <option value="">All Sets</option>
                {availableSets.map((set) => (
                  <option key={set.value} value={set.value}>
                    {set.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Card Name Search */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-theme-foreground mb-1">
                Card Name
              </label>
              <input
                type="text"
                id="name"
                value={filters.name}
                onChange={(e) => handleFilterChange("name", e.target.value)}
                placeholder="Search by name..."
                className="theme-input w-full px-2 py-1.5 text-sm rounded-md"
              />
            </div>

            {/* Card Number */}
            <div>
              <label htmlFor="cardNumber" className="block text-xs font-medium text-theme-foreground mb-1">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                value={filters.cardNumber}
                onChange={(e) => handleFilterChange("cardNumber", e.target.value)}
                placeholder="e.g., 001, 002..."
                className="theme-input w-full px-2 py-1.5 text-sm rounded-md"
              />
            </div>

            {/* Illustrator */}
            <div>
              <label htmlFor="illustrator" className="block text-xs font-medium text-theme-foreground mb-1">
                Illustrator
              </label>
              <input
                type="text"
                id="illustrator"
                value={filters.illustrator}
                onChange={(e) => handleFilterChange("illustrator", e.target.value)}
                placeholder="Search illustrator..."
                className="theme-input w-full px-2 py-1.5 text-sm rounded-md"
              />
            </div>

            {/* Regulation Mark */}
            <div>
              <label htmlFor="regulationMark" className="block text-xs font-medium text-theme-foreground mb-1">
                Regulation Mark
              </label>
              <input
                type="text"
                id="regulationMark"
                value={filters.regulationMark}
                onChange={(e) => handleFilterChange("regulationMark", e.target.value)}
                placeholder="e.g., F, G, H..."
                className="theme-input w-full px-2 py-1.5 text-sm rounded-md"
              />
            </div>

            {/* Price Range - Min */}
            <div>
              <label htmlFor="priceMin" className="block text-xs font-medium text-theme-foreground mb-1">
                Min Price ($)
              </label>
              <input
                type="number"
                id="priceMin"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange("priceMin", e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="theme-input w-full px-2 py-1.5 text-sm rounded-md"
              />
            </div>

            {/* Price Range - Max */}
            <div>
              <label htmlFor="priceMax" className="block text-xs font-medium text-theme-foreground mb-1">
                Max Price ($)
              </label>
              <input
                type="number"
                id="priceMax"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange("priceMax", e.target.value)}
                placeholder="999.99"
                min="0"
                step="0.01"
                className="theme-input w-full px-2 py-1.5 text-sm rounded-md"
              />
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--theme-border-soft)" }}>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs font-medium text-theme-foreground">Active:</span>
                {filters.setID && (
                  <span className="theme-chip inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                    Set: {availableSets.find(s => s.value === filters.setID)?.label || filters.setID}
                  </span>
                )}
                {filters.name && (
                  <span className="theme-chip inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                    Name: {filters.name}
                  </span>
                )}
                {filters.cardNumber && (
                  <span className="theme-chip inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                    #{filters.cardNumber}
                  </span>
                )}
                {filters.illustrator && (
                  <span className="theme-chip inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                    Illus: {filters.illustrator}
                  </span>
                )}
                {filters.regulationMark && (
                  <span className="theme-chip inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                    Reg: {filters.regulationMark}
                  </span>
                )}
                {filters.priceMin && (
                  <span className="theme-chip inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                    ${filters.priceMin}+
                  </span>
                )}
                {filters.priceMax && (
                  <span className="theme-chip inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                    ${filters.priceMax}-
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
