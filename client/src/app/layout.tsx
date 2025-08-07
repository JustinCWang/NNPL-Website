/*
  Root application layout for the Next.js App Router.
  - Sets global fonts and metadata
  - Applies global CSS and font CSS variables
  - Wraps every route with the base <html> and <body> structure
*/

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Initialize Google fonts and expose them as CSS variables
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Default metadata for the application (can be overridden per route)
export const metadata: Metadata = {
  title: "NNPL",
  description: "Northern Nevada Pokémon League",
};

/**
 * Root layout component for all routes.
 * Applies global fonts and styles and provides the base HTML scaffold.
 * @param props.children React subtree for the active route segment
 * @returns Base HTML document with global styling
 */
// Root layout component that wraps all route segments
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Base document markup
    <html lang="en">
      <body
        // Apply font variables and smoothing to all pages
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Render the active route */}
        {children}
      </body>
    </html>
  );
}
