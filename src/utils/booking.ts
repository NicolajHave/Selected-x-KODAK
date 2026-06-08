/** Factory helpers for building empty / new booking records. */
import type {
  ActivationDetails,
  ActivationType,
  BookingSubmission,
  CameraDetails,
  CampaignElementDetails,
  CateringDetails,
  DigitalPackageDetails,
  HeroPopupDetails,
  PartnerInfo,
  PosPackageDetails,
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
    country: '',
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
  preferredFormat: '',
  notes: '',
});

export const emptyPosPackage = (): PosPackageDetails => ({
  required: '',
  notes: '',
});

export const emptyDigitalPackage = (): DigitalPackageDetails => ({
  deliveryEmail: '',
  goLivePeriod: '',
  notes: '',
});

export const emptySpinWin = (): SpinWinDetails => ({
  requested: '',
  prizeType: '',
  estimatedEventPeriod: '',
  notes: '',
});

export const emptyCamera = (): CameraDetails => ({
  requested: '',
  cameraType: '',
  quantity: '',
  purpose: '',
  notes: '',
});

export const emptyCatering = (): CateringDetails => ({
  requested: '',
  eventPeriod: '',
  estimatedGuests: '',
  notes: '',
});

/** Build the empty detail block for a given activation type. */
export function emptyDetailFor(type: ActivationType): ActivationDetails[ActivationType] {
  switch (type) {
    case 'hero_popup':
      return emptyHeroPopup();
    case 'campaign_element':
      return emptyCampaignElement();
    case 'pos_package':
      return emptyPosPackage();
    case 'digital_package':
      return emptyDigitalPackage();
    case 'spin_win':
      return emptySpinWin();
    case 'camera':
      return emptyCamera();
    case 'catering':
      return emptyCatering();
  }
}

/** Generate a new submission id, e.g. SUB-2027-00423. */
export function generateSubmissionId(): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `SUB-2027-00${n}`;
}

/**
 * A blank booking. `createdBy` records who started it (internal), and the rep
 * email pre-fills the matching field; the rep name is left empty so the rep
 * enters it themselves rather than seeing a guessed name pre-filled.
 */
export function emptyBooking(createdBy: string, repEmail: string): BookingSubmission {
  const now = new Date().toISOString();
  return {
    submissionId: generateSubmissionId(),
    partnerInfo: emptyPartnerInfo({
      salesRepEmail: repEmail,
    }),
    customerType: '',
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
