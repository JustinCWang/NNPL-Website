/*
  Public Stores page ("/stores").
  - Accessible without authentication
  - Shows local game stores and venues
*/
import Link from "next/link";

export default function StoresPage() {
  return (
    <main className="min-h-dvh text-gray-900">
      {/* Simple header for public pages */}
      <header className="py-4 px-6 lg:px-8 border-b">
        <div className="mx-auto w-full max-w-screen-2xl flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold">← Back to Home</Link>
        </div>
      </header>
      
      <section className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold">Local Stores</h1>
          <p className="mt-4 text-gray-700">Find local game stores and venues where you can play Pokémon TCG and participate in tournaments.</p>
          
          <div className="mt-8">
            <p className="text-gray-600">We&apos;re compiling a comprehensive list of shops and play venues. Check back soon for store locations, contact information, and event schedules.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
