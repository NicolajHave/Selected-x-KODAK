/**
 * Booking repository.
 *
 * This is the single seam between the UI and persistence. The MVP ships a
 * localStorage implementation; to move to a real backend, implement the same
 * `BookingRepository` interface against your API (the methods are async-friendly
 * — wrap them in Promises) and swap the export at the bottom. Nothing in the
 * components imports localStorage directly.
 */
import type { BookingSubmission } from '../types';
import { readJSON, writeJSON } from '../utils/storage';
import { SEED_BOOKINGS } from './seed';

const STORAGE_KEY = 'sk-portal.bookings.v2';
const SEEDED_FLAG = 'sk-portal.seeded.v2';

export interface BookingRepository {
  list(): BookingSubmission[];
  get(id: string): BookingSubmission | undefined;
  /** Insert or update by submissionId. Returns the saved record. */
  upsert(booking: BookingSubmission): BookingSubmission;
  remove(id: string): void;
}

class LocalStorageBookingRepository implements BookingRepository {
  constructor() {
    // Initialise the store once per browser, but never re-seed after the user
    // has started editing (even if they clear all rows). SEED_BOOKINGS is empty
    // in production, so a fresh browser simply starts with no bookings.
    const seeded = readJSON<boolean>(SEEDED_FLAG, false);
    if (!seeded) {
      writeJSON(STORAGE_KEY, SEED_BOOKINGS);
      writeJSON(SEEDED_FLAG, true);
    }
  }

  list(): BookingSubmission[] {
    return readJSON<BookingSubmission[]>(STORAGE_KEY, []);
  }

  get(id: string): BookingSubmission | undefined {
    return this.list().find((b) => b.submissionId === id);
  }

  upsert(booking: BookingSubmission): BookingSubmission {
    const all = this.list();
    const idx = all.findIndex((b) => b.submissionId === booking.submissionId);
    const next: BookingSubmission = {
      ...booking,
      updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) all[idx] = next;
    else all.unshift(next);
    writeJSON(STORAGE_KEY, all);
    return next;
  }

  remove(id: string): void {
    writeJSON(
      STORAGE_KEY,
      this.list().filter((b) => b.submissionId !== id),
    );
  }
}

export const bookingRepository: BookingRepository =
  new LocalStorageBookingRepository();
