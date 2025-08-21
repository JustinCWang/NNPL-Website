/*
  Public Guide page ("/guide").
  - Accessible without authentication
  - Shows how to play Pokémon TCG
*/
import Link from "next/link";
import Image from "next/image";

export default function GuidePage() {
  return (
    <main className="min-h-dvh text-gray-900">
      {/* Simple header for public pages */}
      <header className="py-4 px-6 lg:px-8 border-b">
        <div className="mx-auto w-full max-w-screen-2xl flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold">← Back to Home</Link>
        </div>
      </header>
      
      <section className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 pt-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold text-center">How to Play</h1>
        </div>
        
        <section id="beginner">
          <div className="px-8 grid">
            <h2 className="mt-8 text-2xl font-semibold col-span-4">Getting Started</h2>
            <p className="mt-2 mr-4 text-gray-700 text-justify">
              To start playing Pokémon TCG, you need a deck of cards.
              Each deck consists of 60 cards, made up of 3 main types: Pokémon, Trainer, and Energy.
              Each deck contains up to 4 copies of any card except basic Energy cards, which have no hard limits.
              You can build your own deck or use one from{" "}
              <a
                href="https://limitlesstcg.com/"
                className="text-blue-600 underline hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                Limitless TCG
              </a>
              , a site that provides a wide range of deck lists from various tournaments.
              You can purchase these cards online at{" "}
              <a
                href="https://www.tcgplayer.com/"
                className="text-blue-600 underline hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                TCG&nbsp;Player
              </a>
              , or from various local vendors.
              A great place to start is{" "}
              <a
                href="https://tcg.pokemon.com/en-us/tcgl/"
                className="text-blue-600 underline hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pokémon&nbsp;TCG&nbsp;Live
              </a>
              , an online version of the TCG which lets you
              practice with pre-made decks or create new decks and try them out.
            </p>
            <Image src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/dragapult_ex.png" alt="Dragapult ex Pokémon card" width={160} height={224} className="px-2" />
            <Image src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/arven.png" alt="Arven Trainer card" width={160} height={224} className="px-2" />
            <Image src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/basic_fire.png" alt="Basic Fire Energy card" width={160} height={224} className="px-2" />
          </div>
          <div className="px-8 grid">
            <h2 className="mt-8 text-2xl font-semibold col-span-2" id="Setting Up">Setting Up</h2>
            <p className="mt-2 ml-4 text-gray-700 text-justify self-end">
              At the start of each game, each player shuffles their deck and offers for their opponent to cut it.
              One player rolls a dice to determine who goes first, with heads being even and tails being odd.
              The other player must call heads or tails before the dice is rolled.
              The player who wins the roll chooses whether to go first or second.
              Each player then draws 7 cards from their deck. Each player must place at least one Basic Pokémon card
              (denoted in the top left of a card) from their hand into the Active spot face-down.
              They may place down up to 5 additional Basic Pokémon on their Bench, also face-down.
              After placing a basic Pokémon in the Active spot, players must place 6 Prize cards face-down from their deck.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
