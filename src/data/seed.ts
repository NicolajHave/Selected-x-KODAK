/**
 * Seed bookings.
 *
 * The portal ships with no pre-loaded records — the store starts empty and is
 * populated entirely by real submissions from sales reps. Keep this array empty
 * for production. (To trial the UI with sample rows, you can temporarily add
 * BookingSubmission objects here; they are written to localStorage on first load
 * — see repository.ts.)
 */
import type { BookingSubmission } from '../types';

export const SEED_BOOKINGS: BookingSubmission[] = [];
