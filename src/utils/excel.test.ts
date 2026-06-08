import { describe, expect, it } from 'vitest';
import { EXPORT_COLUMNS, bookingToRow } from './excel';
import { SEED_BOOKINGS } from '../data/seed';

describe('bookingToRow', () => {
  it('emits a value for every export column', () => {
    const row = bookingToRow(SEED_BOOKINGS[0]);
    for (const col of EXPORT_COLUMNS) {
      expect(row).toHaveProperty(col);
    }
  });

  it('maps a Key Account hero pop-up + POS booking correctly', () => {
    const row = bookingToRow(SEED_BOOKINGS[0]);
    expect(row['Partner name']).toBe('Boutique Nord');
    expect(row['Customer type']).toBe('Key Account');
    expect(row['Hero pop-up selected']).toBe('Yes');
    expect(row['Hero pop-up quantity']).toBe('1');
    expect(row['Hero pop-up cost owner']).toBe('HQ');
    expect(row['POS package selected']).toBe('Yes');
    expect(row['Camera activation selected']).toBe('No');
    expect(row['Delivery window']).toBe('Wk 14–15');
  });

  it('summarises digital package assets', () => {
    const digital = SEED_BOOKINGS.find((b) =>
      b.selectedActivations.includes('digital_package'),
    )!;
    const row = bookingToRow(digital);
    expect(row['Digital package selected']).toBe('Yes');
    expect(row['Digital package requested assets']).toContain('Social content via Medibank');
  });

  it('exposes camera details when camera activation is selected', () => {
    const camera = SEED_BOOKINGS.find((b) => b.selectedActivations.includes('camera'))!;
    const row = bookingToRow(camera);
    expect(row['Camera activation selected']).toBe('Yes');
    expect(row['Camera type']).toBe('Disposable');
    expect(row['Camera quantity']).toBe('50');
    expect(row['Camera purpose']).toBe('Consumer activation');
  });
});
