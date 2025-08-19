"use client";
/*
  Public landing page ("/").
  - Presents the product value proposition for visitors
  - If logged in, shows quick navigation to protected app pages + sign-out
*/
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, FormEvent, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

/**
 * Landing page route component.
 * @returns Marketing homepage with header, hero, features and footer
 */
/**
 * Marketing/landing page that adapts header actions based on auth state.
 */
export default function Home() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  
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

  // Note: Header UI is unified for authed and unauthed states.
  // When authenticated, we show an extra "Dashboard" tab.
  return (
    <main className="min-h-dvh text-gray-900">
      {/* Site header with brand and primary navigation */}
      <header className="border-b">
        <div className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-4 grid grid-cols-3 items-center">
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
            {isAuthed && (
              <Link href="/home" className="font-semibold hover:underline">Home</Link>
            )}
            <Link href="/events" className="hover:underline">Events</Link>
            <Link href="/stores" className="hover:underline">Local Stores</Link>
            <Link href="/guide" className="hover:underline">How to Play</Link>
            <Link href="/about-us" className="hover:underline">About Us</Link>
          </nav>
          {/* Right: Auth actions */}
          <div className="justify-self-end">
            {isAuthed ? (
              <LandingPageProfileDropdown />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-white/50"
              >
                Log in / Sign up
              </Link>
            )}
          </div>
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
              <button type="submit" className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 cursor-pointer">Send</button>
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

/**
 * Generate initials from a user's name
 */
function getInitials(name: string): string {
  if (!name) return 'U';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  } else {
    return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
  }
}

/**
 * Profile dropdown component for the landing page
 */
function LandingPageProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user info for display
    const supabase = getSupabaseClient();
    
    // Get user metadata (name) and database info (username)
    const fetchUserData = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (user) {
          setUserName(user.user_metadata?.name ?? null);
          
          try {
            // Get username from Users table
            const { data: dbResult } = await supabase
              .from('Users')
              .select('username')
              .eq('user_id', user.id)
              .single();
            
            setUsername(dbResult?.username ?? user.email?.split('@')[0] ?? 'User');
          } catch {
            // Fallback to email prefix if database query fails
            setUsername(user.email?.split('@')[0] ?? 'User');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();

    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  // Get initials for avatar
  const initials = getInitials(userName || 'User');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-gray-600 text-white text-sm font-medium flex items-center justify-center hover:bg-gray-700 transition-colors"
        aria-label="Profile menu"
      >
        {initials}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            {/* User info */}
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
              {username || 'User'}
            </div>
            
            {/* Navigation links */}
            <Link
              href="/home"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>
            
            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
