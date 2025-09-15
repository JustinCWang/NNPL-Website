/*
  Protected Guide page ("/guide" - authenticated users).
  - Shows how to play Pokémon TCG
  - Additional features: progress tracking, personalized tips, deck builder tools
*/
"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import TooltipHover from "@/components/layout/TooltipHover";
import PopUpMenu from "@/components/layout/PopUpMenu";

export default function GuidePage() {
  const [selectedTab, setSelectedTab] = useState<'basics' | 'advanced' | 'deckbuilding' | 'progress'>('basics')
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);

  // original dimensions of the image
  const nativeWidth = 7350;
  const nativeHeight = 4350;

  useEffect(() => {
    function updateScale() {
      if (imgRef.current) {
        const renderedWidth = imgRef.current.clientWidth;
        setScale(renderedWidth / nativeWidth);
      }
    }

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // helper to scale coords
  function scaleCoords(coords: string) {
    return coords
      .split(",")
      .map((n) => Math.round(parseInt(n) * scale))
      .join(",");
  }

const Energy = ({ type }: { type: string }) => (
  <Image
    src={`https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/${type}.png`}
    alt={`${type} energy`}
    width={16}
    height={16}
    className="inline-block w-[1em] h-[1em]"
  />
);



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
                {/* Card Images w/ TooltipHover and PopUpMenu*/}

                <PopUpMenu trigger={
                  <TooltipHover content={
                    <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg" >
                      Dragapult ex - 320 HP
                      <br />
                      Tera Attribute: This Pokémon is immune to damage from any attack while on the bench.
                      <br />
                      Type: Dragon <Energy type="dragon" />
                      <br />
                      <Energy type="colorless" /> Jet Headbutt (70)
                      <br />
                      <Energy type="fire" /> <Energy type="psychic" /> Phantom Dive (200) - Put 6 damage counters on your opponent&apos;s Benched Pokémon in any way you like.
                      <br />
                      Weakness: None | Resistance: None | Retreat: <Energy type="colorless" />
                    </div>
                  } >
                    <Image src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/example_cards/dragapult_ex.png"
                          alt="Dragapult ex"
                          width={245}
                          height={342} />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

                <PopUpMenu trigger={
                  <TooltipHover content={
                    <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg" >
                      Arven
                      <br />
                      Trainer - Supporter
                      <br />
                      You may play one Supporter card during your turn
                    </div>
                  } >
                    <Image src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/example_cards/arven.png"
                          alt="Arven"
                          width={245}
                          height={342} />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

                <PopUpMenu trigger={
                  <TooltipHover content={
                    <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg" >
                      Buddy-Buddy Poffin
                      <br />
                      Trainer - Item
                      <br />
                      You may play as many Item cards as you like during your turn.
                    </div>
                  } >
                    <Image src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/example_cards/buddy-buddy_poffin.png"
                          alt="Fire Energy"
                          width={245}
                          height={342} />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

                <PopUpMenu trigger={
                  <TooltipHover content={
                    <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg" >
                      Air Balloon
                      <br />
                      Trainer - Tool
                      <br />
                      You may attach any number of Tool cards to your Pokémon during your turn (Only one per Pokémon).
                      <br />
                      Tool cards remain attached.
                    </div>
                  } >
                    <Image src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/example_cards/air_balloon.png"
                          alt="Fire Energy"
                          width={245}
                          height={342} />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

                <PopUpMenu trigger={
                  <TooltipHover content={
                    <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg" >
                      Jamming Tower
                      <br />
                      Trainer - Stadium
                      <br />
                      You may play one Stadium card during your turn. Stadium cards remain in play until another Stadium card is played.
                      <br />
                      You may not play a Stadium card of the same name as a Stadium card already in play.
                    </div>
                  } >
                    <Image src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/example_cards/jamming_tower.png"
                          alt="Fire Energy"
                          width={245}
                          height={342} />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

                <PopUpMenu trigger={
                  <TooltipHover content={
                    <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg" >
                      Basic Fire Energy <Energy type="fire" />
                      <br />
                      You may attach one Energy card from your hand to one of your Pokémon per turn.
                    </div>
                  } >
                    <Image src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/example_cards/basic_fire.png"
                          alt="Fire Energy"
                          width={245}
                          height={342} />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

                <PopUpMenu trigger={
                  <TooltipHover content={
                    <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg" >
                      Neo Upper Energy
                      <br />
                      ACE SPEC - You may only include 1 ACE SPEC card (Item, Tool, Stadium, or Energy) in your deck.
                    </div>
                  } >
                    <Image src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/example_cards/neo_upper_energy.png"
                          alt="Fire Energy"
                          width={245}
                          height={342} />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>
                
              </div>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700">
                ✓ Mark as Completed
              </button>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Setting Up the Game</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6 grid">
              
              {/* Map with Area elements enclosed in TooltipHover elements will go here */}
              <Image
                ref={imgRef}
                src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/play_mat_new.png"
                alt="Fire Energy"
                width={nativeWidth}
                height={nativeHeight}
                unoptimized
                className="w-full h-auto mb-6 rounded-xl"
                useMap="#playMap"
              />

              <map name="playMap">

                {/* Prize Cards */}
                <PopUpMenu trigger={
                  <TooltipHover
                    content={
                      <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg text-center">
                        Prize Cards
                        <br />
                        -----------
                        <br />
                        Face down
                      </div>
                    }
                  >
                    <area
                      shape="poly"
                      coords={scaleCoords("300,600 , 300,4049 , 1124,4049 , 1124,3899 , 1574,3899 , 1574,450 , 750,450 , 750,600")}
                      href="PrizeCardLink"
                    />
                  </TooltipHover>
                }>
                  <h2 className="text-lg font-semibold mb-2">Prize Cards</h2>
                  <p className="text-gray-700 mb-4">
                    Set aside 6 Prize cards face-down. You take one face-down card and place it into your hand when you Knock Out an opponent&apos;s Pokémon.
                  </p>
                </PopUpMenu>

                {/* Active */}
                <PopUpMenu trigger={
                  <TooltipHover
                    content={
                      <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg text-center">
                        Active Pokémon
                        <br />
                        --------------
                        <br />
                        Face up
                      </div>
                    }
                  >
                    <area
                      shape="rect"
                      coords={scaleCoords("3262,300 , 4087,1274")}
                      href="ActiveLink"
                    />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

                {/* Bench */}
                <PopUpMenu trigger={
                  <TooltipHover
                    content={
                      <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg text-center">
                        Benched Pokémon
                        <br />
                        ----------------
                        <br />
                        Face up
                      </div>
                    }
                  >
                    <area
                      shape="rect"
                      coords={scaleCoords("1687,2512 , 6112,3636")}
                      href="BenchLink"
                    />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

                {/* Asleep */}
                <PopUpMenu trigger={
                  <TooltipHover
                    content={
                      <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg text-center">
                        Active Pokémon Status
                        <br />
                        ------------------------------
                        <br />
                        Turn Pokémon counter-clockwise
                      </div>
                    }
                  >
                    <area
                      shape="rect"
                      coords={scaleCoords("3112,450 , 3262,1274")}
                      href="AsleepLink"
                    />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

                {/* Confused */}
                <PopUpMenu trigger={
                  <TooltipHover
                    content={
                      <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg text-center">
                        Active Pokémon Status
                        <br />
                        ------------------------
                        <br />
                        Turn Pokémon upside down
                      </div>
                    }
                  >
                    <area
                      shape="rect"
                      coords={scaleCoords("3262,1274 , 4087,1424")}
                      href="ConfusedLink"
                    />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

                {/* Paralyzed */}
                <PopUpMenu trigger={
                  <TooltipHover
                    content={
                      <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg text-center">
                        Active Pokémon Status
                        <br />
                        ----------------------
                        <br />
                        Turn Pokémon clockwise
                      </div>
                    }
                  >
                    <area
                      shape="rect"
                      coords={scaleCoords("4087,450 , 4237,1274")}
                      href="ParalyzedLink"
                    />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

                {/* Stadium */}
                <PopUpMenu trigger={
                  <TooltipHover
                    content={
                      <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg text-center">
                        Active Pokémon Status
                        <br />
                        ----------------------
                        <br />
                        Turn Pokémon clockwise
                      </div>
                    }
                  >
                    <area
                      shape="rect"
                      coords={scaleCoords("5250,225 , 6074,3429")}
                      href="StadiumLink"
                    />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

                {/* Deck */}
                <PopUpMenu trigger={
                  <TooltipHover
                    content={
                      <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg text-center">
                        Your Deck
                        <br />
                        ---------
                        <br />
                        Face down
                      </div>
                    }
                  >
                    <area
                      shape="rect"
                      coords={scaleCoords("6225,1612 , 7049,2737")}
                      href="DeckLink"
                    />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

                {/* Discard */}
                <PopUpMenu trigger={
                  <TooltipHover
                    content={
                      <div className="absolute w-max pointer-events-none px-3 py-1 bg-black text-white text-sm rounded-lg shadow-lg text-center">
                        Your Discard
                        <br />
                        ------------
                        <br />
                        Face up
                      </div>
                    }
                  >
                    <area
                      shape="rect"
                      coords={scaleCoords("6225,2925 , 7049,4049")}
                      href="DiscardLink"
                    />
                  </TooltipHover>
                }>
                  Temporary tooltip content
                </PopUpMenu>

              </map>
              
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
