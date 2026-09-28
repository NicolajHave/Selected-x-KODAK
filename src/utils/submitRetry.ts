/**
 * Getting a booking into the database under an id nobody else holds.
 *
 * Submission ids are random, so two bookings can in rare cases draw the same
 * one. The database refuses the second, and the question is then whether that
 * refusal means "already saved" or "someone else's". Getting that wrong is the
 * worst failure this portal can have: a rep sees a confirmation for a booking
 * HQ never received.
 */
import type { BookingSubmission } from '../types';

/** Thrown when another booking already holds this submission id. */
export class SubmissionIdTakenError extends Error {
  constructor(submissionId: string) {
    super(`Submission id ${submissionId} is already used by another booking.`);
    this.name = 'SubmissionIdTakenError';
  }
}

/** The stored fields used to recognise a row as this same booking. */
export interface StoredIdentity {
  created_at: string;
  partner_info: { salesRepEmail?: string } | null;
}

/**
 * True when a stored row is this very booking, arriving a second time — a
 * double click, or a retry after the first attempt landed. The rep's email plus
 * the moment the booking was started identifies it; another rep's booking
 * sharing the id will differ on both.
 */
export function isSameBooking(stored: StoredIdentity, b: BookingSubmission): boolean {
  const sameStart = new Date(stored.created_at).getTime() === new Date(b.createdAt).getTime();
  const storedEmail = String(stored.partner_info?.salesRepEmail ?? '').trim().toLowerCase();
  const email = b.partnerInfo.salesRepEmail.trim().toLowerCase();
  return sameStart && storedEmail !== '' && storedEmail === email;
}

/**
 * Send a booking, drawing a fresh id if the one it has is taken. Resolves to the
 * booking as saved — its id may differ from the one passed in. Any other error,
 * or running out of attempts, is thrown so the rep is never told it worked.
 */
export async function sendWithFreshIdOnClash(
  booking: BookingSubmission,
  send: (b: BookingSubmission) => Promise<void>,
  freshId: () => string,
  maxRetries = 3,
): Promise<BookingSubmission> {
  let current = booking;
  for (let attempt = 0; ; attempt++) {
    try {
      await send(current);
      return current;
    } catch (e) {
      if (!(e instanceof SubmissionIdTakenError) || attempt >= maxRetries) throw e;
      current = { ...current, submissionId: freshId() };
    }
  }
}
