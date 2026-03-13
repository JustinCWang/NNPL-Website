"use client";
/*
  My Decklists page.
  - Lists the current user's saved decks
  - Supports visibility toggles and deletion
*/

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import DecklistList from "@/components/decklists/DecklistList";
import { deleteDecklist, fetchMyDecklists, updateDecklistVisibility } from "@/lib/decklistApi";
import type { DecklistSummary } from "@/types/decklist";

export default function DecklistsPage() {
  const [decklists, setDecklists] = useState<DecklistSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingDeckId, setPendingDeckId] = useState<string | null>(null);

  const loadDecklists = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const decks = await fetchMyDecklists();
      setDecklists(decks);
    } catch (loadError) {
      console.error("Error loading decklists:", loadError);
      setError("Failed to load your decklists. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDecklists();
  }, [loadDecklists]);

  useEffect(() => {
    if (!error && !successMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [error, successMessage]);

  const handleToggleVisibility = async (deckId: string, isPublic: boolean) => {
    try {
      setPendingDeckId(deckId);
      setError(null);
      await updateDecklistVisibility(deckId, isPublic);
      setDecklists((prev) =>
        prev.map((deck) => (deck.deck_id === deckId ? { ...deck, is_public: isPublic } : deck))
      );
      setSuccessMessage(`Deck is now ${isPublic ? "public" : "private"}.`);
    } catch (toggleError) {
      console.error("Error updating deck visibility:", toggleError);
      setError("Failed to update deck visibility. Please try again.");
    } finally {
      setPendingDeckId(null);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    const deck = decklists.find((entry) => entry.deck_id === deckId);
    if (!deck) {
      return;
    }

    if (!window.confirm(`Delete "${deck.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setPendingDeckId(deckId);
      setError(null);
      await deleteDecklist(deckId);
      setDecklists((prev) => prev.filter((entry) => entry.deck_id !== deckId));
      setSuccessMessage(`Deleted "${deck.name}".`);
    } catch (deleteError) {
      console.error("Error deleting deck:", deleteError);
      setError("Failed to delete the deck. Please try again.");
    } finally {
      setPendingDeckId(null);
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-theme-foreground">My Decklists</h1>
          <p className="mt-2 text-theme-muted">
            Build, save, and manage your Pokemon TCG decklists in one place.
          </p>
        </div>
        <Link href="/decklists/new" className="theme-button inline-flex rounded-md px-4 py-2">
          Create New Deck
        </Link>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-green-700">
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-theme border-t-transparent"></div>
          <p className="mt-3 text-theme-muted">Loading your decklists...</p>
        </div>
      ) : (
        <DecklistList
          decks={decklists}
          pendingDeckId={pendingDeckId}
          onToggleVisibility={handleToggleVisibility}
          onDeleteDeck={handleDeleteDeck}
        />
      )}
    </main>
  );
}
