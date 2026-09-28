import { describe, expect, it, vi } from 'vitest';
import type { BookingSubmission } from '../types';
import { emptyBooking, generateSubmissionId } from './booking';
import { SubmissionIdTakenError, isSameBooking, sendWithFreshIdOnClash } from './submitRetry';

const booking = (): BookingSubmission => ({
  ...emptyBooking('Ines Najib', 'ines.najib@bestseller.com'),
  submissionId: 'SUB-2027-123456',
  createdAt: '2026-09-28T09:15:30.123Z',
});

describe('isSameBooking', () => {
  it('recognises the same booking arriving twice', () => {
    const b = booking();
    const stored = {
      created_at: '2026-09-28T09:15:30.123+00:00',
      partner_info: { salesRepEmail: 'INES.NAJIB@bestseller.com ' },
    };
    expect(isSameBooking(stored, b)).toBe(true);
  });

  it("does not mistake another rep's booking for this one", () => {
    const stored = {
      created_at: '2026-09-28T09:15:30.123Z',
      partner_info: { salesRepEmail: 'remy.bergeron@bestseller.com' },
    };
    expect(isSameBooking(stored, booking())).toBe(false);
  });

  it('does not match the same rep on a different booking', () => {
    const stored = {
      created_at: '2026-08-20T10:00:00Z',
      partner_info: { salesRepEmail: 'ines.najib@bestseller.com' },
    };
    expect(isSameBooking(stored, booking())).toBe(false);
  });

  it('never claims a match when the stored row has no email', () => {
    const stored = { created_at: '2026-09-28T09:15:30.123Z', partner_info: null };
    expect(isSameBooking(stored, booking())).toBe(false);
  });
});

describe('sendWithFreshIdOnClash', () => {
  it('sends once and keeps the id when nothing clashes', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const saved = await sendWithFreshIdOnClash(booking(), send, () => 'SUB-2027-999999');
    expect(send).toHaveBeenCalledTimes(1);
    expect(saved.submissionId).toBe('SUB-2027-123456');
  });

  it('retries under a new id when another booking holds it', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new SubmissionIdTakenError('SUB-2027-123456'))
      .mockResolvedValueOnce(undefined);
    const saved = await sendWithFreshIdOnClash(booking(), send, () => 'SUB-2027-654321');
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].submissionId).toBe('SUB-2027-654321');
    expect(saved.submissionId).toBe('SUB-2027-654321');
  });

  it('does not retry other failures, so the rep is told it did not work', async () => {
    const send = vi.fn().mockRejectedValue(new Error('network down'));
    await expect(sendWithFreshIdOnClash(booking(), send, generateSubmissionId)).rejects.toThrow(
      'network down',
    );
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('gives up after repeated clashes instead of looping forever', async () => {
    const send = vi.fn().mockRejectedValue(new SubmissionIdTakenError('x'));
    await expect(
      sendWithFreshIdOnClash(booking(), send, generateSubmissionId, 3),
    ).rejects.toBeInstanceOf(SubmissionIdTakenError);
    expect(send).toHaveBeenCalledTimes(4);
  });
});

describe('generateSubmissionId', () => {
  it('draws six digits from a range that cannot meet the old ids', () => {
    for (let i = 0; i < 2000; i++) {
      const id = generateSubmissionId();
      expect(id).toMatch(/^SUB-2027-[1-9]\d{5}$/);
      // Old ids were SUB-2027-001000 to -009999, all starting with 00.
      expect(id.startsWith('SUB-2027-00')).toBe(false);
    }
  });
});
