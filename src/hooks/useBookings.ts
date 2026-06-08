import { useCallback, useState } from 'react';
import type { BookingStatus, BookingSubmission } from '../types';
import { bookingRepository } from '../data/repository';

/**
 * Local state over the booking repository.
 *
 * Components never touch persistence directly — they go through this hook, which
 * delegates to `bookingRepository`. Swapping localStorage for a backend means
 * making the repository async and awaiting here; the component API stays stable.
 */
export function useBookings() {
  const [bookings, setBookings] = useState<BookingSubmission[]>(() =>
    bookingRepository.list(),
  );

  const refresh = useCallback(() => {
    setBookings(bookingRepository.list());
  }, []);

  const save = useCallback((booking: BookingSubmission): BookingSubmission => {
    const saved = bookingRepository.upsert(booking);
    setBookings(bookingRepository.list());
    return saved;
  }, []);

  const updateStatus = useCallback((id: string, status: BookingStatus) => {
    const existing = bookingRepository.get(id);
    if (!existing) return;
    bookingRepository.upsert({ ...existing, status });
    setBookings(bookingRepository.list());
  }, []);

  const updateNotes = useCallback((id: string, internalNotes: string) => {
    const existing = bookingRepository.get(id);
    if (!existing) return;
    bookingRepository.upsert({ ...existing, internalNotes });
    setBookings(bookingRepository.list());
  }, []);

  /** Permanently delete a booking (e.g. a test record). Not reversible. */
  const remove = useCallback((id: string) => {
    bookingRepository.remove(id);
    setBookings(bookingRepository.list());
  }, []);

  return { bookings, refresh, save, updateStatus, updateNotes, remove };
}
