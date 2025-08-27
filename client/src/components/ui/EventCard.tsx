"use client";

import { Event } from '@/types/event';

interface EventCardProps {
  event: Event;
  variant?: 'public' | 'authenticated';
  showActions?: boolean;
}

export default function EventCard({ event, variant = 'public', showActions = true }: EventCardProps) {
  // Helper function to get event type label and color
  const getEventTypeInfo = (event: Event) => {
    if (event.is_prerelease) return { label: 'Prerelease', color: 'bg-purple-100 text-purple-800' };
    if (event.is_cup) return { label: 'Cup', color: 'bg-blue-100 text-blue-800' };
    if (event.is_challenge) return { label: 'Challenge', color: 'bg-green-100 text-green-800' };
    if (event.is_weekly) return { label: 'Weekly', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Event', color: 'bg-gray-100 text-gray-800' };
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    // Handle both YYYY-MM-DD and ISO string formats
    let date: Date;
    
    if (dateString.includes('T')) {
      // Full ISO string
      date = new Date(dateString);
    } else {
      // YYYY-MM-DD format - add time to ensure proper parsing
      date = new Date(dateString + 'T00:00:00');
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const eventType = getEventTypeInfo(event);

  return (
    <div className="rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow p-6 h-64 flex flex-col">
      {/* Event Name and Favorite Heart Row */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-2" title={event.name}>
          {event.name}
        </h3>
        {variant === 'authenticated' && showActions && (
          <button className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </div>

      {/* Header with Event Type Badge and Date */}
      <div className="flex items-start justify-between mb-3">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${eventType.color}`}>
          {eventType.label}
        </span>
        <div className="text-sm text-gray-500 text-right">
          {formatDate(event.date)}
        </div>
      </div>
      
              {/* Store Information - Truncated */}
        <div className="space-y-2 text-sm text-gray-700 flex-1">
          {event.store ? (
            <>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="font-medium truncate" title={event.store.name}>{event.store.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate" title={event.store.location}>{event.store.location}</span>
              </div>
            </>
          ) : (
            <div className="text-gray-500 italic">Store information not available</div>
          )}
          
          {/* Cost and Prizing Information */}
          {(event.cost || event.min_prizing || event.max_prizing) && (
            <div className="pt-2 border-t border-gray-200">
              {event.cost && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className="font-medium text-gray-900">
                    {event.cost > 0 ? `$${event.cost.toFixed(2)}` : 'Free'}
                  </span>
                </div>
              )}
              {(event.min_prizing || event.max_prizing) && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 truncate" title={
                    event.min_prizing && event.max_prizing ? 
                      `${event.min_prizing} - ${event.max_prizing}` :
                      event.min_prizing ? `Min: ${event.min_prizing}` :
                      event.max_prizing ? `Max: ${event.max_prizing}` :
                      'Prizing info available'
                  }>
                    {event.min_prizing && event.max_prizing ? 
                      `${event.min_prizing} - ${event.max_prizing}` :
                      event.min_prizing ? `Min: ${event.min_prizing}` :
                      event.max_prizing ? `Max: ${event.max_prizing}` :
                      'Prizing info available'
                    }
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

      {/* Actions Row - Only show for authenticated variant without buttons, public variant has no actions */}
      {variant === 'authenticated' && showActions && (
        // Authenticated events page - No action buttons needed (heart is in corner)
        <div className="mt-auto"></div>
      )}
    </div>
  );
}
