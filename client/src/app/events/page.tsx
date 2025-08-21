/*
  Public Events page ("/events").
  - Accessible without authentication
  - Shows upcoming events and tournaments
*/
import Link from "next/link";

export default function EventsPage() {
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
          <h1 className="text-3xl font-semibold">Events</h1>
          <p className="mt-4 text-gray-700">Stay up to date with upcoming tournaments and events in the NNPL community.</p>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
            <p className="text-gray-600">Event listings coming soon. Check back for tournament schedules and community gatherings.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
