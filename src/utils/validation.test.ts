import { describe, expect, it } from 'vitest';
import { validateDetails, validateForSubmit, validatePartner } from './validation';
import {
  emptyBooking,
  emptyCampaignElement,
  emptyHeroPopup,
  emptyPartnerInfo,
  trimPartnerInfo,
} from './booking';
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
    b.activationDetails = { hero_popup: { ...emptyHeroPopup(), requestedQuantity: '' } };
    const errors = validateForSubmit(b);
    expect(errors['hero_popup.quantity']).toBeDefined();
  });

  it('starts quantity at 1, so an untouched field is valid', () => {
    // It used to start empty behind a greyed "1" placeholder, which read as
    // filled in and silently blocked Next.
    const b = baseBooking();
    b.partnerInfo.partnerName = 'Boutique Nord';
    b.partnerInfo.market = 'DK';
    b.selectedActivations = ['hero_popup', 'campaign_element'];
    b.activationDetails = { hero_popup: emptyHeroPopup(), campaign_element: emptyCampaignElement() };
    expect(validateDetails(b)).toEqual({});
  });

  it.each(['0', '-1', '1.5', '01', 'abc', '1 + 2 racks', '2 walls'])(
    'rejects %j as a quantity',
    (qty) => {
      const b = baseBooking();
      b.selectedActivations = ['hero_popup'];
      b.activationDetails = { hero_popup: { ...emptyHeroPopup(), requestedQuantity: qty } };
      expect(validateDetails(b)['hero_popup.quantity']).toMatch(/whole number/);
    },
  );

  it.each(['1', '2', '12', ' 3 '])('accepts %j as a quantity', (qty) => {
    const b = baseBooking();
    b.selectedActivations = ['campaign_element'];
    b.activationDetails = { campaign_element: { ...emptyCampaignElement(), requestedQuantity: qty } };
    expect(validateDetails(b)).toEqual({});
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

describe('trimPartnerInfo', () => {
  it('strips stray whitespace so one partner is not two values', () => {
    const p = emptyPartnerInfo({
      partnerName: 'Angeloz ',
      storeName: '  Mode Funk',
      city: 'Aalen ',
      partnerContactPerson: 'MARINA ',
    });
    const t = trimPartnerInfo(p);
    expect(t.partnerName).toBe('Angeloz');
    expect(t.storeName).toBe('Mode Funk');
    expect(t.city).toBe('Aalen');
    expect(t.partnerContactPerson).toBe('MARINA');
  });
});
