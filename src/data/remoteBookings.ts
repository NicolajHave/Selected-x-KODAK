/**
 * Server-side bookings (Supabase).
 *
 * This is what makes a booking reach HQ. A sales rep's browser may only INSERT
 * (see the RLS policies on `kodak_bookings`); listing, updating and deleting
 * require a signed-in HQ admin.
 */
import type {
  ActivationDetails,
  ActivationSelection,
  BookingStatus,
  BookingSubmission,
  PartnerInfo,
} from '../types';
import { requireSupabase } from './supabaseClient';

const TABLE = 'kodak_bookings';

interface BookingRow {
  submission_id: string;
  partner_info: PartnerInfo;
  selected_activations: ActivationSelection;
  activation_details: ActivationDetails;
  status: BookingStatus;
  created_by: string;
  internal_notes: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

function toBooking(row: BookingRow): BookingSubmission {
  return {
    submissionId: row.submission_id,
    partnerInfo: row.partner_info,
    selectedActivations: row.selected_activations ?? [],
    activationDetails: row.activation_details ?? {},
    status: row.status,
    createdBy: row.created_by ?? '',
    internalNotes: row.internal_notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
  };
}

function toRow(b: BookingSubmission): BookingRow {
  return {
    submission_id: b.submissionId,
    partner_info: b.partnerInfo,
    selected_activations: b.selectedActivations,
    activation_details: b.activationDetails,
    status: b.status,
    created_by: b.createdBy,
    internal_notes: b.internalNotes,
    created_at: b.createdAt,
    updated_at: b.updatedAt,
    submitted_at: b.submittedAt,
  };
}

/** Send a booking to HQ. Callable without signing in (INSERT-only). */
export async function submitBooking(b: BookingSubmission): Promise<void> {
  const { error } = await requireSupabase().from(TABLE).insert(toRow(b));
  if (error) {
    // A duplicate submission id means it already reached HQ — not a failure.
    if (error.code === '23505') return;
    throw new Error(error.message);
  }
}

/** All bookings, newest first. Requires a signed-in HQ admin. */
export async function listBookings(): Promise<BookingSubmission[]> {
  const { data, error } = await requireSupabase()
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as BookingRow[]).map(toBooking);
}

export async function updateBookingStatus(
  submissionId: string,
  status: BookingStatus,
): Promise<void> {
  const { error } = await requireSupabase()
    .from(TABLE)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('submission_id', submissionId);
  if (error) throw new Error(error.message);
}

export async function updateBookingNotes(
  submissionId: string,
  internalNotes: string,
): Promise<void> {
  const { error } = await requireSupabase()
    .from(TABLE)
    .update({ internal_notes: internalNotes, updated_at: new Date().toISOString() })
    .eq('submission_id', submissionId);
  if (error) throw new Error(error.message);
}

export async function deleteBooking(submissionId: string): Promise<void> {
  const { error } = await requireSupabase()
    .from(TABLE)
    .delete()
    .eq('submission_id', submissionId);
  if (error) throw new Error(error.message);
}
