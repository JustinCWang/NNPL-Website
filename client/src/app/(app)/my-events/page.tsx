/*
  Protected Events page ("/events" - authenticated users).
  - Shows upcoming events and tournaments
  - Additional features: event registration, personal calendar, notifications
*/
"use client";
import { useState } from "react";

export default function EventsPage() {
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'registered' | 'history'>('upcoming');

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Events</h1>
        <p className="mt-2 text-gray-600">Manage your tournament participation and stay updated on upcoming events.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('upcoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'upcoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setSelectedTab('registered')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'registered'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Registrations
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Event History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'upcoming' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Weekly Tournament</h3>
            <p className="text-gray-600 mb-4">Every Saturday at 2:00 PM - Standard Format</p>
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                Register
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50">
                Add to Calendar
              </button>
            </div>
          </div>
          <div className="text-gray-500 text-center py-8">
            More events coming soon...
          </div>
        </div>
      )}

      {selectedTab === 'registered' && (
        <div className="text-center py-8">
          <p className="text-gray-500">You haven&apos;t registered for any events yet.</p>
          <button 
            onClick={() => setSelectedTab('upcoming')}
            className="mt-2 text-blue-600 hover:text-blue-700"
          >
            Browse upcoming events →
          </button>
        </div>
      )}

      {selectedTab === 'history' && (
        <div className="text-center py-8">
          <p className="text-gray-500">No event history yet. Participate in tournaments to see your results here.</p>
        </div>
      )}
    </main>
  );
}
