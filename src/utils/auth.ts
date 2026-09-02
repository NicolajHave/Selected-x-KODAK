/**
 * HQ / Admin access.
 *
 * Access is granted purely on the email address entered: if it appears in the
 * `kodak_admins` table, the portal opens the HQ views. There is no password and
 * no Supabase Auth session, so this is an identity *claim*, not proof — anyone
 * who knows an allowlisted address can enter, and the database is open to the
 * publishable key accordingly. This is a deliberate trade for convenience.
 *
 * To tighten it later, restore the auth-based RLS policies (see the
 * `kodak_admin_without_authentication` migration) and sign users in properly.
 *
 * Admins are managed in the database, so adding one needs no code change:
 *   insert into public.kodak_admins (email) values ('someone@bestseller.com');
 */
import { supabase, supabaseConfigured } from '../data/supabaseClient';

export { supabaseConfigured };

const REMEMBERED_KEY = 'sk-portal.admin-email.v1';

/** Whether this email is on the HQ allowlist. */
export async function isAdminEmail(email: string): Promise<boolean> {
  if (!supabase) return false;
  const normalised = email.trim().toLowerCase();
  if (!normalised) return false;

  const { data, error } = await supabase
    .from('kodak_admins')
    .select('email')
    .ilike('email', normalised)
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

/** Remember the signed-in admin so a page refresh doesn't ask again. */
export function rememberAdmin(email: string): void {
  try {
    window.localStorage.setItem(REMEMBERED_KEY, email.trim().toLowerCase());
  } catch {
    /* storage unavailable — the admin just re-enters their email */
  }
}

export function forgetAdmin(): void {
  try {
    window.localStorage.removeItem(REMEMBERED_KEY);
  } catch {
    /* ignore */
  }
}

/** The email remembered from a previous visit, if any. */
export function rememberedAdmin(): string {
  try {
    return window.localStorage.getItem(REMEMBERED_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Derive a display persona (name + initials) from an email address.
 *
 * The email is the single source of truth for who a rep is — the name is never
 * typed by hand — so one person always appears as exactly one value in filters
 * and exports. Matches the SQL used to normalise existing rows.
 */
export function personaFromEmail(email: string): {
  name: string;
  initials: string;
  email: string;
} {
  const trimmed = email.trim().toLowerCase();
  const local = trimmed.split('@')[0] || 'user';
  const parts = local.split(/[._-]+/).filter(Boolean);
  const name =
    parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || trimmed;
  const initials = (
    parts.length >= 2
      ? parts[0].charAt(0) + parts[1].charAt(0)
      : (parts[0] || 'U').slice(0, 2)
  ).toUpperCase();
  return { name, initials, email: trimmed };
}
