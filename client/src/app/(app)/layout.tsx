"use client";
/*
  Protected route group layout for app pages under /(app).
  - Ensures a valid Supabase auth session exists before rendering children
  - Redirects unauthenticated users to /login
  - Provides a simple top navigation and a sign-out control
*/

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

/**
 * Wraps protected pages and blocks access when not authenticated.
 * Displays app navigation and a sign-out button.
 */
type ProtectedLayoutProps = { children: ReactNode };
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();

    let isMounted = true;

    async function checkAuth() {
      try {
        // Prefer session, it contains access token and user info if hydrated
        const { data: sessionData } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (sessionData.session) {
          setIsCheckingAuth(false);
          return;
        }
        // Fallback: user call can succeed shortly before session is cached client-side
        const { data: userData } = await supabase.auth.getUser();
        if (!isMounted) return;
        if (userData.user) {
          setIsCheckingAuth(false);
          return;
        }
        router.replace("/login");
      } catch {
        router.replace("/login");
      }
    }

    checkAuth();

    // Keep layout in sync with session mutations (sign in/out, refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      } else {
        setIsCheckingAuth(false);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  if (isCheckingAuth) {
    return (
      <main className="min-h-dvh grid place-items-center">
        {/* Lightweight splash while verifying auth */}
        <div className="text-sm text-gray-600">Checking authentication…</div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh text-gray-900">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          {/* Minimal app navigation across protected pages */}
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/home" className={pathname === "/home" ? "font-semibold" : "hover:underline"}>
              Home
            </Link>
            <Link href="/events" className={pathname === "/events" ? "font-semibold" : "hover:underline"}>
              Events
            </Link>
            <Link href="/profile" className={pathname === "/profile" ? "font-semibold" : "hover:underline"}>
              Profile
            </Link>
          </nav>
          <SignOutButton />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}

/**
 * Signs the user out and returns to the public landing page.
 */
function SignOutButton() {
  const router = useRouter();
  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/");
  }
  return (
    <button
      onClick={handleSignOut}
      className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
      aria-label="Sign out"
    >
      Sign out
    </button>
  );
}


