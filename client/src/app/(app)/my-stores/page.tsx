"use client";
/*
  Protected Stores page ("/my-stores").
  - Shows local game stores and venues with real data from Supabase
  - Additional features: favorites, reviews, check-ins, store events
*/

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
        <h1 className="text-3xl font-semibold text-theme-foreground">Local Stores</h1>
        <p className="mt-2 text-theme-muted">Find game stores, save your favorites, and discover events near you.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b mb-6" style={{ borderColor: "var(--theme-border-soft)" }}>
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('all')}
            className={`py-2 px-1 font-medium text-sm ${selectedTab === 'all' ? 'theme-tab-active' : 'theme-tab'}`}
          >
            All Stores
          </button>
          <button
            onClick={() => setSelectedTab('favorites')}
            className={`py-2 px-1 font-medium text-sm ${selectedTab === 'favorites' ? 'theme-tab-active' : 'theme-tab'}`}
          >
            My Favorites
          </button>
          <button
            onClick={() => setSelectedTab('nearby')}
            className={`py-2 px-1 font-medium text-sm ${selectedTab === 'nearby' ? 'theme-tab-active' : 'theme-tab'}`}
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
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-theme" style={{ borderTopColor: "transparent" }}></div>
              <p className="mt-2 text-theme-muted">Loading stores...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="theme-button mt-4 px-4 py-2 rounded-md text-sm"
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
                  <button className="theme-panel absolute top-4 right-4 rounded-full p-1 text-theme-muted transition-colors hover:text-red-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-theme-muted">No stores found in the database.</p>
              <p className="text-sm text-theme-muted mt-1">Check back later for store listings.</p>
            </div>
          )}
        </div>
      )}

      {selectedTab === 'favorites' && (
        <div className="text-center py-8">
          <p className="text-theme-muted">You haven&apos;t favorited any stores yet.</p>
          <button 
            onClick={() => setSelectedTab('all')}
            className="theme-button-ghost mt-2 rounded-md px-2 py-1"
          >
            Browse all stores →
          </button>
        </div>
      )}

      {selectedTab === 'nearby' && (
        <div className="text-center py-8">
          <p className="text-theme-muted">Location access needed to show nearby stores.</p>
          <button className="theme-button mt-2 px-4 py-2 rounded-md text-sm">
            Enable Location
          </button>
        </div>
      )}
    </main>
  );
}
