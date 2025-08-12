"use client";
/*
  Protected route group layout for app pages under /(app).
  - Ensures a valid Supabase auth session exists before rendering children
  - Redirects unauthenticated users to /login
  - Provides a simple top navigation and a sign-out control
*/

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
    <div className="min-h-dvh text-gray-900 flex flex-col">
      <header className="border-b">
        <div className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          <nav className="flex items-center gap-5 text-sm">
            {/* Dashboard first */}
            <Link href="/home" className={pathname === "/home" ? "font-semibold" : "hover:underline"}>
              Home
            </Link>
            {/* Shared public links */}
            <Link href="/events" className={pathname === "/events" ? "font-semibold" : "hover:underline"}>
              Events
            </Link>
            <Link href="/stores" className={pathname === "/stores" ? "font-semibold" : "hover:underline"}>
              Local Stores
            </Link>
            <Link href="/guide" className={pathname === "/guide" ? "font-semibold" : "hover:underline"}>
              How to Play
            </Link>
            {/* Dashboard-only extras */}
            <Link href="/profile" className={pathname === "/profile" ? "font-semibold" : "hover:underline"}>
              Profile
            </Link>
          </nav>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-8">{children}</main>
      <footer className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-12 text-sm text-gray-700 text-center">
        © {new Date().getFullYear()} NNPL. All rights reserved.
      </footer>
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


