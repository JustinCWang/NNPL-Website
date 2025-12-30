/*
  Pokemon Card API client.
  - Fetches Pokemon card pricing and details from Supabase
  - Uses the card_pricing_view view
  - Returns a list of Pokemon cards
*/

import type { PokemonCard } from "@/types/pokemonCard";

export async function fetchPokemonCards(setID: string): Promise<PokemonCard[]> {
  const baseUrl = process.env.NEXT_PUBLIC_POKEMON_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_POKEMON_SUPABASE_ANON_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Missing Pokemon Card API credentials. Set NEXT_PUBLIC_POKEMON_SUPABASE_URL and NEXT_PUBLIC_POKEMON_SUPABASE_ANON_KEY in .env.local"
    );
  }

  const url = `${baseUrl}/rest/v1/card_pricing_view?set_id=eq.${setID}&select=number_plus_name,market_price,image_url,illustrator&order=localId`;

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