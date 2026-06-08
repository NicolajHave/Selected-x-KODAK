/**
 * Booking validation.
 *
 * Each step validator returns a map of field-key → message. An empty map means
 * the step is valid. `validateForSubmit` aggregates everything required before a
 * booking may leave draft state.
 */
import type { BookingSubmission } from '../types';
import { ACTIVATION_BY_TYPE, MARKET_OTHER } from '../data/catalog';

export type Errors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePartner(b: BookingSubmission): Errors {
  const e: Errors = {};
  const p = b.partnerInfo;
  if (!p.partnerName.trim()) e.partnerName = 'This field is needed before you can submit.';
  if (!p.market.trim()) e.market = 'This field is needed before you can submit.';
  if (p.market === MARKET_OTHER && !p.marketOther.trim()) {
    e.marketOther = 'Enter the market name.';
  }
  if (!p.salesRepName.trim()) e.salesRepName = 'This field is needed before you can submit.';
  if (!p.salesRepEmail.trim()) {
    e.salesRepEmail = 'This field is needed before you can submit.';
  } else if (!EMAIL_RE.test(p.salesRepEmail.trim())) {
    e.salesRepEmail = 'Enter a valid email address.';
  }
  if (p.partnerContactEmail.trim() && !EMAIL_RE.test(p.partnerContactEmail.trim())) {
    e.partnerContactEmail = 'Enter a valid email address.';
  }
  return e;
}

export function validateSelection(b: BookingSubmission): Errors {
  const e: Errors = {};
  if (b.selectedActivations.length === 0) {
    e.selectedActivations = 'Select at least one activation option.';
  }
  return e;
}

/** Validate the per-activation detail blocks (quantity rules). */
export function validateDetails(b: BookingSubmission): Errors {
  const e: Errors = {};
  for (const type of b.selectedActivations) {
    const def = ACTIVATION_BY_TYPE[type];
    const d = b.activationDetails[type] as unknown as Record<string, unknown> | undefined;
    if (def.needsQuantity) {
      const qty = (d?.requestedQuantity ?? d?.quantity) as string | undefined;
      if (!qty || !String(qty).trim()) {
        e[`${type}.quantity`] = 'Quantity is required for this activation.';
      }
    }
  }
  return e;
}

/** Everything that must hold before a booking can be submitted. */
export function validateForSubmit(b: BookingSubmission): Errors {
  return {
    ...validatePartner(b),
    ...validateSelection(b),
    ...validateDetails(b),
  };
}

export function hasErrors(e: Errors): boolean {
  return Object.keys(e).length > 0;
}
