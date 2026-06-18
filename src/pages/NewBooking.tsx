import { useState } from 'react';
import type {
  ActivationType,
  BookingSubmission,
  PartnerInfo,
} from '../types';
import { ACTIVATIONS, MARKETS, MARKET_OTHER } from '../data/catalog';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { StepProgress } from '../components/StepProgress';
import { Field, Select, Textarea, TextInput } from '../components/ui/Field';
import { ActivationCard } from '../components/ActivationCard';
import { ReviewSummary } from '../components/ReviewSummary';
import { ActivationDetailBlock } from './booking/ActivationDetailFields';
import { emptyDetailFor } from '../utils/booking';
import {
  hasErrors,
  validateDetails,
  validatePartner,
  validateSelection,
  type Errors,
} from '../utils/validation';

const STEP_LABELS = ['Partner', 'Activations', 'Details', 'Review'];
const STEP_TITLES = [
  'Partner information',
  'Activation selection',
  'Activation details',
  'Review & submit',
];

interface NewBookingProps {
  initial: BookingSubmission;
  onSaveDraft: (b: BookingSubmission) => void;
  onSubmit: (b: BookingSubmission) => void;
  onCancel: () => void;
}

export function NewBooking({ initial, onSaveDraft, onSubmit, onCancel }: NewBookingProps) {
  const [booking, setBooking] = useState<BookingSubmission>(initial);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});

  /* ---------- mutators ---------- */
  const setPartner = (field: keyof PartnerInfo, value: string) =>
    setBooking((b) => ({ ...b, partnerInfo: { ...b.partnerInfo, [field]: value } }));

  const toggleActivation = (type: ActivationType) =>
    setBooking((b) => {
      const on = b.selectedActivations.includes(type);
      const selected = on
        ? b.selectedActivations.filter((t) => t !== type)
        : // keep canonical activation order
          ACTIVATIONS.map((a) => a.type).filter(
            (t) => t === type || b.selectedActivations.includes(t),
          );
      const details = { ...b.activationDetails };
      if (!on && !details[type]) details[type] = emptyDetailFor(type) as never;
      return { ...b, selectedActivations: selected, activationDetails: details };
    });

  const setDetail = (type: ActivationType, field: string, value: unknown) =>
    setBooking((b) => {
      const current = (b.activationDetails[type] || emptyDetailFor(type)) as unknown as Record<
        string,
        unknown
      >;
      return {
        ...b,
        activationDetails: {
          ...b.activationDetails,
          [type]: { ...current, [field]: value },
        },
      };
    });

  /* ---------- step validation ---------- */
  const stepValidators = [validatePartner, validateSelection, validateDetails];

  const goNext = () => {
    const validator = stepValidators[step];
    const stepErrors = validator ? validator(booking) : {};
    if (hasErrors(stepErrors)) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  };

  const goBack = () => {
    setErrors({});
    if (step === 0) onCancel();
    else setStep((s) => s - 1);
  };

  const jump = (target: number) => {
    if (target <= step) {
      setErrors({});
      setStep(target);
    }
  };

  const handleSubmit = () => {
    const all = {
      ...validatePartner(booking),
      ...validateSelection(booking),
      ...validateDetails(booking),
    };
    if (hasErrors(all)) {
      setErrors(all);
      // jump back to the earliest failing step so the user can fix it
      if (Object.keys(validatePartner(booking)).length) setStep(0);
      else if (Object.keys(validateSelection(booking)).length) setStep(1);
      else setStep(2);
      return;
    }
    onSubmit(booking);
  };

  const selectedDefs = ACTIVATIONS.filter((a) => booking.selectedActivations.includes(a.type));

  return (
    <div className="sk-container" style={{ maxWidth: 1100 }}>
      <div className="sk-spread" style={{ alignItems: 'flex-end', marginBottom: 8 }}>
        <Eyebrow size="lg">New partner booking</Eyebrow>
        <Button variant="text" size="sm" onClick={onCancel}>
          Cancel ✕
        </Button>
      </div>
      <h1 className="sk-h1" style={{ fontSize: 34, marginBottom: 32 }}>
        {STEP_TITLES[step]}
      </h1>

      <div style={{ marginBottom: 40 }}>
        <StepProgress steps={STEP_LABELS} current={step} onJump={jump} />
      </div>

      {/* ---------- Step 1: Partner ---------- */}
      {step === 0 && (
        <div className="sk-formgrid">
          <div>
            <Field label="Partner name" required error={errors.partnerName}>
              <TextInput
                value={booking.partnerInfo.partnerName}
                onChange={(v) => setPartner('partnerName', v)}
                invalid={!!errors.partnerName}
              />
            </Field>
            <Field label="Customer number / account ID">
              <TextInput
                value={booking.partnerInfo.customerNumber}
                onChange={(v) => setPartner('customerNumber', v)}
              />
            </Field>
            <Field label="Market" required hint="Drives currency + HQ routing." error={errors.market}>
              <Select
                value={booking.partnerInfo.market}
                onChange={(v) => setPartner('market', v)}
                options={MARKETS}
                placeholder="Select market…"
              />
            </Field>
            {booking.partnerInfo.market === MARKET_OTHER && (
              <Field label="Market name" required error={errors.marketOther}>
                <TextInput
                  value={booking.partnerInfo.marketOther}
                  onChange={(v) => setPartner('marketOther', v)}
                  invalid={!!errors.marketOther}
                />
              </Field>
            )}
            <Field label="Region">
              <TextInput
                value={booking.partnerInfo.region}
                onChange={(v) => setPartner('region', v)}
              />
            </Field>
            <Field label="Store / door name">
              <TextInput
                value={booking.partnerInfo.storeName}
                onChange={(v) => setPartner('storeName', v)}
              />
            </Field>
          </div>
          <div>
            <Field label="City">
              <TextInput
                value={booking.partnerInfo.city}
                onChange={(v) => setPartner('city', v)}
              />
            </Field>
            <Field label="Sales rep name" required error={errors.salesRepName}>
              <TextInput
                value={booking.partnerInfo.salesRepName}
                onChange={(v) => setPartner('salesRepName', v)}
                invalid={!!errors.salesRepName}
              />
            </Field>
            <Field label="Sales rep email" required error={errors.salesRepEmail}>
              <TextInput
                value={booking.partnerInfo.salesRepEmail}
                onChange={(v) => setPartner('salesRepEmail', v)}
                type="email"
                inputMode="email"
                invalid={!!errors.salesRepEmail}
              />
            </Field>
            <Field label="Partner contact person">
              <TextInput
                value={booking.partnerInfo.partnerContactPerson}
                onChange={(v) => setPartner('partnerContactPerson', v)}
              />
            </Field>
            <Field label="Partner contact email" error={errors.partnerContactEmail}>
              <TextInput
                value={booking.partnerInfo.partnerContactEmail}
                onChange={(v) => setPartner('partnerContactEmail', v)}
                type="email"
                inputMode="email"
                invalid={!!errors.partnerContactEmail}
              />
            </Field>
            <Field label="Additional notes" hint="Anything HQ should know up front.">
              <Textarea
                value={booking.partnerInfo.additionalNotes}
                onChange={(v) => setPartner('additionalNotes', v)}
                rows={3}
              />
            </Field>
          </div>
        </div>
      )}

      {/* ---------- Step 2: Activation selection ---------- */}
      {step === 1 && (
        <div>
          <p className="sk-muted" style={{ marginBottom: 24, maxWidth: 560 }}>
            Select one or more activation options for this partner. Option-specific fields open up
            next.
          </p>
          {errors.selectedActivations && (
            <div className="sk-error" style={{ marginBottom: 16 }}>
              {errors.selectedActivations}
            </div>
          )}
          <div className="sk-cardgrid">
            {ACTIVATIONS.map((a) => (
              <ActivationCard
                key={a.type}
                def={a}
                selected={booking.selectedActivations.includes(a.type)}
                onToggle={() => toggleActivation(a.type)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ---------- Step 3: Activation details ---------- */}
      {step === 2 && (
        <div>
          <p className="sk-muted" style={{ marginBottom: 24, maxWidth: 560 }}>
            Fill in the details per selected activation. These feed the master Excel export.
          </p>
          {selectedDefs.length === 0 && (
            <div className="sk-empty" style={{ textAlign: 'left' }}>
              No activations selected. Go back to add one.
            </div>
          )}
          {selectedDefs.map((a) => (
            <ActivationDetailBlock
              key={a.type}
              type={a.type}
              booking={booking}
              setDetail={setDetail}
              errors={errors}
            />
          ))}
        </div>
      )}

      {/* ---------- Step 4: Review ---------- */}
      {step === 3 && <ReviewSummary booking={booking} />}

      {/* ---------- Footer ---------- */}
      <div className="sk-wizard-foot">
        <Button variant="ghost" onClick={goBack}>
          {step === 0 ? 'Cancel' : '← Back'}
        </Button>
        <div className="sk-wizard-foot__right">
          <Button variant="ghost" onClick={() => onSaveDraft(booking)}>
            Save as draft
          </Button>
          {step < STEP_TITLES.length - 1 ? (
            <Button variant="ink" onClick={goNext}>
              Next →
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit}>
              Submit booking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
