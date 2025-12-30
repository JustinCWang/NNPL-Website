/*
  Root application layout for the Next.js App Router.
  - Sets global fonts and metadata
  - Applies global CSS and font CSS variables
  - Wraps every route with the base <html> and <body> structure
*/

import type { Metadata } from "next";
import { Shantell_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

// Initialize Google fonts and expose them as CSS variables
const shantellSans = Shantell_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
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
        // Apply font directly and smoothing
        className={`${shantellSans.className} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {/* Render the active route */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
