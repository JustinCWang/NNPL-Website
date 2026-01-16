/*
  Pokemon card domain types.
  - Shared between the Pokemon Cards UI and its API client
  - Matches the card_pricing_view schema from Supabase
*/

export type PokemonCard = {
  set_id: string;
  name: string;
  number_plus_name: string;
  image_url: string;
  set_name: string;
  localId: string;
  market_price: number | null;
  card_number: string;
  illustrator: string | null;
  regulation_mark: string | null;
};

export type PokemonCardFilters = {
  setID: string;
  name: string;
  cardNumber: string;
  illustrator: string;
  regulationMark: string;
  priceMin: string;
  priceMax: string;
};


