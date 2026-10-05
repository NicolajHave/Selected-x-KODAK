import { describe, expect, it } from 'vitest';
import { formatDeadline, isPastDeadline } from './settings';

describe('formatDeadline', () => {
  it('shows the weekday, date and time in Danish time', () => {
    expect(formatDeadline(new Date('2026-10-14T12:00:00+02:00'))).toBe(
      'Wednesday, 14 October 2026 at 12:00 Danish time',
    );
  });

  it('converts to Danish time whatever zone the deadline was stored in', () => {
    expect(formatDeadline(new Date('2026-10-14T10:00:00Z'))).toBe(
      'Wednesday, 14 October 2026 at 12:00 Danish time',
    );
  });
});

describe('isPastDeadline', () => {
  it('is false while no deadline has been read yet', () => {
    expect(isPastDeadline(null)).toBe(false);
  });

  it('is true once the deadline has passed', () => {
    expect(isPastDeadline(new Date(Date.now() - 1000))).toBe(true);
    expect(isPastDeadline(new Date(Date.now() + 60_000))).toBe(false);
  });
});
