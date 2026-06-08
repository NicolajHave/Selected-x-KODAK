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
    image: asset('brand/photos/wall-front.png'),
  },
  {
    type: 'campaign_element',
    code: '02',
    name: 'Campaign element / mini zigzag / print element',
    description:
      'Mini wall element or print piece. Scalable across many doors for broad retail support.',
    recommendedFor: 'field_account',
    recommendedLabel: 'Field Account',
    costOwner: 'Market',
    availability: 'market_partner_funded',
    needsQuantity: true,
    needsCostOwner: true,
    image: asset('brand/photos/mini-wall.png'),
  },
  {
    type: 'pos_package',
    code: '03',
    name: 'POS package',
    description:
      'Point-of-sale kit to dress the partner space — signage, tags and counter pieces.',
    recommendedFor: 'field_account',
    recommendedLabel: 'Field Account',
    costOwner: 'HQ',
    availability: 'available',
    needsQuantity: false,
    needsCostOwner: false,
    image: asset('brand/photos/merchandise-rail.jpeg'),
  },
  {
    type: 'digital_package',
    code: '04',
    name: 'Digital asset package',
    description:
      'Social, newsletter and campaign imagery delivered via Medibank for digital-first partners.',
    recommendedFor: 'cbo_digital',
    recommendedLabel: 'CBO / Digital Partner',
    costOwner: 'HQ',
    availability: 'available',
    needsQuantity: false,
    needsCostOwner: false,
  },
  {
    type: 'spin_win',
    code: '05',
    name: 'Spin & Win',
    description:
      'Engagement wheel with disposable camera and totebag prizes to drive in-store footfall.',
    recommendedFor: 'field_account',
    recommendedLabel: 'Field Account',
    costOwner: 'Market',
    availability: 'market_partner_funded',
    needsQuantity: false,
    needsCostOwner: true,
    image: asset('brand/photos/spin-win-wheel.png'),
  },
  {
    type: 'camera',
    code: '06',
    name: 'Camera activation',
    description:
      'Disposable or digital Kodak cameras for staff or consumer activation. Scope under HQ evaluation.',
    recommendedFor: 'key_account',
    recommendedLabel: 'Key Account',
    costOwner: 'Market',
    availability: 'under_evaluation',
    needsQuantity: true,
    needsCostOwner: false,
    image: asset('brand/photos/kodak-disposable.png'),
  },
  {
    type: 'catering',
    code: '07',
    name: 'Catering / launch support',
    description:
      'Event hospitality to support launch moments and partner presentations.',
    recommendedFor: 'key_account',
    recommendedLabel: 'Key Account',
    costOwner: 'Market',
    availability: 'market_partner_funded',
    needsQuantity: false,
    needsCostOwner: true,
    image: asset('brand/photos/catering-popcorn.png'),
  },
];

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

/* ---------- Customer types ---------- */

export interface CustomerTypeDef {
  type: CustomerType;
  name: string;
  helper: string;
}

export const CUSTOMER_TYPES: CustomerTypeDef[] = [
  {
    type: 'key_account',
    name: 'Key Account',
    helper: 'Suited for larger physical activation.',
  },
  {
    type: 'field_account',
    name: 'Field Account',
    helper: 'Suited for scalable retail support.',
  },
  {
    type: 'cbo_digital',
    name: 'CBO / Digital Partner',
    helper: 'Suited for digital activation support.',
  },
  {
    type: 'other',
    name: 'Other / To be reviewed',
    helper: 'Requires HQ review.',
  },
];

export const CUSTOMER_TYPE_LABEL: Record<CustomerType, string> = {
  key_account: 'Key Account',
  field_account: 'Field Account',
  cbo_digital: 'CBO / Digital Partner',
  other: 'Other / To be reviewed',
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

export const MARKETS: { value: string; label: string }[] = [
  { value: 'DK', label: 'Denmark (DK)' },
  { value: 'NO', label: 'Norway (NO)' },
  { value: 'SE', label: 'Sweden (SE)' },
  { value: 'FI', label: 'Finland (FI)' },
  { value: 'DE', label: 'Germany (DE)' },
  { value: 'NL', label: 'Netherlands (NL)' },
  { value: 'FR', label: 'France (FR)' },
  { value: 'UK', label: 'United Kingdom (UK)' },
  { value: 'ES', label: 'Spain (ES)' },
];

export const MARKET_LABEL: Record<string, string> = MARKETS.reduce(
  (acc, m) => {
    acc[m.value] = m.label;
    return acc;
  },
  {} as Record<string, string>,
);

export const CAMERA_PURPOSE_LABEL: Record<string, string> = {
  staff_activation: 'Staff activation',
  consumer_activation: 'Consumer activation',
  competition: 'Competition',
  resale_potential: 'Resale potential',
};

export const CAMERA_TYPE_LABEL: Record<string, string> = {
  disposable: 'Disposable',
  digital: 'Digital',
  tbc: 'To be confirmed',
};

export const CAMPAIGN_FORMAT_LABEL: Record<string, string> = {
  mini_zigzag: 'Mini zigzag',
  print_element: 'Print element',
  other: 'Other',
};

export const DIGITAL_ASSET_LABELS: { key: string; label: string }[] = [
  { key: 'socialMedibank', label: 'Social content via Medibank' },
  { key: 'newsletterAssets', label: 'Newsletter assets' },
  { key: 'productHighlight', label: 'Product highlight assets' },
  { key: 'campaignImagery', label: 'Campaign imagery' },
  { key: 'storytellingModule', label: 'Digital storytelling module' },
];
