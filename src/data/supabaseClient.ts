/**
 * Supabase client.
 *
 * Configuration comes from build-time env vars (see .env.example). The
 * publishable key is deliberately public — it is safe to ship because the
 * `kodak_bookings` table's row-level security only lets it INSERT. Reading,
 * updating and deleting bookings requires a signed-in HQ user whose email is on
 * the `kodak_admins` allowlist, so partner data cannot be pulled with this key.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False when the app was built without Supabase credentials. */
export const supabaseConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, key as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

/** Narrow the nullable client, failing loudly if the build was misconfigured. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
  return supabase;
}
