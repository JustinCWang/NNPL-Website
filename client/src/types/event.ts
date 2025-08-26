/*
  TypeScript types for Event entity and related operations.
  Based on the Events table schema: event_id, created_at, date, name, is_weekly, is_cup, is_challenge, is_prerelease, store_id, created_by
*/

export interface Event {
  event_id: string;
  created_at: string;
  date: string;
  name: string;
  is_weekly: boolean;
  is_cup: boolean;
  is_challenge: boolean;
  is_prerelease: boolean;
  store_id: string;
  created_by: string;
  // Joined store information
  store?: {
    name: string;
    location: string;
  };
  // Joined user information for creator
  creator?: {
    username: string;
    email: string;
  };
}

export interface CreateEventData {
  date: string;
  name: string;
  is_weekly: boolean;
  is_cup: boolean;
  is_challenge: boolean;
  is_prerelease: boolean;
  store_id: string;
  created_by: string;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  event_id: string;
}

export interface EventFormData {
  date: string;
  name: string;
  is_weekly: boolean;
  is_cup: boolean;
  is_challenge: boolean;
  is_prerelease: boolean;
  store_id: string;
  created_by: string;
}

// Event type categories for easier handling
export type EventType = 'weekly' | 'cup' | 'challenge' | 'prerelease' | 'other';

export interface EventTypeOption {
  id: EventType;
  label: string;
  description: string;
}
