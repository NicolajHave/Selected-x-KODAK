import type {
  ActivationType,
  BookingSubmission,
  CampaignElementDetails,
  DigitalPackageDetails,
  HeroPopupDetails,
  SpinWinDetails,
} from '../../types';
import { ACTIVATION_BY_TYPE } from '../../data/catalog';
import { FormSection } from '../../components/FormSection';
import { Field, Textarea, TextInput } from '../../components/ui/Field';
import type { Errors } from '../../utils/validation';

type SetDetail = (type: ActivationType, field: string, value: unknown) => void;

interface DetailProps {
  booking: BookingSubmission;
  setDetail: SetDetail;
  errors: Errors;
}

/** Renders the detail block for one selected activation. */
export function ActivationDetailBlock({ type, booking, setDetail, errors }: DetailProps & {
  type: ActivationType;
}) {
  const def = ACTIVATION_BY_TYPE[type];
  const set = (field: string, value: unknown) => setDetail(type, field, value);

  return (
    <div className="sk-card" style={{ marginBottom: 18, padding: 24 }}>
      <FormSection eyebrow={`Case ${def.code}`} title={def.name}>
        {type === 'hero_popup' && (
          <HeroFields d={(booking.activationDetails.hero_popup || {}) as HeroPopupDetails} set={set} errors={errors} />
        )}
        {type === 'campaign_element' && (
          <CampaignFields
            d={(booking.activationDetails.campaign_element || {}) as CampaignElementDetails}
            set={set}
            errors={errors}
          />
        )}
        {type === 'digital_package' && (
          <DigitalFields
            d={(booking.activationDetails.digital_package || {}) as DigitalPackageDetails}
            set={set}
          />
        )}
        {type === 'spin_win' && (
          <SpinFields d={(booking.activationDetails.spin_win || {}) as SpinWinDetails} set={set} />
        )}
      </FormSection>
    </div>
  );
}

/* ---------- Per-activation field sets ---------- */

function HeroFields({
  d,
  set,
  errors,
}: {
  d: HeroPopupDetails;
  set: (f: string, v: unknown) => void;
  errors: Errors;
}) {
  return (
    <div className="sk-formgrid">
      <div>
        <Field label="Requested quantity" required error={errors['hero_popup.quantity']}>
          <TextInput
            value={d.requestedQuantity || ''}
            onChange={(v) => set('requestedQuantity', v)}
            placeholder="1"
            inputMode="numeric"
            invalid={!!errors['hero_popup.quantity']}
          />
        </Field>
        <Field label="Preferred delivery window">
          <TextInput
            value={d.preferredDeliveryWindow || ''}
            onChange={(v) => set('preferredDeliveryWindow', v)}
            placeholder="e.g. Wk 14–15"
          />
        </Field>
      </div>
      <div>
        <Field label="Store placement notes">
          <Textarea
            value={d.storePlacementNotes || ''}
            onChange={(v) => set('storePlacementNotes', v)}
            rows={2}
          />
        </Field>
        <Field label="Notes">
          <Textarea value={d.notes || ''} onChange={(v) => set('notes', v)} rows={2} />
        </Field>
      </div>
    </div>
  );
}

function CampaignFields({
  d,
  set,
  errors,
}: {
  d: CampaignElementDetails;
  set: (f: string, v: unknown) => void;
  errors: Errors;
}) {
  return (
    <div className="sk-formgrid">
      <div>
        <Field label="Requested quantity" required error={errors['campaign_element.quantity']}>
          <TextInput
            value={d.requestedQuantity || ''}
            onChange={(v) => set('requestedQuantity', v)}
            placeholder="1"
            inputMode="numeric"
            invalid={!!errors['campaign_element.quantity']}
          />
        </Field>
        <Field label="Format">
          <div className="sk-defval" style={{ fontSize: 14, paddingTop: 4 }}>
            Mini zigzag — the only format.
          </div>
        </Field>
      </div>
      <div>
        <Field label="Notes">
          <Textarea value={d.notes || ''} onChange={(v) => set('notes', v)} rows={2} />
        </Field>
      </div>
    </div>
  );
}

function DigitalFields({
  d,
  set,
}: {
  d: DigitalPackageDetails;
  set: (f: string, v: unknown) => void;
}) {
  return (
    <div className="sk-formgrid">
      <div>
        <p className="sk-muted" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>
          The full digital asset package is included — social content via Medibank, newsletter
          assets, campaign imagery and the storytelling module. Just tell us where to send it.
        </p>
        <Field label="Delivery email" required hint="Where we send the digital material.">
          <TextInput
            value={d.deliveryEmail || ''}
            onChange={(v) => set('deliveryEmail', v)}
            type="email"
            inputMode="email"
            placeholder="e.g. marketing@partner.com"
          />
        </Field>
      </div>
      <div>
        <Field label="Go-live period">
          <TextInput
            value={d.goLivePeriod || ''}
            onChange={(v) => set('goLivePeriod', v)}
            placeholder="e.g. May 2026"
          />
        </Field>
        <Field label="Notes">
          <Textarea value={d.notes || ''} onChange={(v) => set('notes', v)} rows={2} />
        </Field>
      </div>
    </div>
  );
}

function SpinFields({
  d,
  set,
}: {
  d: SpinWinDetails;
  set: (f: string, v: unknown) => void;
}) {
  return (
    <div className="sk-formgrid">
      <div>
        <Field label="Prize type">
          <TextInput
            value={d.prizeType || ''}
            onChange={(v) => set('prizeType', v)}
            placeholder="e.g. Disposable camera + totebag"
          />
        </Field>
      </div>
      <div>
        <Field label="Estimated event period">
          <TextInput
            value={d.estimatedEventPeriod || ''}
            onChange={(v) => set('estimatedEventPeriod', v)}
            placeholder="e.g. June 2026"
          />
        </Field>
        <Field label="Notes">
          <Textarea value={d.notes || ''} onChange={(v) => set('notes', v)} rows={2} />
        </Field>
      </div>
    </div>
  );
}
