import type { BookingSubmission } from '../types';
import {
  ACTIVATION_BY_TYPE,
  CUSTOMER_TYPE_LABEL,
  MARKET_LABEL,
} from '../data/catalog';
import { Eyebrow } from './ui/Eyebrow';
import { orDash } from '../utils/format';
import { costOwners, deliveryWindow, quantityLabel } from '../utils/summary';

interface ReviewSummaryProps {
  booking: BookingSubmission;
}

/** Step 5 — a clean summary of the booking with a sticky overview aside. */
export function ReviewSummary({ booking: b }: ReviewSummaryProps) {
  const p = b.partnerInfo;
  return (
    <div className="sk-review">
      <div>
        <Eyebrow>Partner</Eyebrow>
        <div className="sk-h1" style={{ fontSize: 26, marginTop: 4 }}>
          {p.partnerName || '—'}
        </div>
        <div className="sk-muted" style={{ fontSize: 13, marginTop: 4 }}>
          {[MARKET_LABEL[p.market] || p.market, p.city, p.storeName].filter(Boolean).join(' · ') ||
            'Location not set'}
        </div>

        <div style={{ marginTop: 24 }}>
          <Eyebrow size="lg">Partner information</Eyebrow>
          <div className="sk-deflist" style={{ marginTop: 12 }}>
            {[
              ['Customer number', p.customerNumber],
              ['Region', p.region],
              ['Country', p.country],
              ['City', p.city],
              ['Sales rep', p.salesRepName],
              ['Sales rep email', p.salesRepEmail],
              ['Partner contact', p.partnerContactPerson],
              ['Contact email', p.partnerContactEmail],
            ].map(([k, v]) => (
              <div key={k}>
                <Eyebrow>{k}</Eyebrow>
                <div className="sk-defval">{orDash(v)}</div>
              </div>
            ))}
          </div>
          {p.additionalNotes && (
            <p
              style={{
                fontSize: 14,
                color: 'var(--fg-2)',
                marginTop: 14,
                lineHeight: 1.5,
                paddingTop: 14,
                borderTop: '1px solid var(--rule-1)',
              }}
            >
              {p.additionalNotes}
            </p>
          )}
        </div>

        <div style={{ marginTop: 28 }}>
          <Eyebrow size="lg">Selected activations</Eyebrow>
          <div style={{ marginTop: 10, borderTop: '1px solid var(--sk-ink)' }}>
            {b.selectedActivations.length === 0 && (
              <div className="sk-empty" style={{ padding: '28px 0', textAlign: 'left' }}>
                No activations selected.
              </div>
            )}
            {b.selectedActivations.map((t) => {
              const def = ACTIVATION_BY_TYPE[t];
              const d = b.activationDetails[t] as
                | { costOwner?: string; notes?: string }
                | undefined;
              const qty = quantityLabel(b, t);
              return (
                <div key={t} className="sk-review-line">
                  <span className="sk-mono" style={{ fontSize: 12, color: 'var(--fg-4)' }}>
                    {def.code}
                  </span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{def.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 2 }}>
                      {[qty, d?.notes].filter(Boolean).join(' · ') || 'Details to follow'}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--fg-3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {d?.costOwner || def.costOwner}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="sk-review__sticky">
        <div className="sk-card sk-card--soft">
          <Eyebrow size="lg">Summary</Eyebrow>
          <div style={{ marginTop: 14 }}>
            {[
              ['Customer type', b.customerType ? CUSTOMER_TYPE_LABEL[b.customerType] : '—'],
              ['Activations', String(b.selectedActivations.length)],
              ['Cost owners', orDash(costOwners(b))],
              ['Delivery window', orDash(deliveryWindow(b))],
            ].map(([k, v]) => (
              <div
                key={k}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '8px 0',
                  borderTop: '1px solid var(--rule-1)',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--fg-3)',
                  }}
                >
                  {k}
                </span>
                <span style={{ fontSize: 13, textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--fg-4)', marginTop: 14, lineHeight: 1.5 }}>
          Save as draft to keep editing, or submit for HQ review. HQ will be notified on submit.
        </p>
      </aside>
    </div>
  );
}
