"use client";

import { useParams } from "next/navigation";
import DeckBuilder from "@/components/decklists/DeckBuilder";

export default function EditDeckPage() {
  const params = useParams<{ deckId: string }>();
  const deckId = Array.isArray(params.deckId) ? params.deckId[0] : params.deckId;

  return <DeckBuilder deckId={deckId} />;
}
