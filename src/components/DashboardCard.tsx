import { Eyebrow } from './ui/Eyebrow';

interface DashboardCardProps {
  label: string;
  value: string | number;
  hint?: string;
  small?: boolean;
}

/** A single KPI cell within a KPI strip. */
export function DashboardCard({ label, value, hint, small }: DashboardCardProps) {
  return (
    <div className="sk-kpi">
      <Eyebrow>{label}</Eyebrow>
      <div className={`sk-kpi__value${small ? ' sk-kpi__value--sm' : ''}`}>{value}</div>
      {hint && <div className="sk-kpi__hint">{hint}</div>}
    </div>
  );
}
