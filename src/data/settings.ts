/**
 * Portal settings held in the database, so HQ can change them without a deploy.
 *
 * The image-selection deadline is the one that matters today. The database is
 * the authority — a trigger on `kodak_bookings` rejects image changes after it —
 * and the portal reads it only so a rep sees the lock before trying, rather than
 * hitting a raw database error.
 */
import { supabase } from './supabaseClient';

/** Used when the setting cannot be read; keep in step with the seeded value. */
const FALLBACK_DEADLINE = '2026-10-14T12:00:00+02:00';

export async function fetchImageDeadline(): Promise<Date> {
  const fallback = new Date(FALLBACK_DEADLINE);
  if (!supabase) return fallback;

  const { data, error } = await supabase
    .from('kodak_settings')
    .select('value')
    .eq('key', 'image_selection_deadline')
    .maybeSingle();

  if (error || !data?.value) return fallback;
  const parsed = new Date(data.value as string);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export const isPastDeadline = (deadline: Date | null): boolean =>
  deadline !== null && Date.now() > deadline.getTime();

/**
 * "Wednesday, 14 October 2026 at 12:00 Danish time".
 *
 * The time matters: a midday deadline shown as a bare date reads as end of day,
 * and a rep would lose the afternoon. Always rendered in Danish time, since HQ
 * sets the deadline and reps sit in several time zones.
 */
export function formatDeadline(deadline: Date): string {
  const zone = 'Europe/Copenhagen';
  const date = deadline.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: zone,
  });
  const time = deadline.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: zone,
  });
  return `${date} at ${time} Danish time`;
}

/** Used when the setting cannot be read; keep in step with the seeded value. */
const FALLBACK_BOOKINGS_OPEN = false;

/**
 * Whether new bookings can be submitted. HQ closed Spring '27 booking on
 * 12 October 2026. The database enforces it with a trigger on insert; the
 * portal reads it only to hide "New booking" instead of letting a rep fill in
 * the whole wizard and be refused at the end.
 */
export async function fetchBookingsOpen(): Promise<boolean> {
  if (!supabase) return FALLBACK_BOOKINGS_OPEN;
  const { data, error } = await supabase
    .from('kodak_settings')
    .select('value')
    .eq('key', 'bookings_open')
    .maybeSingle();
  if (error) return FALLBACK_BOOKINGS_OPEN;
  return parseBookingsOpen(data?.value);
}

/** Only an explicit "true" opens booking; anything else, or nothing, is closed. */
export function parseBookingsOpen(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return FALLBACK_BOOKINGS_OPEN;
  return String(value).trim().toLowerCase() === 'true';
}
