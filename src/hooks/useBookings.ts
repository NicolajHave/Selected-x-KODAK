import { useCallback, useEffect, useState } from 'react';
import type { BookingStatus, BookingSubmission, Role } from '../types';
import { bookingRepository } from '../data/repository';
import { trimPartnerInfo } from '../utils/booking';
import {
  deleteBooking,
  listBookings,
  listBookingsForRep,
  submitBooking,
  updateBookingImages,
  updateBookingNotes,
  updateBookingStatus,
} from '../data/remoteBookings';

/**
 * Bookings for the current role.
 *
 * Sales rep — submitted bookings come from the server, matched on the rep's own
 * email, so they can reopen them from any machine (for example to choose their
 * campaign images). Drafts stay local until submitted, and a failed submit is
 * surfaced so a rep is never left believing HQ received it.
 *
 * HQ / Admin — the list is every booking, from every rep and market.
 */
export function useBookings(role: Role, email = '') {
  const isAdmin = role === 'admin';

  const [bookings, setBookings] = useState<BookingSubmission[]>(() =>
    isAdmin ? [] : bookingRepository.list(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (isAdmin) {
        setBookings(await listBookings());
      } else {
        // Local drafts, plus everything this rep has already submitted.
        const drafts = bookingRepository.list().filter((b) => b.status === 'draft');
        const sent = email ? await listBookingsForRep(email) : [];
        const seen = new Set(sent.map((b) => b.submissionId));
        setBookings([...sent, ...drafts.filter((d) => !seen.has(d.submissionId))]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load bookings.');
      if (!isAdmin) setBookings(bookingRepository.list());
    } finally {
      setLoading(false);
    }
  }, [isAdmin, email]);

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

  /** Set the campaign images on a booking. Available to reps on their own. */
  const updateImages = useCallback(
    async (id: string, images: string[]) => {
      await updateBookingImages(id, images);
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
    updateImages,
    updateStatus,
    updateNotes,
    remove,
  };
}
