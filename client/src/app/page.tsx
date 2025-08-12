"use client";
/*
  Public landing page ("/").
  - Presents the product value proposition for visitors
  - If logged in, shows quick navigation to protected app pages + sign-out
*/
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, FormEvent } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

/**
 * Landing page route component.
 * @returns Marketing homepage with header, hero, features and footer
 */
/**
 * Marketing/landing page that adapts header actions based on auth state.
 */
export default function Home() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const router = useRouter();
  
  // Contact form submit handler (client-side placeholder)
  function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const message = String(formData.get("message") || "");
    if (!name || !email || !message) {
      alert("Please complete all fields.");
      return;
    }
    alert("Thanks! Your message has been received.");
    (event.currentTarget as HTMLFormElement).reset();
  }

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

  // Sign out and refresh the page to update UI
  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.refresh();
  }
  return (
    <main className="min-h-dvh text-gray-900">
      {/* Site header with brand and primary navigation */}
      <header className="border-b">
        <div className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-4 flex items-center justify-between">
          <Image
            src="https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/nnpl_logo.svg"
            alt="NNPL Logo"
            width={128}
            height={32}
            className="h-10 w-auto"
            priority
          />
          {isAuthed ? (
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/profile" className="hover:underline">Profile</Link>
              <button onClick={handleSignOut} className="rounded-md border px-3 py-1.5 hover:bg-gray-50">Sign out</button>
            </nav>
          ) : (
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/events" className="hover:underline">Events</Link>
              <Link href="/local-stores" className="hover:underline">Local Stores</Link>
              <Link href="/how-to-play" className="hover:underline">How to Play</Link>
              <Link href="/about-us" className="hover:underline">About Us</Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-md border px-3 py-1.5 hover:bg-white/50"
              >
                Log in / Sign up
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Welcome section */}
      <section className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Welcome to NNPL</h1>
          <p className="mt-4 text-lg text-gray-700">
            Northern Nevada Pokémon League — events, community, and resources for Trainers of all ages.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/signup" className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">Get Started</Link>
            <Link href="/events" className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-white/50">View Events</Link>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="border-t border-b/50 bg-white/30">
        <div className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-semibold text-center">Upcoming Events</h2>
          <div className="mt-8 grid justify-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[{ date: "Sat, Aug 24", title: "Standard Tournament", location: "Reno, NV" }, { date: "Sun, Sep 08", title: "League Challenge", location: "Sparks, NV" }, { date: "Sat, Sep 21", title: "Casual Play Meetup", location: "Carson City, NV" }].map((evt, idx) => (
              <div key={idx} className="rounded-lg border bg-white/60 p-6 text-center">
                <div className="text-sm text-gray-600">{evt.date}</div>
                <h3 className="mt-1 text-lg font-semibold">{evt.title}</h3>
                <div className="mt-1 text-sm text-gray-700">{evt.location}</div>
                <Link href="/events" className="mt-4 inline-flex items-center text-sm underline">Details</Link>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/events" className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-white/50">See all events</Link>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-semibold">About Us</h2>
          <p className="mt-4 text-gray-700">
            We’re a community of Pokémon TCG players and organizers in Northern Nevada. We host
            regular events, support new players with learn-to-play sessions, and connect Trainers
            with local stores and tournaments.
          </p>
        </div>
      </section>

      {/* Contact Us */}
      <section className="border-t border-b/50 bg-white/30">
        <div className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-semibold text-center">Contact Us</h2>
          <form onSubmit={handleContactSubmit} className="mt-8 grid gap-4 max-w-xl mx-auto">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input name="name" type="text" required className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black" />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black" />
            </div>
            <div>
              <label className="block text-sm font-medium">Message</label>
              <textarea name="message" rows={5} required className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black" />
            </div>
            <div>
              <button type="submit" className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">Send</button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-12 text-sm text-gray-700 text-center">
        © {new Date().getFullYear()} NNPL. All rights reserved.
      </footer>
    </main>
  );
}
