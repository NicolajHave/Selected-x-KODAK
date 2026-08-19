/**
 * HQ / Admin authentication.
 *
 * Sales reps are not signed in — they only ever submit bookings, which the
 * database allows anonymously (INSERT-only). Reading and managing bookings
 * requires a real Supabase Auth session whose email is on the `kodak_admins`
 * allowlist; that check runs in the database, not in the browser, so it cannot
 * be bypassed by editing client code.
 */
import { supabase, supabaseConfigured } from '../data/supabaseClient';

export { supabaseConfigured };

export interface AdminSession {
  email: string;
}

/** Sign in an HQ user. Returns an error message, or null on success. */
export async function signInAdmin(
  email: string,
  password: string,
): Promise<string | null> {
  if (!supabase) return 'The portal is not connected to its database yet.';

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) return 'That email or password is not correct.';

  const authorised = await isAdmin();
  if (!authorised) {
    await supabase.auth.signOut();
    return 'That account does not have HQ access.';
  }
  return data.user ? null : 'Sign-in failed. Please try again.';
}

/** Whether the signed-in user is on the HQ allowlist (checked server-side). */
export async function isAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('kodak_is_admin');
  if (error) return false;
  return data === true;
}

/** The current admin session, or null when nobody is signed in. */
export async function currentAdmin(): Promise<AdminSession | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user?.email;
  if (!email) return null;
  return (await isAdmin()) ? { email } : null;
}

export async function signOutAdmin(): Promise<void> {
  await supabase?.auth.signOut();
}

/** Derive a display persona (name + initials) from an email address. */
export function personaFromEmail(email: string): {
  name: string;
  initials: string;
  email: string;
} {
  const trimmed = email.trim();
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
