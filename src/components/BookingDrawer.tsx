import { useEffect } from 'react';
import type { BookingStatus, BookingSubmission, Role } from '../types';
import { ACTIVATION_BY_TYPE, marketDisplay, STATUSES } from '../data/catalog';
import { Eyebrow } from './ui/Eyebrow';
import { Button } from './ui/Button';
import { StatusBadge } from './StatusBadge';
import { Field, Textarea } from './ui/Field';
import { formatDate, orDash } from '../utils/format';
import { detailRows } from '../utils/details';

interface BookingDrawerProps {
  booking: BookingSubmission | null;
  role: Role;
  onClose: () => void;
  onStatusChange: (status: BookingStatus) => void;
  onNotesChange: (notes: string) => void;
  onEdit: (booking: BookingSubmission) => void;
  onDelete: (booking: BookingSubmission) => void;
}

/** Slide-over drawer with full booking details + admin status controls. */
export function BookingDrawer({
  booking,
  role,
  onClose,
  onStatusChange,
  onNotesChange,
  onEdit,
  onDelete,
}: BookingDrawerProps) {
  useEffect(() => {
    if (!booking) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [booking, onClose]);

  if (!booking) return null;
  const b = booking;
  const p = b.partnerInfo;

  return (
    <div className="sk-scrim" onClick={onClose}>
      <div
        className="sk-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Booking ${b.submissionId}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sk-spread">
          <Eyebrow>{b.submissionId}</Eyebrow>
          <Button variant="text" size="sm" onClick={onClose}>
            Close ✕
          </Button>
        </div>
        <div className="sk-drawer__title">{p.partnerName || 'Untitled partner'}</div>
        <div className="sk-muted" style={{ fontSize: 13 }}>
          {[marketDisplay(p), p.salesRepName, formatDate(b.createdAt)]
            .filter(Boolean)
            .join(' · ')}
        </div>

        <div className="sk-statgrid">
          <div>
            <Eyebrow>Market</Eyebrow>
            <div style={{ fontSize: 13, marginTop: 4 }}>{marketDisplay(p)}</div>
          </div>
          <div>
            <Eyebrow>Activations</Eyebrow>
            <div className="sk-mono" style={{ fontSize: 14, marginTop: 4 }}>
              {b.selectedActivations.length}
            </div>
          </div>
          <div>
            <Eyebrow>Status</Eyebrow>
            <div style={{ marginTop: 4 }}>
              <StatusBadge status={b.status} />
            </div>
          </div>
        </div>

        {/* Partner detail */}
        <Eyebrow size="lg">Partner information</Eyebrow>
        <div className="sk-deflist" style={{ marginTop: 10, marginBottom: 18 }}>
          {[
            ['Customer number', p.customerNumber],
            ['Region', p.region],
            ['City', p.city],
            ['Store / door', p.storeName],
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
          <p style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5, marginBottom: 18 }}>
            {p.additionalNotes}
          </p>
        )}

        {/* Activation detail */}
        <Eyebrow size="lg">Activation details</Eyebrow>
        <div style={{ marginTop: 10, marginBottom: 18 }}>
          {b.selectedActivations.length === 0 && (
            <div className="sk-muted" style={{ fontSize: 13 }}>
              No activations selected.
            </div>
          )}
          {b.selectedActivations.map((t) => {
            const def = ACTIVATION_BY_TYPE[t];
            const rows = detailRows(b, t);
            return (
              <div
                key={t}
                style={{
                  padding: '12px 0',
                  borderTop: '1px solid var(--rule-1)',
                }}
              >
                <div className="sk-spread">
                  <strong style={{ fontSize: 14 }}>{def.name}</strong>
                  <span className="sk-mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>
                    CASE {def.code}
                  </span>
                </div>
                {rows.length > 0 ? (
                  <div className="sk-deflist" style={{ marginTop: 8 }}>
                    {rows.map((r) => (
                      <div key={r.label}>
                        <Eyebrow>{r.label}</Eyebrow>
                        <div className="sk-defval" style={{ fontSize: 13 }}>
                          {r.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sk-muted" style={{ fontSize: 12, marginTop: 6 }}>
                    No details captured yet.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Admin status control */}
        {role === 'admin' && (
          <>
            <Field label="Change status">
              <div className="sk-row">
                {STATUSES.map((s) => (
                  <button
                    key={s.status}
                    type="button"
                    className={`sk-chip${b.status === s.status ? ' sk-chip--on' : ''}`}
                    onClick={() => onStatusChange(s.status)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Internal HQ notes" hint="Visible to HQ only.">
              <Textarea
                value={b.internalNotes}
                onChange={onNotesChange}
                rows={3}
                placeholder="Add an internal note…"
              />
            </Field>
            <div
              className="sk-spread"
              style={{
                alignItems: 'center',
                marginTop: 18,
                paddingTop: 14,
                borderTop: '1px solid var(--rule-1)',
              }}
            >
              <div>
                <Eyebrow>Danger zone</Eyebrow>
                <div className="sk-muted" style={{ fontSize: 12, marginTop: 2 }}>
                  Permanently remove this booking. This cannot be undone.
                </div>
              </div>
              <Button
                variant="destruct"
                size="sm"
                onClick={() => {
                  const ok = window.confirm(
                    `Delete booking ${b.submissionId} for ${
                      p.partnerName || 'this partner'
                    }? This permanently removes it and cannot be undone.`,
                  );
                  if (ok) onDelete(b);
                }}
              >
                Delete booking
              </Button>
            </div>
          </>
        )}

        <div className="sk-spread" style={{ justifyContent: 'flex-end', marginTop: 20 }}>
          {role === 'rep' && b.status === 'draft' && (
            <Button variant="ghost" onClick={() => onEdit(b)}>
              Continue editing
            </Button>
          )}
          <Button variant="ink" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
