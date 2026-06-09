/** Derived, display-friendly summaries of a booking's activations. */
import type { ActivationType, BookingSubmission } from '../types';
import { ACTIVATION_BY_TYPE } from '../data/catalog';

/** Short activation names, e.g. ["Hero pop-up setup / zigzag wall", …]. */
export function activationNames(b: BookingSubmission): string[] {
  return b.selectedActivations.map((t) => ACTIVATION_BY_TYPE[t].name);
}

/** Compact comma list of activation case codes, e.g. "01, 03". */
export function activationCodes(b: BookingSubmission): string {
  return b.selectedActivations.map((t) => ACTIVATION_BY_TYPE[t].code).join(', ');
}

/** The cost owners in play across the booking, derived from the catalog. */
export function costOwners(b: BookingSubmission): string {
  const owners = new Set<string>();
  for (const t of b.selectedActivations) {
    owners.add(ACTIVATION_BY_TYPE[t].costOwner);
  }
  return [...owners].filter(Boolean).join(' · ');
}

/** The headline delivery window (hero pop-up drives this). */
export function deliveryWindow(b: BookingSubmission): string {
  return b.activationDetails.hero_popup?.preferredDeliveryWindow || '';
}

/** Total requested quantity across activations that carry a quantity. */
export function totalQuantity(b: BookingSubmission): string {
  let sum = 0;
  let any = false;
  const qtyFields: ActivationType[] = ['hero_popup', 'campaign_element'];
  for (const t of qtyFields) {
    if (!b.selectedActivations.includes(t)) continue;
    const d = b.activationDetails[t] as { requestedQuantity?: string } | undefined;
    const raw = d?.requestedQuantity;
    const n = parseInt(String(raw ?? ''), 10);
    if (!Number.isNaN(n)) {
      sum += n;
      any = true;
    }
  }
  return any ? String(sum) : '';
}

/** Human label for a single activation's quantity, used in the review list. */
export function quantityLabel(b: BookingSubmission, t: ActivationType): string {
  const d = b.activationDetails[t] as { requestedQuantity?: string } | undefined;
  const qty = d?.requestedQuantity;
  const parts: string[] = [];
  if (qty) parts.push(`${qty} ×`);
  if (t === 'campaign_element' && qty) parts.push('Mini zigzag');
  return parts.join(' ');
}
