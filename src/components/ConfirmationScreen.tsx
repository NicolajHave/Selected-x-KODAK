import type { BookingSubmission } from '../types';
import { marketDisplay } from '../data/catalog';
import { Eyebrow } from './ui/Eyebrow';
import { Button } from './ui/Button';
import { orDash } from '../utils/format';

interface ConfirmationScreenProps {
  booking: BookingSubmission;
  onNew: () => void;
  onHome: () => void;
  onView: () => void;
}

/** Editorial success screen shown after a submit or draft save. */
export function ConfirmationScreen({ booking, onNew, onHome, onView }: ConfirmationScreenProps) {
  const submitted = booking.status !== 'draft';
  return (
    <div className="sk-confirm">
      <Eyebrow size="lg">{submitted ? 'Booking submitted' : 'Draft saved'}</Eyebrow>
      <h1 className="sk-h1">
        {submitted ? 'Saved. HQ will be notified.' : 'Draft saved for later.'}
      </h1>
      <p>
        {submitted
          ? `Submission ${booking.submissionId} for ${booking.partnerInfo.partnerName} is now in HQ's queue. You'll see the status update on your dashboard.`
          : `Draft ${booking.submissionId} for ${
              booking.partnerInfo.partnerName || 'this partner'
            } is saved. Reopen it from the dashboard to continue.`}
      </p>

      <div className="sk-confirm__facts">
        {[
          ['Partner', booking.partnerInfo.partnerName],
          ['Market', marketDisplay(booking.partnerInfo)],
          ['Activations', String(booking.selectedActivations.length)],
        ].map(([k, v]) => (
          <div key={k} className="sk-confirm__fact">
            <Eyebrow>{k}</Eyebrow>
            <div style={{ fontWeight: 500, fontSize: 15, marginTop: 4 }}>{orDash(v)}</div>
          </div>
        ))}
      </div>

      <div className="sk-row">
        <Button variant="primary" onClick={onNew}>
          + Create another booking
        </Button>
        <Button variant="ghost" onClick={onView}>
          View submitted booking
        </Button>
        <Button variant="text" onClick={onHome}>
          Return to dashboard →
        </Button>
      </div>
    </div>
  );
}
