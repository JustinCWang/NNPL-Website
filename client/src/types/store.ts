/*
  TypeScript types for Store entity and related operations.
  Based on the Stores table schema: store_id, location, avg_players, has_league, name, website, discord
*/

export interface Store {
  store_id: string;
  name: string;
  location: string;
  avg_players: number;
  has_league: boolean;
  website?: string;
  discord?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStoreData {
  name: string;
  location: string;
  avg_players: number;
  has_league: boolean;
  website?: string;
  discord?: string;
}

export interface UpdateStoreData extends Partial<CreateStoreData> {
  store_id: string;
}

export interface StoreFormData {
  name: string;
  location: string;
  avg_players: number;
  has_league: boolean;
  website: string;
  discord: string;
}
