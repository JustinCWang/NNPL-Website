"use client";
/*
  Public landing page ("/").
  - Presents the product value proposition for visitors
  - If logged in, shows quick navigation to protected app pages + sign-out
  - Displays real data from Supabase for stores and events
*/
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import ProfileDropdown from "@/components/layout/ProfileDropdown";
import ContactForm from "@/components/ui/ContactForm";
import RotatingPictures from "@/components/ui/RotatingPictures";
import { Store } from "@/types/store";
import { Event } from "@/types/event";
import StoreCard from "@/components/ui/StoreCard";
import EventCard from "@/components/ui/EventCard";

/**
 * Landing page route component.
 * @returns Marketing homepage with header, hero, features and footer
 */
/**
 * Marketing/landing page that adapts header actions based on auth state.
 */
export default function Home() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth state bootstrap and live sync:
  // - Check session (fast path), fallback to getUser
  // - Subscribe to auth changes to keep UI in sync
  // - Clean up listener on unmount
  useEffect(() => {
    const supabase = getSupabaseClient();
    let isMounted = true;
    async function init() {
      // Prefer session: contains token + user when available
      const { data: sessionData } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (sessionData.session) {
        setIsAuthed(true);
        return;
      }
      // Fallback: sometimes user is available slightly earlier than session cache
      const { data: userData } = await supabase.auth.getUser();
      if (!isMounted) return;
      setIsAuthed(!!userData.user);
    }
    init();
    // Listen for sign in/out/refresh and reflect immediately
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthed(!!session);
    });
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Fetch stores and events data
  useEffect(() => {
    async function fetchData() {
      const supabase = getSupabaseClient();
      
      try {
        // Fetch stores ordered by avg_players (largest to smallest)
        const { data: storesData, error: storesError } = await supabase
          .from('Stores')
          .select('*')
          .order('avg_players', { ascending: false });

        if (storesError) {
          console.error('Error fetching stores:', storesError);
        } else {
          setStores(storesData || []);
        }

        // Fetch events ordered by date (closest to farthest)
        const { data: eventsData, error: eventsError } = await supabase
          .from('Events')
          .select(`
            *,
            store:Stores(name, location)
          `)
          .gte('date', new Date().toISOString().split('T')[0]) // Only future events
          .order('date', { ascending: true });

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
        } else {
          setEvents(eventsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);



  // Note: Header UI is unified for authed and unauthed states.
  // When authenticated, we show an extra "Dashboard" tab.
  return (
    <main className="min-h-dvh text-gray-900">
      {/* Site header with brand and primary navigation */}
      <header className="py-4 px-6 lg:px-8">
        <div className="mx-auto w-full max-w-screen-xl bg-gray-50 border-1 border-gray-200 rounded-full shadow-xl px-6 lg:px-8 py-4 grid grid-cols-3 items-center">
          {/* Left: Logo */}
          <div className="justify-self-start">
            <Link href="/">
              <Image
                src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/nnpl_logo.svg"
                alt="NNPL Logo"
                width={128}
                height={32}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>
          {/* Center: Primary navigation */}
          <nav className="justify-self-center flex items-center gap-5 text-sm">
            <Link href="/events" className="hover:underline">Events</Link>
            <Link href="/stores" className="hover:underline">Local Stores</Link>
            <Link href="/guide" className="hover:underline">How to Play</Link>
            <Link href="/about-us" className="hover:underline">About Us</Link>
          </nav>
          {/* Right: Auth actions */}
          <div className="justify-self-end">
            {isAuthed ? (
              <ProfileDropdown variant="landing" />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center rounded-md bg-black text-white px-3 py-1.5 text-sm hover:bg-gray-800"
              >
                Log in / Sign up
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Welcome section with carousel background */}
      <section className="relative mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-24 lg:py-36 mt-8">
        {/* Background carousel - made much larger */}
        <div className="absolute inset-0 -z-10 rounded-2xl overflow-hidden">
          <RotatingPictures className="h-full w-full rounded-2xl" />
        </div>
        
        {/* Transparent overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 -z-10 rounded-2xl" />
        
        {/* Welcome content overlaid on carousel */}
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
            Welcome to NNPL
          </h1>
          <p className="mt-4 text-lg text-white/90 drop-shadow-md">
            Northern Nevada Pokémon League — events, community, and resources for Trainers of all ages.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/signup" className="inline-flex items-center rounded-md bg-white px-4 py-2 text-black hover:bg-gray-100 font-medium">
              Get Started
            </Link>
            <a href="#upcoming-events" className="inline-flex items-center rounded-md border border-white px-4 py-2 text-white hover:bg-white/20 backdrop-blur-sm">
              View Events
            </a>
          </div>
        </div>
      </section>

      {/* Local Stores Section */}
      <section className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-semibold text-center mb-8">Local Stores</h2>
        {loading ? (
          <div className="text-center text-gray-600">Loading stores...</div>
        ) : stores.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <StoreCard key={store.store_id} store={store} variant="landing" />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-600">No stores found</div>
        )}
        <div className="mt-8 text-center">
          <Link href="/stores" className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-white/50">
            View all stores
          </Link>
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="upcoming-events" className="border-t border-b/50 bg-white/30">
        <div className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-semibold text-center">Upcoming Events</h2>
          {loading ? (
            <div className="text-center text-gray-600 mt-8">Loading events...</div>
          ) : events.length > 0 ? (
            <div className="mt-8 grid justify-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.slice(0, 6).map((event) => (
                <EventCard 
                  key={event.event_id} 
                  event={event} 
                  variant="public"
                  showActions={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 mt-8">No upcoming events found</div>
          )}
          <div className="mt-8 text-center">
            <Link href="/events" className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-white/50">
              See all events
            </Link>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-semibold">About Us</h2>
          <p className="mt-4 text-gray-700">
            We&apos;re a community of Pokémon TCG players and organizers in Northern Nevada. We host
            regular events, support new players with learn-to-play sessions, and connect Trainers
            with local stores and tournaments.
          </p>
        </div>
      </section>

      {/* Contact Us */}
      <section className="border-t border-b/50 bg-white/30">
        <div className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-16">
          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-12 text-sm text-gray-700 text-center">
        © {new Date().getFullYear()} NNPL. All rights reserved.
      </footer>
    </main>
  );
}


