/*
  Pokemon Card API client.
  - Fetches Pokemon card pricing and details from Supabase
  - Uses the card_pricing_view view
  - Supports filtering by multiple criteria
  - Returns a list of Pokemon cards
*/

import type { PokemonCard, PokemonCardFilters } from "@/types/pokemonCard";

export async function fetchPokemonCards(filters: Partial<PokemonCardFilters>): Promise<PokemonCard[]> {
  const baseUrl = process.env.NEXT_PUBLIC_POKEMON_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_POKEMON_SUPABASE_ANON_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Missing Pokemon Card API credentials. Set NEXT_PUBLIC_POKEMON_SUPABASE_URL and NEXT_PUBLIC_POKEMON_SUPABASE_ANON_KEY in .env.local"
    );
  }

  // Build query parameters
  const queryParams: string[] = [];

  // Set ID filter (optional - if not provided, searches across all sets)
  if (filters.setID) {
    queryParams.push(`set_id=eq.${encodeURIComponent(filters.setID)}`);
  }

  // Name filter (case-insensitive partial match)
  if (filters.name) {
    queryParams.push(`name=ilike.%25${encodeURIComponent(filters.name)}%25`);
  }

  // Card number filter (exact match)
  if (filters.cardNumber) {
    queryParams.push(`card_number=eq.${encodeURIComponent(filters.cardNumber)}`);
  }

  // Illustrator filter (case-insensitive partial match)
  if (filters.illustrator) {
    queryParams.push(`illustrator=ilike.%25${encodeURIComponent(filters.illustrator)}%25`);
  }

  // Regulation mark filter (exact match)
  if (filters.regulationMark) {
    queryParams.push(`regulation_mark=eq.${encodeURIComponent(filters.regulationMark)}`);
  }

  // Price range filters
  if (filters.priceMin) {
    const minPrice = parseFloat(filters.priceMin);
    if (!isNaN(minPrice)) {
      queryParams.push(`market_price=gte.${minPrice}`);
    }
  }

  if (filters.priceMax) {
    const maxPrice = parseFloat(filters.priceMax);
    if (!isNaN(maxPrice)) {
      queryParams.push(`market_price=lte.${maxPrice}`);
    }
  }

  // Select all fields and order by localId
  queryParams.push(`select=*`);
  queryParams.push(`order=localId`);

  const queryString = queryParams.join("&");
  const url = `${baseUrl}/rest/v1/card_pricing_view?${queryString}`;

  const response = await fetch(url, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    // Try to get more detailed error information.
    let errorMessage = `Failed to fetch cards (${response.status}): ${response.statusText}`;
    try {
      const errorData = (await response.json()) as { message?: string };
      if (errorData.message) errorMessage += ` - ${errorData.message}`;
      // Common Supabase auth errors.
      if (response.status === 401) {
        errorMessage +=
          "\nThis usually means the API key is incorrect or missing. Verify that NEXT_PUBLIC_POKEMON_SUPABASE_ANON_KEY is set correctly in .env.local";
      }
    } catch {
      // If we can't parse the error response, use the status text.
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as PokemonCard[];
}