import { describe, expect, it } from 'vitest';
import { EXPORT_COLUMNS, bookingToRow } from './excel';
import type { BookingSubmission } from '../types';
import {
  emptyBooking,
  emptyCampaignElement,
  emptyHeroPopup,
  emptyPartnerInfo,
} from './booking';

/** Self-contained fixtures so the export logic is tested independent of seed data. */
function heroCampaignBooking(): BookingSubmission {
  return {
    ...emptyBooking('Ebbe Lund', 'ebbe.lund@selected.dk'),
    partnerInfo: emptyPartnerInfo({ partnerName: 'Boutique Nord' }),
    selectedActivations: ['hero_popup', 'campaign_element'],
    activationDetails: {
      hero_popup: {
        ...emptyHeroPopup(),
        requestedQuantity: '1',
        preferredDeliveryWindow: 'Wk 14–15',
      },
      campaign_element: { ...emptyCampaignElement(), requestedQuantity: '2' },
    },
  };
}

describe('bookingToRow', () => {
  it('emits a value for every export column', () => {
    const row = bookingToRow(heroCampaignBooking());
    for (const col of EXPORT_COLUMNS) {
      expect(row).toHaveProperty(col);
    }
  });

  it('maps a hero pop-up + campaign element booking correctly', () => {
    const row = bookingToRow(heroCampaignBooking());
    expect(row['Partner name']).toBe('Boutique Nord');
    expect(row['Hero pop-up selected']).toBe('Yes');
    expect(row['Hero pop-up quantity']).toBe('1');
    expect(row['Hero pop-up cost owner']).toBe('HQ');
    expect(row['Campaign element selected']).toBe('Yes');
    expect(row['Campaign element quantity']).toBe('2');
    expect(row['Campaign element format']).toBe('Mini zigzag');
    expect(row['Delivery window']).toBe('Wk 14–15');
  });
});
