import type { BookingSubmission } from '../types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { ExportButton } from '../components/ExportButton';
import { EXPORT_COLUMNS, bookingToRow } from '../utils/excel';
import { todayStamp } from '../utils/format';

interface ExportViewProps {
  bookings: BookingSubmission[];
}

/** Excel-shaped preview of the master overview + one-click .xlsx download. */
export function ExportView({ bookings }: ExportViewProps) {
  const rows = bookings.map(bookingToRow);
  const filename = `selected-kodak-booking-overview-${todayStamp()}.xlsx`;

  return (
    <div className="sk-container sk-container--wide">
      <div className="sk-pagehead">
        <div>
          <Eyebrow size="lg">Export · master overview</Eyebrow>
          <h1>Ready for Excel</h1>
          <p>
            One row per booking. Columns map directly to the master tracker structure used by HQ.
          </p>
        </div>
        <ExportButton bookings={bookings} label="Download .xlsx ↓" />
      </div>

      <div
        className="sk-card"
        style={{ padding: 0, overflow: 'hidden' }}
      >
        <div
          className="sk-spread"
          style={{
            background: 'var(--bg-3)',
            padding: '10px 16px',
            borderBottom: '1px solid var(--rule-1)',
          }}
        >
          <Eyebrow>
            Master sheet · {rows.length} row{rows.length === 1 ? '' : 's'} · {EXPORT_COLUMNS.length}{' '}
            columns
          </Eyebrow>
          <span className="sk-mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>
            {filename}
          </span>
        </div>
        {rows.length === 0 ? (
          <div className="sk-empty">No bookings to export yet.</div>
        ) : (
          <div className="sk-tablewrap">
            <table className="sk-table sk-table--export">
              <thead>
                <tr>
                  {EXPORT_COLUMNS.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={bookings[i].submissionId}>
                    {EXPORT_COLUMNS.map((c) => (
                      <td key={c}>{r[c]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
