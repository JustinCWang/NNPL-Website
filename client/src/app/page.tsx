"use client";
/*
  Public landing page ("/").
  - Presents the product value proposition for visitors
  - If logged in, shows quick navigation to protected app pages + sign-out
*/
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const supabase = getSupabaseClient();
    let isMounted = true;
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (sessionData.session) {
        setIsAuthed(true);
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      if (!isMounted) return;
      setIsAuthed(!!userData.user);
    }
    init();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthed(!!session);
    });
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.refresh();
  }
  return (
    <main className="min-h-dvh bg-white text-gray-900">
      {/* Site header with brand and primary navigation */}
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
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
            <nav className="flex items-center gap-4">
              <Link href="/home" className="hover:underline">Home</Link>
              <Link href="/events" className="hover:underline">Events</Link>
              <Link href="/about-us" className="hover:underline">About Us</Link>
              <Link href="/signup" className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800">Log in/Sign up</Link>
            </nav>
          )}
        </div>
      </header>

      {/* Hero section */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Build something great with NNPL</h1>
          <p className="mt-4 text-lg text-gray-600">A minimal starter you can extend. Replace this copy with your value proposition.</p>
          {isAuthed === false && (
            <div className="mt-8 flex gap-3">
              <Link href="/signup" className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">Get started</Link>
              <Link href="/login" className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-gray-50">I already have an account</Link>
            </div>
          )}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="bg-gray-50 border-t border-b">
        <div className="mx-auto max-w-6xl px-6 py-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="font-semibold">Fast</h3>
            <p className="mt-2 text-sm text-gray-600">Next.js 15 + React 19 + Tailwind v4.</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="font-semibold">Modern</h3>
            <p className="mt-2 text-sm text-gray-600">App Router, file-based routing, and server components.</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="font-semibold">Flexible</h3>
            <p className="mt-2 text-sm text-gray-600">Use this as a base for your product.</p>
          </div>
        </div>
      </section>

      {/* Site footer */}
      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-gray-500">
        © {new Date().getFullYear()} NNPL. All rights reserved.
      </footer>
    </main>
  );
}
