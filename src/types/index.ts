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

/** Who is operating the portal. Rep access is open; admin is password-gated. */
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

/** The activation options a partner can book. */
export type ActivationType =
  | 'hero_popup'
  | 'campaign_element'
  | 'digital_package'
  | 'spin_win';

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
  /** Free-text market name, used only when `market === 'OTHER'`. */
  marketOther: string;
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
  notes: string;
}

export interface CampaignElementDetails {
  requestedQuantity: string;
  notes: string;
}

export interface DigitalPackageDetails {
  /** Email address the full digital asset package should be sent to. */
  deliveryEmail: string;
  goLivePeriod: string;
  notes: string;
}

export interface SpinWinDetails {
  prizeType: string;
  estimatedEventPeriod: string;
  notes: string;
}

/** All activation detail blocks. Each is optional; present when selected. */
export interface ActivationDetails {
  hero_popup?: HeroPopupDetails;
  campaign_element?: CampaignElementDetails;
  digital_package?: DigitalPackageDetails;
  spin_win?: SpinWinDetails;
}

/** A complete booking record. */
export interface BookingSubmission {
  submissionId: string;
  partnerInfo: PartnerInfo;
  selectedActivations: ActivationSelection;
  activationDetails: ActivationDetails;
  status: BookingStatus;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  submittedAt: string | null; // ISO timestamp, set on first submit
  createdBy: string; // sales rep name / persona
  internalNotes: string; // HQ-only notes
}
