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
/** 1 or more, no leading zero, nothing else. */
const WHOLE_NUMBER_RE = /^[1-9]\d*$/;

export function validatePartner(b: BookingSubmission): Errors {
  const e: Errors = {};
  const p = b.partnerInfo;
  if (!p.partnerName.trim()) e.partnerName = 'This field is needed before you can submit.';
  if (!p.market.trim()) e.market = 'This field is needed before you can submit.';
  if (p.market === MARKET_OTHER && !p.marketOther.trim()) {
    e.marketOther = 'Enter the market name.';
  }
  // salesRepName is derived from salesRepEmail, so it needs no separate check.
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
      const qty = String((d?.requestedQuantity ?? d?.quantity) ?? '').trim();
      if (!qty) {
        e[`${type}.quantity`] = 'Quantity is required for this activation.';
      } else if (!WHOLE_NUMBER_RE.test(qty)) {
        // Free text here reaches production as-is: "1 + 2 racks" once had to be
        // untangled by hand. Extras belong in the notes field.
        e[`${type}.quantity`] = 'Enter a whole number, e.g. 1. Put anything extra in the notes.';
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
