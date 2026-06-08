import {
  ACTIVATIONS,
  CUSTOMER_TYPES,
  MARKET_LABEL,
  STATUSES,
} from '../data/catalog';

export interface BookingFilters {
  search: string;
  status: string;
  market: string;
  country: string;
  salesRep: string;
  customerType: string;
  activation: string;
}

export const EMPTY_FILTERS: BookingFilters = {
  search: '',
  status: '',
  market: '',
  country: '',
  salesRep: '',
  customerType: '',
  activation: '',
};

interface FilterBarProps {
  filters: BookingFilters;
  onChange: (next: BookingFilters) => void;
  markets: string[];
  countries: string[];
  reps: string[];
}

export function FilterBar({ filters, onChange, markets, countries, reps }: FilterBarProps) {
  const set = (key: keyof BookingFilters, value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="sk-filterbar">
      <div className="sk-filtergroup">
        <select
          className="sk-filter-select"
          aria-label="Filter by status"
          value={filters.status}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s.status} value={s.status}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          className="sk-filter-select"
          aria-label="Filter by market"
          value={filters.market}
          onChange={(e) => set('market', e.target.value)}
        >
          <option value="">All markets</option>
          {markets.map((m) => (
            <option key={m} value={m}>
              {MARKET_LABEL[m] || m}
            </option>
          ))}
        </select>

        <select
          className="sk-filter-select"
          aria-label="Filter by country"
          value={filters.country}
          onChange={(e) => set('country', e.target.value)}
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="sk-filter-select"
          aria-label="Filter by sales rep"
          value={filters.salesRep}
          onChange={(e) => set('salesRep', e.target.value)}
        >
          <option value="">All sales reps</option>
          {reps.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          className="sk-filter-select"
          aria-label="Filter by customer type"
          value={filters.customerType}
          onChange={(e) => set('customerType', e.target.value)}
        >
          <option value="">All customer types</option>
          {CUSTOMER_TYPES.map((c) => (
            <option key={c.type} value={c.type}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="sk-filter-select"
          aria-label="Filter by activation type"
          value={filters.activation}
          onChange={(e) => set('activation', e.target.value)}
        >
          <option value="">All activations</option>
          {ACTIVATIONS.map((a) => (
            <option key={a.type} value={a.type}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <input
        className="sk-search"
        placeholder="Search partner, ID or rep…"
        value={filters.search}
        onChange={(e) => set('search', e.target.value)}
        aria-label="Search bookings"
      />
    </div>
  );
}
