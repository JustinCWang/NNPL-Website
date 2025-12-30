# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Northern Nevada Pokémon League (NNPL) website built with Next.js 15, React 19, and Supabase authentication. The project uses Tailwind CSS v4 and TypeScript with modern app router architecture.

## Development Commands
All commands should be run from the `client/` directory:

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture & Key Files

### Authentication
- **Supabase Integration**: Uses `@supabase/supabase-js` for authentication and database
- **Client Singleton**: `src/lib/supabaseClient.ts` provides a singleton Supabase client
- **Environment Variables**: Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

### Application Structure
- **App Router**: Uses Next.js 15 app directory structure
- **Layout Hierarchy**: 
  - Root layout: `src/app/layout.tsx` (global fonts, metadata)
  - App layout: `src/app/(app)/layout.tsx` (authenticated routes)
- **Route Groups**: `(app)` group contains authenticated pages (events, home, profile)
- **Auth Pages**: login and signup pages outside the (app) group

### Styling & UI
- **Tailwind CSS v4**: Configured via PostCSS plugin in `postcss.config.mjs`
- **Fonts**: Uses Shantell_Sans and Geist Mono from Google Fonts
- **Global Styles**: `src/app/globals.css` imports Tailwind layers

### Configuration
- **TypeScript**: Strict mode enabled with path mapping (`@/*` → `./src/*`)
- **ESLint**: Extends Next.js TypeScript and Core Web Vitals rules
- **Next.js**: Standard configuration with minimal custom settings

## Key Patterns
- Singleton pattern for Supabase client to avoid multiple instances
- Comprehensive TypeScript comments explaining file purposes with detailed header comment
- Environment variable validation with helpful error messages
- Route grouping to separate authenticated and public pages