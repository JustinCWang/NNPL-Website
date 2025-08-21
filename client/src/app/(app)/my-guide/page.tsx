/*
  Protected Guide page ("/guide" - authenticated users).
  - Shows how to play Pokémon TCG
  - Additional features: progress tracking, personalized tips, deck builder tools
*/
"use client";
import { useState } from "react";
import Image from "next/image";

export default function GuidePage() {
  const [selectedTab, setSelectedTab] = useState<'basics' | 'advanced' | 'deckbuilding' | 'progress'>('basics');

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">How to Play</h1>
        <p className="mt-2 text-gray-600">Master the Pokémon TCG with personalized guidance and track your learning progress.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('basics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'basics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Basics
          </button>
          <button
            onClick={() => setSelectedTab('advanced')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'advanced'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Advanced
          </button>
          <button
            onClick={() => setSelectedTab('deckbuilding')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'deckbuilding'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Deck Building
          </button>
          <button
            onClick={() => setSelectedTab('progress')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'progress'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Progress
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'basics' && (
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                To start playing Pokémon TCG, you need a deck of cards.
                Each deck consists of 60 cards, made up of 3 main types: Pokémon, Trainer, and Energy.
              </p>
              <div className="flex gap-4 mb-4">
                <Image src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/dragapult_ex.png" alt="Dragapult ex" width={96} height={134} />
                <Image src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/arven.png" alt="Arven" width={96} height={134} />
                <Image src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/basic_fire.png" alt="Fire Energy" width={96} height={134} />
              </div>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700">
                ✓ Mark as Completed
              </button>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Setting Up the Game</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Each player shuffles their deck, draws 7 cards, and places at least one Basic Pokémon as their Active Pokémon.
                Set aside 6 Prize cards face-down.
              </p>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50">
                Mark as Completed
              </button>
            </div>
          </section>
        </div>
      )}

      {selectedTab === 'advanced' && (
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Advanced Strategies</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Learn advanced techniques like prize mapping, resource management, and meta game analysis.
              </p>
              <p className="text-gray-500">Content coming soon...</p>
            </div>
          </section>
        </div>
      )}

      {selectedTab === 'deckbuilding' && (
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Deck Building Tools</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Build and test your decks with our integrated deck builder and simulator.
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                Open Deck Builder
              </button>
            </div>
          </section>
        </div>
      )}

      {selectedTab === 'progress' && (
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Learning Progress</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Basic Rules</span>
                  <span>0/5 completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '0%'}}></div>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Advanced Strategies</span>
                  <span>0/8 completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '0%'}}></div>
                </div>
              </div>
              <p className="text-gray-500 text-sm">Start completing lessons to track your progress!</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
