/** Factory helpers for building empty / new booking records. */
import type {
  ActivationDetails,
  ActivationType,
  BookingSubmission,
  CampaignElementDetails,
  HeroPopupDetails,
  PartnerInfo,
  SmallActivationPackageDetails,
  SpinWinDetails,
} from '../types';

export function emptyPartnerInfo(
  overrides: Partial<PartnerInfo> = {},
): PartnerInfo {
  return {
    partnerName: '',
    customerNumber: '',
    market: '',
    marketOther: '',
    region: '',
    storeName: '',
    city: '',
    salesRepName: '',
    salesRepEmail: '',
    partnerContactPerson: '',
    partnerContactEmail: '',
    additionalNotes: '',
    ...overrides,
  };
}

/**
 * Strip stray leading/trailing whitespace from every partner field.
 *
 * A trailing space is invisible in the form but makes the same partner, store
 * or contact show up as two different values in the admin filters and the
 * export, so bookings are cleaned on their way to HQ.
 */
export function trimPartnerInfo(p: PartnerInfo): PartnerInfo {
  const out = {} as PartnerInfo;
  for (const [key, value] of Object.entries(p)) {
    out[key as keyof PartnerInfo] =
      typeof value === 'string' ? value.trim() : value;
  }
  return out;
}

/*
 * Quantity starts at 1, the answer for nearly every booking. It used to start
 * empty with a greyed "1" placeholder, which read as filled in: reps pressed
 * Next, validation stopped them, and nothing on screen said why.
 */
export const emptyHeroPopup = (): HeroPopupDetails => ({
  requestedQuantity: '1',
  preferredDeliveryWindow: '',
  storePlacementNotes: '',
  notes: '',
});

export const emptyCampaignElement = (): CampaignElementDetails => ({
  requestedQuantity: '1',
  notes: '',
});

export const emptySpinWin = (): SpinWinDetails => ({
  prizeType: '',
  estimatedEventPeriod: '',
  notes: '',
});

export const emptySmallActivationPackage = (): SmallActivationPackageDetails => ({
  notes: '',
});

/** Build the empty detail block for a given activation type. */
export function emptyDetailFor(type: ActivationType): ActivationDetails[ActivationType] {
  switch (type) {
    case 'hero_popup':
      return emptyHeroPopup();
    case 'campaign_element':
      return emptyCampaignElement();
    case 'spin_win':
      return emptySpinWin();
    case 'small_activation_package':
      return emptySmallActivationPackage();
  }
}

/**
 * Generate a new submission id, e.g. SUB-2027-482913.
 *
 * Six random digits from 100000–999999. The first ids were drawn from only
 * 9,000 values (SUB-2027-001000 to -009999), where two reps landing on the same
 * id became likely within a couple of hundred bookings. The new range cannot
 * overlap the old one, so a new booking never clashes with an existing one, and
 * a clash between two new ones is caught and retried on submit.
 */
export function generateSubmissionId(): string {
  const [r] = crypto.getRandomValues(new Uint32Array(1));
  const n = 100000 + (r % 900000);
  return `SUB-2027-${n}`;
}

/**
 * A blank booking. `createdBy` is the signed-in user's name (derived from their
 * login email); it records who started the booking and pre-fills the sales rep
 * name + email so the rep doesn't retype their own details.
 */
export function emptyBooking(createdBy: string, repEmail: string): BookingSubmission {
  const now = new Date().toISOString();
  return {
    submissionId: generateSubmissionId(),
    partnerInfo: emptyPartnerInfo({
      salesRepName: createdBy,
      salesRepEmail: repEmail,
    }),
    selectedActivations: [],
    selectedImages: [],
    activationDetails: {},
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
    createdBy,
    internalNotes: '',
  };
}
