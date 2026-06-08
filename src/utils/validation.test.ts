import { describe, expect, it } from 'vitest';
import { validateForSubmit, validatePartner } from './validation';
import { emptyBooking, emptyHeroPopup } from './booking';
import type { BookingSubmission } from '../types';

function baseBooking(): BookingSubmission {
  return emptyBooking('Ebbe Lund', 'ebbe.lund@selected.dk');
}

describe('validatePartner', () => {
  it('requires partner name, market and a valid rep email', () => {
    const b = baseBooking();
    b.partnerInfo.salesRepEmail = 'not-an-email';
    const errors = validatePartner(b);
    expect(errors.partnerName).toBeDefined();
    expect(errors.market).toBeDefined();
    expect(errors.salesRepEmail).toBeDefined();
  });

  it('passes with the required fields filled', () => {
    const b = baseBooking();
    b.partnerInfo.partnerName = 'Boutique Nord';
    b.partnerInfo.market = 'DK';
    b.partnerInfo.salesRepName = 'Ebbe Lund';
    const errors = validatePartner(b);
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe('validateForSubmit', () => {
  it('requires at least one activation', () => {
    const b = baseBooking();
    b.partnerInfo.partnerName = 'Boutique Nord';
    b.partnerInfo.market = 'DK';
    const errors = validateForSubmit(b);
    expect(errors.selectedActivations).toBeDefined();
  });

  it('requires a market name when "Other" is chosen', () => {
    const b = baseBooking();
    b.partnerInfo.partnerName = 'Boutique Nord';
    b.partnerInfo.market = 'OTHER';
    const errors = validatePartner(b);
    expect(errors.marketOther).toBeDefined();
  });

  it('requires quantity for the hero pop-up', () => {
    const b = baseBooking();
    b.partnerInfo.partnerName = 'Boutique Nord';
    b.partnerInfo.market = 'DK';
    b.selectedActivations = ['hero_popup'];
    b.activationDetails = { hero_popup: emptyHeroPopup() };
    const errors = validateForSubmit(b);
    expect(errors['hero_popup.quantity']).toBeDefined();
  });

  it('is clean for a fully-specified booking', () => {
    const b = baseBooking();
    b.partnerInfo.partnerName = 'Boutique Nord';
    b.partnerInfo.market = 'DK';
    b.partnerInfo.salesRepName = 'Ebbe Lund';
    b.selectedActivations = ['hero_popup'];
    b.activationDetails = {
      hero_popup: { ...emptyHeroPopup(), requestedQuantity: '1' },
    };
    expect(Object.keys(validateForSubmit(b))).toHaveLength(0);
  });
});
