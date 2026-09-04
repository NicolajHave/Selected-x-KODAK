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
const FALLBACK_DEADLINE = '2026-10-01T23:59:59+02:00';

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

export function formatDeadline(deadline: Date): string {
  return deadline.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
