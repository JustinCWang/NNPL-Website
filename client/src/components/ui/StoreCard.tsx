"use client";
/*
  StoreCard component for displaying a store in the stores page.
  - Displays the store name, location, average players, and league availability
  - Displays a button to visit the store's website
  - Displays a button to join the store's discord
  - Displays a button to view the store's events
*/

import { Store } from '@/types/store';
import Link from 'next/link';

interface StoreCardProps {
  store: Store;
  variant?: 'default' | 'landing';
  basePath?: string; // New prop to determine routing path
}

export default function StoreCard({ store, variant = 'default', basePath = '/events' }: StoreCardProps) {
  const isLanding = variant === 'landing';
  
  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (store.website) {
      const url = store.website.startsWith('http') ? store.website : `https://${store.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDiscordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (store.discord) {
      window.open(store.discord, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`rounded-lg border ${isLanding ? 'bg-white/60' : 'bg-white'} shadow-sm hover:shadow-md transition-shadow p-6 h-60 flex flex-col`}>
      {/* Store Name - Truncated */}
      <h3 className={`font-semibold ${isLanding ? 'text-lg' : 'text-xl text-gray-900'} truncate`} title={store.name}>
        {store.name}
      </h3>
      
      <div className={`mt-3 flex-1 flex flex-col ${isLanding ? 'text-sm text-gray-700' : 'text-gray-700'}`}>
        {/* Location - Truncated */}
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate" title={store.location}>{store.location}</span>
        </div>
        
        {/* Average Players */}
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <span className={`${isLanding ? 'text-sm' : ''} text-gray-600`}>Avg Players:</span>
          <span className={`font-medium ${isLanding ? '' : 'text-gray-900'}`}>{store.avg_players}</span>
        </div>
        
        {/* League Badge */}
        {store.has_league && (
          <div className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 mb-3">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            League Available
          </div>
        )}
        
        {/* Spacer to push buttons to bottom */}
        <div className="flex-1"></div>
        
        {/* All Buttons Row */}
        <div className="flex items-center gap-2 mt-auto">
          {/* Events Button */}
          <Link
            href={`${basePath}?store=${store.store_id}`}
            className={`inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors justify-center ${
              !store.website && !store.discord ? 'flex-1' : 'flex-1'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Events</span>
          </Link>
          
          {/* Website Button */}
          {store.website && (
            <button
              onClick={handleWebsiteClick}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-md hover:bg-blue-50"
              title="Visit website"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </button>
          )}
          
          {/* Discord Button */}
          {store.discord && (
            <button
              onClick={handleDiscordClick}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors p-2 rounded-md hover:bg-indigo-50"
              title="Join Discord"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.019 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
