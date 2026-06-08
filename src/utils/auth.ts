/**
 * Lightweight admin access gate.
 *
 * The Sales Rep experience is open (no sign-in). Only the HQ / Admin views are
 * gated: a user must enter an authorised email AND the shared admin password.
 *
 * This is an access gate for an internal tool, not bank-grade security: because
 * the app has no backend, the password is compared in the browser. It is read
 * from the `VITE_ADMIN_PASSWORD` build-time env var (set in Vercel / .env.local)
 * so it is never committed to the repository. Anyone with the deployed bundle
 * can in principle read it, so do not reuse a sensitive password here. For real
 * server-side auth, move this check behind an API (e.g. Supabase).
 */

/** Emails allowed to access the HQ / Admin views. */
const ADMIN_EMAILS = ['nicolaj.ostergaard@bestseller.com'];

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/** True when an admin password has been configured at build time. */
export function adminPasswordConfigured(): boolean {
  return Boolean(import.meta.env.VITE_ADMIN_PASSWORD);
}

/** Validate an HQ / Admin sign-in attempt. */
export function verifyAdmin(email: string, password: string): boolean {
  const expected = import.meta.env.VITE_ADMIN_PASSWORD;
  if (!expected) return false;
  return isAdminEmail(email) && password === expected;
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
