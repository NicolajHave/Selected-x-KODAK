import { useMemo, useState } from 'react';
import type { BookingSubmission } from '../types';
import { ACTIVATIONS } from '../data/catalog';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { DashboardCard } from '../components/DashboardCard';
import { BookingTable } from '../components/BookingTable';
import { ExportButton } from '../components/ExportButton';
import { FilterBar, EMPTY_FILTERS, type BookingFilters } from '../components/FilterBar';

interface AdminOverviewProps {
  bookings: BookingSubmission[];
  onOpen: (b: BookingSubmission) => void;
  onRefresh: () => void;
}

function matches(b: BookingSubmission, f: BookingFilters): boolean {
  if (f.status && b.status !== f.status) return false;
  if (f.market && b.partnerInfo.market !== f.market) return false;
  if (f.country && b.partnerInfo.country !== f.country) return false;
  if (f.salesRep && b.partnerInfo.salesRepName !== f.salesRep) return false;
  if (f.customerType && b.customerType !== f.customerType) return false;
  if (f.activation && !b.selectedActivations.includes(f.activation as never)) return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay = [
      b.submissionId,
      b.partnerInfo.partnerName,
      b.partnerInfo.salesRepName,
      b.partnerInfo.customerNumber,
    ]
      .join(' ')
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

/** HQ / Admin overview — filterable master table + export + status control. */
export function AdminOverview({ bookings, onOpen, onRefresh }: AdminOverviewProps) {
  const [filters, setFilters] = useState<BookingFilters>(EMPTY_FILTERS);

  const markets = useMemo(
    () => [...new Set(bookings.map((b) => b.partnerInfo.market).filter(Boolean))].sort(),
    [bookings],
  );
  const countries = useMemo(
    () => [...new Set(bookings.map((b) => b.partnerInfo.country).filter(Boolean))].sort(),
    [bookings],
  );
  const reps = useMemo(
    () => [...new Set(bookings.map((b) => b.partnerInfo.salesRepName).filter(Boolean))].sort(),
    [bookings],
  );

  const filtered = useMemo(() => bookings.filter((b) => matches(b, filters)), [bookings, filters]);

  const awaiting = filtered.filter(
    (b) => b.status === 'submitted' || b.status === 'under_review',
  ).length;
  const approved = filtered.filter(
    (b) => b.status === 'approved' || b.status === 'confirmed',
  ).length;
  const activeMarkets = new Set(filtered.map((b) => b.partnerInfo.market)).size;

  const caseCounts = ACTIVATIONS.map((a) => ({
    ...a,
    count: filtered.filter((b) => b.selectedActivations.includes(a.type)).length,
  }));

  return (
    <div className="sk-container sk-container--wide">
      <div className="sk-pagehead">
        <div>
          <Eyebrow size="lg">HQ Overview · all markets</Eyebrow>
          <h1>2027 Activation program</h1>
          <p>Submissions awaiting review, across every market and sales rep.</p>
        </div>
        <div className="sk-row">
          <Button variant="ghost" onClick={onRefresh}>
            ⟳ Refresh
          </Button>
          <ExportButton bookings={filtered} />
        </div>
      </div>

      <div className="sk-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <DashboardCard label="Submissions" value={filtered.length} hint={`${bookings.length} total`} />
        <DashboardCard label="Markets" value={activeMarkets} hint={`${markets.length} live`} />
        <DashboardCard label="Awaiting review" value={awaiting} hint="Needs HQ action" small />
        <DashboardCard label="Approved" value={approved} hint="Approved or confirmed" small />
      </div>

      {/* Activation counts — clickable filter shortcuts */}
      <div className="sk-cardgrid sk-cardgrid--3" style={{ marginBottom: 28, gap: 10 }}>
        {caseCounts.map((c) => (
          <button
            key={c.type}
            type="button"
            className={`sk-card${filters.activation === c.type ? ' sk-selcard--on' : ''}`}
            style={{ cursor: 'pointer', textAlign: 'left' }}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                activation: f.activation === c.type ? '' : c.type,
              }))
            }
          >
            <div className="sk-spread">
              <Eyebrow>Case {c.code}</Eyebrow>
              <span className="sk-figure" style={{ fontSize: 22 }}>
                {c.count}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{c.name}</div>
          </button>
        ))}
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        markets={markets}
        countries={countries}
        reps={reps}
      />

      <BookingTable bookings={filtered} onOpen={onOpen} variant="admin" />
    </div>
  );
}
