import type { BookingStatus } from '../types';
import { STATUS_BY_KEY } from '../data/catalog';

interface StatusBadgeProps {
  status: BookingStatus;
}

/** Compact status badge — never in loud brand colours (per design system). */
export function StatusBadge({ status }: StatusBadgeProps) {
  const def = STATUS_BY_KEY[status];
  return <span className={`sk-badge sk-badge--${def.tone}`}>{def.label}</span>;
}
