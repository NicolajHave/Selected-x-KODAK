import { useCallback, useEffect, useState } from 'react';
import type { BookingStatus, BookingSubmission, Role } from '../types';
import { bookingRepository } from '../data/repository';
import { trimPartnerInfo } from '../utils/booking';
import {
  deleteBooking,
  listBookings,
  submitBooking,
  updateBookingNotes,
  updateBookingStatus,
} from '../data/remoteBookings';

/**
 * Bookings for the current role.
 *
 * Sales rep — drafts and their own history live in this browser (they cannot
 * read the shared table), and submitting pushes the booking to HQ. If that push
 * fails the caller is told, so a rep is never left believing HQ received it.
 *
 * HQ / Admin — the list comes from the server, so every rep's submission shows
 * up regardless of which machine it was created on.
 */
export function useBookings(role: Role) {
  const isAdmin = role === 'admin';

  const [bookings, setBookings] = useState<BookingSubmission[]>(() =>
    isAdmin ? [] : bookingRepository.list(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!isAdmin) {
      setBookings(bookingRepository.list());
      return;
    }
    setLoading(true);
    setError('');
    try {
      setBookings(await listBookings());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Save a draft. Drafts stay local until they are submitted. */
  const saveDraft = useCallback((booking: BookingSubmission): BookingSubmission => {
    return bookingRepository.upsert({ ...booking, status: 'draft' });
  }, []);

  /** Submit to HQ. Throws if the booking could not be delivered. */
  const submit = useCallback(
    async (booking: BookingSubmission): Promise<BookingSubmission> => {
      const now = new Date().toISOString();
      const toSend: BookingSubmission = {
        ...booking,
        partnerInfo: trimPartnerInfo(booking.partnerInfo),
        status: 'submitted',
        submittedAt: booking.submittedAt || now,
        updatedAt: now,
      };
      await submitBooking(toSend);
      // Only mirror locally once HQ has it, so the rep's list reflects reality.
      bookingRepository.upsert(toSend);
      setBookings(bookingRepository.list());
      return toSend;
    },
    [],
  );

  const updateStatus = useCallback(
    async (id: string, status: BookingStatus) => {
      await updateBookingStatus(id, status);
      await refresh();
    },
    [refresh],
  );

  const updateNotes = useCallback(
    async (id: string, internalNotes: string) => {
      await updateBookingNotes(id, internalNotes);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteBooking(id);
      await refresh();
    },
    [refresh],
  );

  return {
    bookings,
    loading,
    error,
    refresh,
    saveDraft,
    submit,
    updateStatus,
    updateNotes,
    remove,
  };
}
