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
    <div className="bg-white rounded-lg shadow-sm border mb-6">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Filter Cards</h3>
            {totalCards > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {filteredCards} of {totalCards} cards
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
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
              <label htmlFor="setID" className="block text-xs font-medium text-gray-700 mb-1">
                Pokemon Set
              </label>
              <select
                id="setID"
                value={filters.setID}
                onChange={(e) => handleFilterChange("setID", e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                Card Name
              </label>
              <input
                type="text"
                id="name"
                value={filters.name}
                onChange={(e) => handleFilterChange("name", e.target.value)}
                placeholder="Search by name..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Card Number */}
            <div>
              <label htmlFor="cardNumber" className="block text-xs font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                value={filters.cardNumber}
                onChange={(e) => handleFilterChange("cardNumber", e.target.value)}
                placeholder="e.g., 001, 002..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Illustrator */}
            <div>
              <label htmlFor="illustrator" className="block text-xs font-medium text-gray-700 mb-1">
                Illustrator
              </label>
              <input
                type="text"
                id="illustrator"
                value={filters.illustrator}
                onChange={(e) => handleFilterChange("illustrator", e.target.value)}
                placeholder="Search illustrator..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Regulation Mark */}
            <div>
              <label htmlFor="regulationMark" className="block text-xs font-medium text-gray-700 mb-1">
                Regulation Mark
              </label>
              <input
                type="text"
                id="regulationMark"
                value={filters.regulationMark}
                onChange={(e) => handleFilterChange("regulationMark", e.target.value)}
                placeholder="e.g., F, G, H..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Price Range - Min */}
            <div>
              <label htmlFor="priceMin" className="block text-xs font-medium text-gray-700 mb-1">
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
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Price Range - Max */}
            <div>
              <label htmlFor="priceMax" className="block text-xs font-medium text-gray-700 mb-1">
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
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs font-medium text-gray-700">Active:</span>
                {filters.setID && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Set: {availableSets.find(s => s.value === filters.setID)?.label || filters.setID}
                  </span>
                )}
                {filters.name && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Name: {filters.name}
                  </span>
                )}
                {filters.cardNumber && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    #{filters.cardNumber}
                  </span>
                )}
                {filters.illustrator && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Illus: {filters.illustrator}
                  </span>
                )}
                {filters.regulationMark && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Reg: {filters.regulationMark}
                  </span>
                )}
                {filters.priceMin && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    ${filters.priceMin}+
                  </span>
                )}
                {filters.priceMax && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
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
