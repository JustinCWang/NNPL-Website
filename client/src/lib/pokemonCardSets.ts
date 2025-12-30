/*
  Pokemon card set catalog for the Pokemon Cards page.
  - Centralizes the list of supported set IDs so UI components stay small
*/

import type { PokemonSetOption } from "@/components/pokemon-cards/PokemonCardsSearch";

export const AVAILABLE_POKEMON_SETS: PokemonSetOption[] = [
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
  // { value: "me02.5", label: "Mega Evolution—Ascended Heroes" },
];


