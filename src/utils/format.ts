/** Small formatting helpers shared across the portal. */

/** Format an ISO timestamp as a YYYY-MM-DD date. Empty input → em dash. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

/** Today's date as YYYY-MM-DD (local). Used for export filenames. */
export function todayStamp(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Booleans → readable Yes / No / em dash. */
export function yesNo(v: string | boolean | null | undefined): string {
  if (v === true || v === 'yes') return 'Yes';
  if (v === false || v === 'no') return 'No';
  return '—';
}

/** Fall back to an em dash for empty values. */
export function orDash(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  const s = String(v).trim();
  return s.length ? s : '—';
}
