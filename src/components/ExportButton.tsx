import type { BookingSubmission } from '../types';
import { Button } from './ui/Button';
import { exportBookingsToExcel } from '../utils/excel';

interface ExportButtonProps {
  bookings: BookingSubmission[];
  label?: string;
  variant?: 'primary' | 'ghost' | 'ink';
}

/** Generates and downloads the master Excel overview. */
export function ExportButton({ bookings, label = 'Export Excel ↓', variant = 'primary' }: ExportButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={() => exportBookingsToExcel(bookings)}
      disabled={bookings.length === 0}
      title={bookings.length === 0 ? 'No bookings to export' : undefined}
    >
      {label}
    </Button>
  );
}
