/*
  Date utility functions for consistent date handling across the application.
  Supports both date-only filter inputs and event timestamps with explicit timezones.
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
 * Common timezone options for event scheduling.
 */
export const DEFAULT_EVENT_TIMEZONE = 'America/Los_Angeles';

export const EVENT_TIMEZONE_OPTIONS = [
  { value: 'America/Los_Angeles', label: 'Pacific Time', shortLabel: 'PT' },
  { value: 'America/Denver', label: 'Mountain Time', shortLabel: 'MT' },
  { value: 'America/Phoenix', label: 'Arizona Time', shortLabel: 'AZ' },
  { value: 'America/Chicago', label: 'Central Time', shortLabel: 'CT' },
  { value: 'America/New_York', label: 'Eastern Time', shortLabel: 'ET' },
  { value: 'America/Anchorage', label: 'Alaska Time', shortLabel: 'AKT' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time', shortLabel: 'HT' },
  { value: 'UTC', label: 'UTC', shortLabel: 'UTC' },
] as const;

/**
 * Parses an event start timestamp into a Date object.
 */
export function parseStartAt(startAt: string): Date {
  const parsed = new Date(startAt);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getFormatter(timeZone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    ...options,
  });
}

function getZonedParts(date: Date, timeZone: string) {
  const formatter = getFormatter(timeZone, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function parseDateTimeInput(value: string) {
  const [datePart, timePart = '00:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  return {
    year,
    month,
    day,
    hour,
    minute,
  };
}

function buildDateTimeInput(parts: { year: number; month: number; day: number; hour: number; minute: number }) {
  const year = String(parts.year).padStart(4, '0');
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  const hour = String(parts.hour).padStart(2, '0');
  const minute = String(parts.minute).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  const utcTime = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return utcTime - date.getTime();
}

export function formatTimeZoneLabel(timeZone: string): string {
  const option = EVENT_TIMEZONE_OPTIONS.find((entry) => entry.value === timeZone);
  return option ? `${option.label} (${option.shortLabel})` : timeZone;
}

export function getEventLocalDate(startAt: string, timeZone: string = DEFAULT_EVENT_TIMEZONE): string {
  const parts = getZonedParts(parseStartAt(startAt), timeZone);
  const year = String(parts.year).padStart(4, '0');
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats an event timestamp for date-only display in the user's local timezone.
 */
export function formatDisplayDate(startAt: string, timeZone: string = DEFAULT_EVENT_TIMEZONE): string {
  const date = parseStartAt(startAt);
  return date.toLocaleDateString('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formats an event timestamp for time-only display in the user's local timezone.
 */
export function formatDisplayTime(startAt: string, timeZone: string = DEFAULT_EVENT_TIMEZONE): string {
  const date = parseStartAt(startAt);
  return date.toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

export function formatMonthYear(startAt: string, timeZone: string = DEFAULT_EVENT_TIMEZONE): string {
  return parseStartAt(startAt).toLocaleDateString('en-US', {
    timeZone,
    year: 'numeric',
    month: 'long',
  });
}

/**
 * Formats an event timestamp into a value accepted by datetime-local inputs.
 */
export function formatDateTimeForInput(value: string | Date, timeZone: string = DEFAULT_EVENT_TIMEZONE): string {
  const date = value instanceof Date ? value : parseStartAt(value);
  const parts = getZonedParts(date, timeZone);

  return buildDateTimeInput({
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  });
}

/**
 * Converts a datetime-local input value into an ISO timestamp for storage.
 */
export function formatStartAtForStorage(value: string, timeZone: string = DEFAULT_EVENT_TIMEZONE): string {
  const { year, month, day, hour, minute } = parseDateTimeInput(value);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);

  let actual = new Date(utcGuess.getTime() - offset);
  const adjustedOffset = getTimeZoneOffsetMs(actual, timeZone);
  if (adjustedOffset !== offset) {
    actual = new Date(utcGuess.getTime() - adjustedOffset);
  }

  return actual.toISOString();
}

/**
 * Checks if a datetime-local form value is in the past for a specific event timezone.
 */
export function isEventInputPast(value: string, timeZone: string = DEFAULT_EVENT_TIMEZONE): boolean {
  return parseStartAt(formatStartAtForStorage(value, timeZone)).getTime() < Date.now();
}

/**
 * Converts a Date object to a date string (YYYY-MM-DD) for date-only inputs.
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if an event start timestamp is in the past.
 */
export function isStartAtPast(startAt: string): boolean {
  return parseStartAt(startAt).getTime() < Date.now();
}

/**
 * Adds days to an event timestamp and returns a new ISO timestamp.
 */
export function addDaysToStartAt(startAt: string, days: number, timeZone: string = DEFAULT_EVENT_TIMEZONE): string {
  const localValue = formatDateTimeForInput(startAt, timeZone);
  const { year, month, day, hour, minute } = parseDateTimeInput(localValue);
  const shifted = new Date(Date.UTC(year, month - 1, day, hour, minute));
  shifted.setUTCDate(shifted.getUTCDate() + days);

  const nextLocalValue = buildDateTimeInput({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  });

  return formatStartAtForStorage(nextLocalValue, timeZone);
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
