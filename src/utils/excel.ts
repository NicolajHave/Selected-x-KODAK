/**
 * Excel export.
 *
 * Produces one structured worksheet — one row per booking — matching the master
 * tracker column set. Uses the `xlsx` library entirely client-side (no backend).
 */
import * as XLSX from 'xlsx';
import type { BookingSubmission } from '../types';
import {
  CAMERA_PURPOSE_LABEL,
  CAMERA_TYPE_LABEL,
  CAMPAIGN_FORMAT_LABEL,
  CUSTOMER_TYPE_LABEL,
  DIGITAL_ASSET_LABELS,
  MARKET_LABEL,
  STATUS_BY_KEY,
} from '../data/catalog';
import { formatDate, todayStamp, yesNo } from './format';

type Row = Record<string, string>;

function digitalAssetSummary(b: BookingSubmission): string {
  const d = b.activationDetails.digital_package;
  if (!d) return '';
  return DIGITAL_ASSET_LABELS.filter((a) => (d as unknown as Record<string, boolean>)[a.key])
    .map((a) => a.label)
    .join('; ');
}

function cateringScope(b: BookingSubmission): string {
  const d = b.activationDetails.catering;
  if (!d) return '';
  const parts: string[] = [];
  if (d.estimatedGuests) parts.push(`${d.estimatedGuests} guests`);
  if (d.eventPeriod) parts.push(d.eventPeriod);
  return parts.join(' · ');
}

/** Map a booking to a flat, export-shaped row keyed by column header. */
export function bookingToRow(b: BookingSubmission): Row {
  const p = b.partnerInfo;
  const sel = (t: BookingSubmission['selectedActivations'][number]) =>
    yesNo(b.selectedActivations.includes(t));

  const hero = b.activationDetails.hero_popup;
  const campaign = b.activationDetails.campaign_element;
  const spin = b.activationDetails.spin_win;
  const camera = b.activationDetails.camera;

  return {
    'Submission ID': b.submissionId,
    'Partner name': p.partnerName,
    'Customer number': p.customerNumber,
    Market: MARKET_LABEL[p.market] || p.market,
    Country: p.country,
    Region: p.region,
    'Store / door name': p.storeName,
    City: p.city,
    'Sales rep name': p.salesRepName,
    'Sales rep email': p.salesRepEmail,
    'Partner contact person': p.partnerContactPerson,
    'Partner contact email': p.partnerContactEmail,
    'Customer type': b.customerType ? CUSTOMER_TYPE_LABEL[b.customerType] : '',
    'Booking status': STATUS_BY_KEY[b.status]?.label || b.status,

    'Hero pop-up selected': sel('hero_popup'),
    'Hero pop-up quantity': hero?.requestedQuantity || '',
    'Hero pop-up cost owner': hero?.costOwner || '',

    'Campaign element selected': sel('campaign_element'),
    'Campaign element quantity': campaign?.requestedQuantity || '',
    'Campaign element format': campaign?.preferredFormat
      ? CAMPAIGN_FORMAT_LABEL[campaign.preferredFormat] || campaign.preferredFormat
      : '',
    'Campaign element cost owner': campaign?.costOwner || '',

    'POS package selected': sel('pos_package'),

    'Digital package selected': sel('digital_package'),
    'Digital package requested assets': digitalAssetSummary(b),

    'Spin & Win selected': sel('spin_win'),
    'Spin & Win cost owner': spin?.costOwner || '',

    'Camera activation selected': sel('camera'),
    'Camera type': camera?.cameraType
      ? CAMERA_TYPE_LABEL[camera.cameraType] || camera.cameraType
      : '',
    'Camera quantity': camera?.quantity || '',
    'Camera purpose': camera?.purpose
      ? CAMERA_PURPOSE_LABEL[camera.purpose] || camera.purpose
      : '',

    'Catering selected': sel('catering'),
    'Catering scope': cateringScope(b),

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
  'Country',
  'Region',
  'Store / door name',
  'City',
  'Sales rep name',
  'Sales rep email',
  'Partner contact person',
  'Partner contact email',
  'Customer type',
  'Booking status',
  'Hero pop-up selected',
  'Hero pop-up quantity',
  'Hero pop-up cost owner',
  'Campaign element selected',
  'Campaign element quantity',
  'Campaign element format',
  'Campaign element cost owner',
  'POS package selected',
  'Digital package selected',
  'Digital package requested assets',
  'Spin & Win selected',
  'Spin & Win cost owner',
  'Camera activation selected',
  'Camera type',
  'Camera quantity',
  'Camera purpose',
  'Catering selected',
  'Catering scope',
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
