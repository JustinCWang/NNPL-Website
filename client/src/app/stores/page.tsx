"use client";
/*
  Public Stores page ("/stores").
  - Accessible without authentication
  - Shows local game stores and venues with real data from Supabase
*/
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Store } from "@/types/store";
import StoreCard from "@/components/ui/StoreCard";
import { useTheme } from '@/context/ThemeContext';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedTheme } = useTheme();

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
    <main className="min-h-dvh text-gray-900">
      {/* Simple header for public pages */}
      <header className="py-4 px-6 lg:px-8 border-b" style={{ backgroundColor: selectedTheme.accentColor }}>
        <div className="mx-auto w-full max-w-screen-2xl flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold">← Back to Home</Link>
        </div>
      </header>
      
      <section className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-semibold text-center">Local Stores</h1>
          <p className="mt-4 text-gray-700 text-center max-w-3xl mx-auto">
            Find local game stores and venues where you can play Pokémon TCG and participate in tournaments.
          </p>
          
          {loading ? (
            <div className="mt-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading stores...</p>
            </div>
          ) : error ? (
            <div className="mt-12 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 inline-flex items-center rounded-md bg-black px-4 py-2 text-sm hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          ) : stores.length > 0 ? (
            <div className="mt-12">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {stores.map((store) => (
                  <StoreCard key={store.store_id} store={store} basePath="/events" />
                ))}
              </div>
              
              <div className="mt-12 text-center">
                <p className="text-gray-600 mb-4">
                  {stores.length} store{stores.length !== 1 ? 's' : ''} found in Northern Nevada
                </p>
                <p className="text-sm text-gray-500">
                  Stores are ranked by average number of players. Higher numbers indicate more active communities.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-12 text-center">
              <p className="text-gray-600">No stores found in the database.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
