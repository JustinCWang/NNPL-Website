"use client";
/*
  Landing page pill header ("/").
  - Displays the NNPL logo, primary navigation links, and auth actions
  - Renders the same “pill bar” styling used on the marketing landing page
*/

import Link from "next/link";
import Image from "next/image";
import ProfileDropdown from "@/components/layout/ProfileDropdown";
import ThemeSelector from "@/components/layout/ThemeSelector";

type LandingPillHeaderProps = {
  isAuthed: boolean | null;
};

export default function LandingPillHeader({ isAuthed }: LandingPillHeaderProps) {
  return (
    <header className="relative z-40 py-4 px-6 lg:px-8">
      <div className="theme-card relative mx-auto grid w-full max-w-screen-xl grid-cols-3 items-center rounded-full px-6 py-4 lg:px-8">
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
        <nav className="justify-self-center flex items-center gap-5 text-sm text-theme-foreground">
          <Link href="/events" className="text-theme-foreground hover:text-theme transition-colors">
            Events
          </Link>
          <Link href="/stores" className="text-theme-foreground hover:text-theme transition-colors">
            Local Stores
          </Link>
          <Link href="/guide" className="text-theme-foreground hover:text-theme transition-colors">
            How to Play
          </Link>
          <Link href="/about-us" className="text-theme-foreground hover:text-theme transition-colors">
            About Us
          </Link>
        </nav>

        {/* Right: Auth actions */}
        <div className="flex items-center justify-self-end gap-3">
          <ThemeSelector />
          {isAuthed ? (
            <ProfileDropdown variant="landing" />
          ) : (
            <Link
              href="/login"
              className="theme-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
            >
              Log in / Sign up
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}


