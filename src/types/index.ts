/**
 * Selected × Kodak — Partner Booking Portal
 * Core domain types.
 *
 * These types describe the booking domain independent of any storage
 * mechanism. The MVP persists them in localStorage (see utils/storage.ts and
 * data/repository.ts), but the shapes are intentionally backend-friendly:
 * swapping localStorage for a REST/GraphQL API only touches the repository
 * layer, not these types or the UI.
 */

/** Who is operating the portal. No real auth in the MVP — a demo role switch. */
export type Role = 'rep' | 'admin';

/** Partner customer classification (Step 2 of the wizard). */
export type CustomerType =
  | 'key_account'
  | 'field_account'
  | 'cbo_digital'
  | 'other';

/** Lifecycle of a booking. Reps create/submit; HQ moves it through review. */
export type BookingStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'declined'
  | 'awaiting_information'
  | 'confirmed';

/** Who carries the cost of an activation line. */
export type CostOwner = 'HQ' | 'Market' | 'Partner';

/** The seven activation options a partner can book. */
export type ActivationType =
  | 'hero_popup'
  | 'campaign_element'
  | 'pos_package'
  | 'digital_package'
  | 'spin_win'
  | 'camera'
  | 'catering';

/** Availability / funding status shown on each activation card. */
export type ActivationAvailability =
  | 'available'
  | 'market_partner_funded'
  | 'under_evaluation'
  | 'hq_funded';

export type YesNo = 'yes' | 'no';

/** Step 1 — partner information. */
export interface PartnerInfo {
  partnerName: string;
  customerNumber: string;
  market: string;
  country: string;
  region: string;
  storeName: string;
  city: string;
  salesRepName: string;
  salesRepEmail: string;
  partnerContactPerson: string;
  partnerContactEmail: string;
  additionalNotes: string;
}

/** Step 3 — which activations are selected for this booking. */
export type ActivationSelection = ActivationType[];

/* ---------- Step 4 — per-activation detail shapes ---------- */

export interface HeroPopupDetails {
  requestedQuantity: string;
  preferredDeliveryWindow: string;
  storePlacementNotes: string;
  doubleSided: YesNo | '';
  costOwner: CostOwner | '';
  notes: string;
}

export interface CampaignElementDetails {
  requestedQuantity: string;
  preferredFormat: 'mini_zigzag' | 'print_element' | 'other' | '';
  costOwner: CostOwner | '';
  notes: string;
}

export interface PosPackageDetails {
  required: YesNo | '';
  notes: string;
}

export interface DigitalPackageDetails {
  socialMedibank: boolean;
  newsletterAssets: boolean;
  productHighlight: boolean;
  campaignImagery: boolean;
  storytellingModule: boolean;
  partnerPlatform: string;
  goLivePeriod: string;
  notes: string;
}

export interface SpinWinDetails {
  requested: YesNo | '';
  prizeType: string;
  estimatedEventPeriod: string;
  costOwner: Extract<CostOwner, 'Market' | 'Partner'> | '';
  notes: string;
}

export interface CameraDetails {
  requested: YesNo | '';
  cameraType: 'disposable' | 'digital' | 'tbc' | '';
  quantity: string;
  purpose:
    | 'staff_activation'
    | 'consumer_activation'
    | 'competition'
    | 'resale_potential'
    | '';
  notes: string;
}

export interface CateringDetails {
  requested: YesNo | '';
  eventPeriod: string;
  estimatedGuests: string;
  costOwner: Extract<CostOwner, 'Market' | 'Partner'> | '';
  notes: string;
}

/** All activation detail blocks. Each is optional; present when selected. */
export interface ActivationDetails {
  hero_popup?: HeroPopupDetails;
  campaign_element?: CampaignElementDetails;
  pos_package?: PosPackageDetails;
  digital_package?: DigitalPackageDetails;
  spin_win?: SpinWinDetails;
  camera?: CameraDetails;
  catering?: CateringDetails;
}

/** A complete booking record. */
export interface BookingSubmission {
  submissionId: string;
  partnerInfo: PartnerInfo;
  customerType: CustomerType | '';
  selectedActivations: ActivationSelection;
  activationDetails: ActivationDetails;
  status: BookingStatus;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  submittedAt: string | null; // ISO timestamp, set on first submit
  createdBy: string; // sales rep name / persona
  internalNotes: string; // HQ-only notes
}
