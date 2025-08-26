/*
  Protected Stores page ("/stores" - authenticated users).
  - Shows local game stores and venues with real data from Supabase
  - Additional features: favorites, reviews, check-ins, store events
*/
"use client";
import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Store } from "@/types/store";
import StoreCard from "@/components/ui/StoreCard";

export default function StoresPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'favorites' | 'nearby'>('all');
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStores() {
      const supabase = getSupabaseClient();
      
      try {
        setLoading(true);
        setError(null);
        
        const { data: storesData, error: storesError } = await supabase
          .from('Stores')
          .select('*')
          .order('avg_players', { ascending: false });

        if (storesError) {
          console.error('Error fetching stores:', storesError);
          setError('Failed to load stores. Please try again later.');
        } else {
          setStores(storesData || []);
        }
      } catch (error) {
        console.error('Error fetching stores:', error);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchStores();
  }, []);

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
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading stores...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : stores.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => (
                <div key={store.store_id} className="relative">
                  <StoreCard store={store} basePath="/my-events" />
                  {/* Favorite button overlay */}
                  <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white/80 rounded-full p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No stores found in the database.</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for store listings.</p>
            </div>
          )}
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
