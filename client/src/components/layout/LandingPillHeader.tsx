"use client";
/*
  Landing page pill header ("/").
  - Displays the NNPL logo, primary navigation links, and auth actions
  - Renders the same “pill bar” styling used on the marketing landing page
*/

import Link from "next/link";
import Image from "next/image";
import ProfileDropdown from "@/components/layout/ProfileDropdown";

type LandingPillHeaderProps = {
  isAuthed: boolean | null;
};

export default function LandingPillHeader({ isAuthed }: LandingPillHeaderProps) {
  return (
    <header className="py-4 px-6 lg:px-8">
      <div className="mx-auto w-full max-w-screen-xl bg-gradient-to-r from-white via-purple-50 to-pink-50 border-1 border-purple-200 rounded-full shadow-xl px-6 lg:px-8 py-4 grid grid-cols-3 items-center">
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
          <Link href="/events" className="hover:underline">
            Events
          </Link>
          <Link href="/stores" className="hover:underline">
            Local Stores
          </Link>
          <Link href="/guide" className="hover:underline">
            How to Play
          </Link>
          <Link href="/about-us" className="hover:underline">
            About Us
          </Link>
        </nav>

        {/* Right: Auth actions */}
        <div className="justify-self-end">
          {isAuthed ? (
            <ProfileDropdown variant="landing" />
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded-md bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1.5 text-sm hover:from-purple-700 hover:to-pink-700 shadow-md transition-all"
            >
              Log in / Sign up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}


