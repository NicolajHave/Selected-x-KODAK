import { describe, expect, it } from 'vitest';
import { EXPORT_COLUMNS, bookingToRow } from './excel';
import type { BookingSubmission } from '../types';
import {
  emptyBooking,
  emptyCamera,
  emptyDigitalPackage,
  emptyHeroPopup,
  emptyPartnerInfo,
  emptyPosPackage,
} from './booking';

/** Self-contained fixtures so the export logic is tested independent of seed data. */
function keyAccountHeroPos(): BookingSubmission {
  return {
    ...emptyBooking('Ebbe Lund', 'ebbe.lund@selected.dk'),
    partnerInfo: emptyPartnerInfo({ partnerName: 'Boutique Nord' }),
    selectedActivations: ['hero_popup', 'pos_package'],
    activationDetails: {
      hero_popup: {
        ...emptyHeroPopup(),
        requestedQuantity: '1',
        preferredDeliveryWindow: 'Wk 14–15',
      },
      pos_package: { ...emptyPosPackage(), required: 'yes' },
    },
  };
}

function digitalBooking(): BookingSubmission {
  return {
    ...emptyBooking('Iiris Salo', 'iiris.salo@selected.fi'),
    selectedActivations: ['digital_package'],
    activationDetails: {
      digital_package: { ...emptyDigitalPackage(), deliveryEmail: 'marketing@partner.com' },
    },
  };
}

function cameraBooking(): BookingSubmission {
  return {
    ...emptyBooking('Jonas Becker', 'jonas.becker@selected.de'),
    selectedActivations: ['camera'],
    activationDetails: {
      camera: {
        ...emptyCamera(),
        requested: 'yes',
        cameraType: 'disposable',
        quantity: '50',
        purpose: 'consumer_activation',
      },
    },
  };
}

describe('bookingToRow', () => {
  it('emits a value for every export column', () => {
    const row = bookingToRow(keyAccountHeroPos());
    for (const col of EXPORT_COLUMNS) {
      expect(row).toHaveProperty(col);
    }
  });

  it('maps a hero pop-up + POS booking correctly', () => {
    const row = bookingToRow(keyAccountHeroPos());
    expect(row['Partner name']).toBe('Boutique Nord');
    expect(row['Hero pop-up selected']).toBe('Yes');
    expect(row['Hero pop-up quantity']).toBe('1');
    expect(row['Hero pop-up cost owner']).toBe('HQ');
    expect(row['POS package selected']).toBe('Yes');
    expect(row['Camera activation selected']).toBe('No');
    expect(row['Delivery window']).toBe('Wk 14–15');
  });

  it('captures the digital package delivery email', () => {
    const row = bookingToRow(digitalBooking());
    expect(row['Digital package selected']).toBe('Yes');
    expect(row['Digital package delivery email']).toBe('marketing@partner.com');
  });

  it('exposes camera details when camera activation is selected', () => {
    const row = bookingToRow(cameraBooking());
    expect(row['Camera activation selected']).toBe('Yes');
    expect(row['Camera type']).toBe('Disposable');
    expect(row['Camera quantity']).toBe('50');
    expect(row['Camera purpose']).toBe('Consumer activation');
  });
});
