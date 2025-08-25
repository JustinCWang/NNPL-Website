/*
  Date utility functions for consistent date handling across the application.
  Fixes timezone issues when working with date inputs and displays.
*/

/**
 * Converts a date string (YYYY-MM-DD) to a Date object in local timezone
 * This prevents the off-by-one error that occurs when dates are interpreted as UTC
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Split the date string into components
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create date in local timezone (month is 0-indexed in JavaScript)
  return new Date(year, month - 1, day);
}

/**
 * Formats a date string for display, ensuring it shows the correct local date
 */
export function formatDisplayDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Converts a Date object to a date string (YYYY-MM-DD) for form inputs
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a date string represents a past date (before today)
 */
export function isDatePast(dateString: string): boolean {
  const eventDate = parseLocalDate(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

/**
 * Adds days to a date string and returns a new date string
 */
export function addDaysToDate(dateString: string, days: number): string {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + days);
  return formatDateForInput(date);
}

/**
 * Gets the start of a week (Sunday) for a given date
 */
export function getStartOfWeek(dateString: string): string {
  const date = parseLocalDate(dateString);
  const dayOfWeek = date.getDay();
  const daysToSubtract = dayOfWeek;
  date.setDate(date.getDate() - daysToSubtract);
  return formatDateForInput(date);
}

/**
 * Gets the end of a week (Saturday) for a given date
 */
export function getEndOfWeek(dateString: string): string {
  const date = parseLocalDate(dateString);
  const dayOfWeek = date.getDay();
  const daysToAdd = 6 - dayOfWeek;
  date.setDate(date.getDate() + daysToAdd);
  return formatDateForInput(date);
}

/**
 * Gets the start of a month for a given date
 */
export function getStartOfMonth(dateString: string): string {
  const date = parseLocalDate(dateString);
  date.setDate(1);
  return formatDateForInput(date);
}

/**
 * Gets the end of a month for a given date
 */
export function getEndOfMonth(dateString: string): string {
  const date = parseLocalDate(dateString);
  date.setMonth(date.getMonth() + 1, 0);
  return formatDateForInput(date);
}
