import type { BookingSubmission } from '../types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { DashboardCard } from '../components/DashboardCard';
import { BookingTable } from '../components/BookingTable';

interface DashboardProps {
  bookings: BookingSubmission[];
  personaName: string;
  onNew: () => void;
  onOpen: (b: BookingSubmission) => void;
}

/** Sales rep dashboard — KPI strip + recent bookings. */
export function Dashboard({ bookings, personaName, onNew, onOpen }: DashboardProps) {
  // Reps see their own submissions first; fall back to all if none are theirs.
  const mine = bookings.filter((b) => b.createdBy === personaName);
  const scoped = mine.length > 0 ? mine : bookings;

  const drafts = scoped.filter((b) => b.status === 'draft').length;
  const submitted = scoped.filter((b) => b.status !== 'draft').length;
  const approved = scoped.filter(
    (b) => b.status === 'approved' || b.status === 'confirmed',
  ).length;
  const awaiting = scoped.filter(
    (b) => b.status === 'submitted' || b.status === 'under_review',
  ).length;

  const firstName = personaName.split(' ')[0] || 'there';

  return (
    <div className="sk-container">
      <div className="sk-pagehead">
        <div>
          <Eyebrow size="lg">2027 Activation · Sales rep</Eyebrow>
          <h1>Good to see you, {firstName}.</h1>
          <p>
            You have {drafts} draft{drafts === 1 ? '' : 's'} in progress and {awaiting} submission
            {awaiting === 1 ? '' : 's'} awaiting HQ review.
          </p>
        </div>
        <Button variant="primary" onClick={onNew}>
          + Create new booking
        </Button>
      </div>

      <div className="sk-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <DashboardCard label="Submitted" value={submitted} hint="Sent to HQ" />
        <DashboardCard label="Drafts" value={drafts} hint="In progress" />
        <DashboardCard label="Approved" value={approved} hint="Ready to execute" />
        <DashboardCard label="Awaiting review" value={awaiting} hint="With HQ now" />
      </div>

      <div className="sk-spread" style={{ marginBottom: 16 }}>
        <Eyebrow size="lg">Recent bookings</Eyebrow>
      </div>
      <BookingTable bookings={scoped} onOpen={onOpen} variant="rep" />
    </div>
  );
}
