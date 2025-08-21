/*
  Protected Stores page ("/stores" - authenticated users).
  - Shows local game stores and venues
  - Additional features: favorites, reviews, check-ins, store events
*/
"use client";
import { useState } from "react";

export default function StoresPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'favorites' | 'nearby'>('all');

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Local Stores</h1>
        <p className="mt-2 text-gray-600">Find game stores, save your favorites, and discover events near you.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Stores
          </button>
          <button
            onClick={() => setSelectedTab('favorites')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'favorites'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Favorites
          </button>
          <button
            onClick={() => setSelectedTab('nearby')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'nearby'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Nearby
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'all' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Game Haven</h3>
                <p className="text-gray-600">123 Main St, City, State</p>
                <div className="flex items-center mt-1">
                  <span className="text-yellow-500">★★★★☆</span>
                  <span className="text-gray-500 text-sm ml-1">(4.2) • 12 reviews</span>
                </div>
              </div>
              <button className="text-red-500 hover:text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                View Events
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50">
                Check In
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-50">
                Write Review
              </button>
            </div>
          </div>
          <div className="text-gray-500 text-center py-8">
            More stores coming soon...
          </div>
        </div>
      )}

      {selectedTab === 'favorites' && (
        <div className="text-center py-8">
          <p className="text-gray-500">You haven&apos;t favorited any stores yet.</p>
          <button 
            onClick={() => setSelectedTab('all')}
            className="mt-2 text-blue-600 hover:text-blue-700"
          >
            Browse all stores →
          </button>
        </div>
      )}

      {selectedTab === 'nearby' && (
        <div className="text-center py-8">
          <p className="text-gray-500">Location access needed to show nearby stores.</p>
          <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
            Enable Location
          </button>
        </div>
      )}
    </main>
  );
}
