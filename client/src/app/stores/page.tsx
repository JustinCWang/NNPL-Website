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

export default function StoresPage() {
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
    <main className="min-h-dvh text-gray-900">
      {/* Simple header for public pages */}
      <header className="py-4 px-6 lg:px-8 border-b">
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
                className="mt-4 inline-flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          ) : stores.length > 0 ? (
            <div className="mt-12">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {stores.map((store) => (
                  <div key={store.store_id} className="rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow p-6">
                    <h3 className="text-xl font-semibold text-gray-900">{store.name}</h3>
                    <div className="mt-3 text-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{store.location}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">Avg Players:</span>
                        <span className="font-medium text-gray-900">{store.avg_players}</span>
                      </div>
                      {store.has_league && (
                        <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          League Available
                        </div>
                      )}
                    </div>
                  </div>
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
