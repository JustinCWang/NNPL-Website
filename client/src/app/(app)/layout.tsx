"use client";
/*
  Protected route group layout for app pages under /(app).
  - Ensures a valid Supabase auth session exists before rendering children
  - Redirects unauthenticated users to /login
  - Provides a simple top navigation and a sign-out control
*/

import { ReactNode, useEffect, useState, useRef } from "react";
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
          </nav>
          <ProfileDropdown />
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
 * Profile dropdown with avatar and menu options
 */
function ProfileDropdown() {
  const router = useRouter();
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
    router.replace("/");
  }

  // Get initials for avatar
  const initials = getInitials(userName || 'User');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gray-600 text-white text-sm font-medium flex items-center justify-center hover:bg-gray-700 transition-colors"
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
            
            {/* Profile link */}
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


