/**
 * Static catalog data for the Selected × Kodak Partner Booking Portal.
 *
 * Activation definitions, customer-type definitions, and the human-readable
 * labels for every enum in the domain. Centralised here so the UI, the review
 * summary, and the Excel export all read from one source of truth.
 */
import type {
  ActivationAvailability,
  ActivationType,
  BookingStatus,
  CostOwner,
  CustomerType,
} from '../types';
import { asset } from '../utils/asset';

/* ---------- Activations ---------- */

export interface ActivationDef {
  type: ActivationType;
  code: string; // editorial "CASE 01" style code
  name: string;
  description: string;
  recommendedFor: CustomerType;
  recommendedLabel: string;
  costOwner: CostOwner;
  availability: ActivationAvailability;
  /** Whether a quantity field is required at submit. */
  needsQuantity: boolean;
  /** Whether a cost owner must be chosen before submit. */
  needsCostOwner: boolean;
  image?: string;
  /** Optional looping video shown on the card instead of a still image. */
  video?: string;
}

export const ACTIVATIONS: ActivationDef[] = [
  {
    type: 'hero_popup',
    code: '01',
    name: 'Hero pop-up setup / zigzag wall',
    description:
      'Brushed-steel zigzag wall with oak veneer edge — a dedicated in-store brand space for flagship partners.',
    recommendedFor: 'key_account',
    recommendedLabel: 'Key Account',
    costOwner: 'HQ',
    availability: 'hq_funded',
    needsQuantity: true,
    needsCostOwner: true,
    image: asset('brand/photos/hero-popup-display.png'),
  },
  {
    type: 'campaign_element',
    code: '02',
    name: 'Campaign element / mini zigzag',
    description:
      'Mini zigzag wall element. Scalable across many doors for broad retail support.',
    recommendedFor: 'field_account',
    recommendedLabel: 'Field Account',
    costOwner: 'HQ',
    availability: 'hq_funded',
    needsQuantity: true,
    needsCostOwner: true,
    image: asset('brand/photos/wall-front.png'),
  },
  {
    type: 'spin_win',
    code: '03',
    name: 'Spin & Win',
    description:
      'Engagement wheel with disposable camera and totebag prizes to drive in-store footfall.',
    recommendedFor: 'field_account',
    recommendedLabel: 'Field Account',
    costOwner: 'HQ',
    availability: 'hq_funded',
    needsQuantity: false,
    needsCostOwner: true,
    image: asset('brand/photos/spin-win-wheel.png'),
    video: asset('brand/photos/spin-win-wheel.mp4'),
  },
  {
    type: 'small_activation_package',
    code: '04',
    name: 'Small Activation Package',
    description:
      'A compact kit containing 50 totebags and 10 disposable cameras to activate smaller doors.',
    recommendedFor: 'field_account',
    recommendedLabel: 'Southern markets',
    costOwner: 'HQ',
    availability: 'hq_funded',
    needsQuantity: false,
    needsCostOwner: false,
  },
];

/** Markets where the Small Activation Package (case 04) is offered. */
export const SMALL_PACKAGE_MARKETS = ['ES', 'IT', 'FR', 'GR', 'PT'];

/** Activations available for a given market — the small package is market-gated. */
export function activationsForMarket(market: string): ActivationDef[] {
  return ACTIVATIONS.filter(
    (a) =>
      a.type !== 'small_activation_package' || SMALL_PACKAGE_MARKETS.includes(market),
  );
}

export const ACTIVATION_BY_TYPE: Record<ActivationType, ActivationDef> =
  ACTIVATIONS.reduce((acc, a) => {
    acc[a.type] = a;
    return acc;
  }, {} as Record<ActivationType, ActivationDef>);

export const ACTIVATION_AVAILABILITY_LABEL: Record<
  ActivationAvailability,
  string
> = {
  available: 'Available',
  market_partner_funded: 'Market / Partner funded',
  under_evaluation: 'Under evaluation',
  hq_funded: 'HQ funded',
};

/* ---------- Booking status ---------- */

/** Each status maps to one of the design-system badge tones. */
export type BadgeTone =
  | 'draft'
  | 'submitted'
  | 'reviewed'
  | 'approved'
  | 'declined'
  | 'hold'
  | 'confirmed';

export interface StatusDef {
  status: BookingStatus;
  label: string;
  tone: BadgeTone;
}

export const STATUSES: StatusDef[] = [
  { status: 'draft', label: 'Draft', tone: 'draft' },
  { status: 'submitted', label: 'Submitted', tone: 'submitted' },
  { status: 'under_review', label: 'Under review', tone: 'reviewed' },
  { status: 'approved', label: 'Approved', tone: 'approved' },
  { status: 'declined', label: 'Declined', tone: 'declined' },
  { status: 'awaiting_information', label: 'Awaiting information', tone: 'hold' },
  { status: 'confirmed', label: 'Confirmed', tone: 'confirmed' },
];

export const STATUS_BY_KEY: Record<BookingStatus, StatusDef> = STATUSES.reduce(
  (acc, s) => {
    acc[s.status] = s;
    return acc;
  },
  {} as Record<BookingStatus, StatusDef>,
);

/* ---------- Shared option lists ---------- */

export const COST_OWNERS: CostOwner[] = ['HQ', 'Market', 'Partner'];

/** Sentinel market value that reveals a free-text field for a custom market. */
export const MARKET_OTHER = 'OTHER';

export const MARKETS: { value: string; label: string }[] = [
  { value: 'AT', label: 'Austria (AT)' },
  { value: 'BE', label: 'Belgium (BE)' },
  { value: 'CA', label: 'Canada (CA)' },
  { value: 'DK', label: 'Denmark (DK)' },
  { value: 'FI', label: 'Finland (FI)' },
  { value: 'FR', label: 'France (FR)' },
  { value: 'DE', label: 'Germany (DE)' },
  { value: 'GR', label: 'Greece (GR)' },
  { value: 'IE', label: 'Ireland (IE)' },
  { value: 'IT', label: 'Italy (IT)' },
  { value: 'NL', label: 'Netherlands (NL)' },
  { value: 'NO', label: 'Norway (NO)' },
  { value: 'PT', label: 'Portugal (PT)' },
  { value: 'SI', label: 'Slovenia (SI)' },
  { value: 'ES', label: 'Spain (ES)' },
  { value: 'SE', label: 'Sweden (SE)' },
  { value: 'CH', label: 'Switzerland (CH)' },
  { value: 'UK', label: 'United Kingdom (UK)' },
  { value: MARKET_OTHER, label: 'Other' },
];

export const MARKET_LABEL: Record<string, string> = MARKETS.reduce(
  (acc, m) => {
    acc[m.value] = m.label;
    return acc;
  },
  {} as Record<string, string>,
);

/** Display the market, resolving the free-text value when "Other" is chosen. */
export function marketDisplay(p: { market: string; marketOther?: string }): string {
  if (p.market === MARKET_OTHER) return p.marketOther?.trim() || 'Other';
  return MARKET_LABEL[p.market] || p.market;
}
