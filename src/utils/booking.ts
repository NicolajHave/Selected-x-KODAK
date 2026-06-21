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

export const emptyHeroPopup = (): HeroPopupDetails => ({
  requestedQuantity: '',
  preferredDeliveryWindow: '',
  storePlacementNotes: '',
  notes: '',
});

export const emptyCampaignElement = (): CampaignElementDetails => ({
  requestedQuantity: '',
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

/** Generate a new submission id, e.g. SUB-2027-00423. */
export function generateSubmissionId(): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `SUB-2027-00${n}`;
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
    activationDetails: {},
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
    createdBy,
    internalNotes: '',
  };
}
