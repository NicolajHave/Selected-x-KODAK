/**
 * Excel export.
 *
 * Produces one structured worksheet — one row per booking — matching the master
 * tracker column set. Uses the `xlsx` library entirely client-side (no backend).
 */
import * as XLSX from 'xlsx';
import type { BookingSubmission } from '../types';
import { ACTIVATION_BY_TYPE, marketDisplay, STATUS_BY_KEY } from '../data/catalog';
import { formatDate, todayStamp, yesNo } from './format';

type Row = Record<string, string>;

/** Map a booking to a flat, export-shaped row keyed by column header. */
export function bookingToRow(b: BookingSubmission): Row {
  const p = b.partnerInfo;
  const has = (t: BookingSubmission['selectedActivations'][number]) =>
    b.selectedActivations.includes(t);
  const sel = (t: BookingSubmission['selectedActivations'][number]) => yesNo(has(t));
  /** Catalog cost owner, only when the activation is selected. */
  const owner = (t: BookingSubmission['selectedActivations'][number]) =>
    has(t) ? ACTIVATION_BY_TYPE[t].costOwner : '';

  const hero = b.activationDetails.hero_popup;
  const campaign = b.activationDetails.campaign_element;

  return {
    'Submission ID': b.submissionId,
    'Partner name': p.partnerName,
    'Customer number': p.customerNumber,
    Market: marketDisplay(p),
    Region: p.region,
    'Store / door name': p.storeName,
    City: p.city,
    'Sales rep name': p.salesRepName,
    'Sales rep email': p.salesRepEmail,
    'Partner contact person': p.partnerContactPerson,
    'Partner contact email': p.partnerContactEmail,
    'Booking status': STATUS_BY_KEY[b.status]?.label || b.status,

    'Hero pop-up selected': sel('hero_popup'),
    'Hero pop-up quantity': hero?.requestedQuantity || '',
    'Hero pop-up cost owner': owner('hero_popup'),

    'Campaign element selected': sel('campaign_element'),
    'Campaign element quantity': campaign?.requestedQuantity || '',
    'Campaign element format': has('campaign_element') ? 'Mini zigzag' : '',
    'Campaign element cost owner': owner('campaign_element'),

    'Spin & Win selected': sel('spin_win'),
    'Spin & Win cost owner': owner('spin_win'),

    'Delivery window': hero?.preferredDeliveryWindow || '',
    'Additional notes': p.additionalNotes,
    'Created date': formatDate(b.createdAt),
    'Submitted date': formatDate(b.submittedAt),
    'Last updated date': formatDate(b.updatedAt),
  };
}

/** Column order for the worksheet — matches the master tracker brief. */
export const EXPORT_COLUMNS: string[] = [
  'Submission ID',
  'Partner name',
  'Customer number',
  'Market',
  'Region',
  'Store / door name',
  'City',
  'Sales rep name',
  'Sales rep email',
  'Partner contact person',
  'Partner contact email',
  'Booking status',
  'Hero pop-up selected',
  'Hero pop-up quantity',
  'Hero pop-up cost owner',
  'Campaign element selected',
  'Campaign element quantity',
  'Campaign element format',
  'Campaign element cost owner',
  'Spin & Win selected',
  'Spin & Win cost owner',
  'Delivery window',
  'Additional notes',
  'Created date',
  'Submitted date',
  'Last updated date',
];

/** Build the workbook (separated from download so it can be unit-tested). */
export function buildWorkbook(bookings: BookingSubmission[]): XLSX.WorkBook {
  const rows = bookings.map(bookingToRow);
  const ws = XLSX.utils.json_to_sheet(rows, { header: EXPORT_COLUMNS });
  ws['!cols'] = EXPORT_COLUMNS.map((c) => ({
    wch: Math.max(c.length + 2, 14),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
  return wb;
}

/** Generate and trigger a download of the master Excel overview. */
export function exportBookingsToExcel(bookings: BookingSubmission[]): void {
  const wb = buildWorkbook(bookings);
  const filename = `selected-kodak-booking-overview-${todayStamp()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
