import type {
  ActivationType,
  BookingSubmission,
  CameraDetails,
  CampaignElementDetails,
  CateringDetails,
  DigitalPackageDetails,
  HeroPopupDetails,
  PosPackageDetails,
  SpinWinDetails,
} from '../../types';
import { ACTIVATION_BY_TYPE } from '../../data/catalog';
import { FormSection } from '../../components/FormSection';
import { Field, RadioGroup, Select, Textarea, TextInput } from '../../components/ui/Field';
import type { Errors } from '../../utils/validation';

type SetDetail = (type: ActivationType, field: string, value: unknown) => void;

interface DetailProps {
  booking: BookingSubmission;
  setDetail: SetDetail;
  errors: Errors;
}

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

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
        {type === 'pos_package' && (
          <PosFields d={(booking.activationDetails.pos_package || {}) as PosPackageDetails} set={set} />
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
        {type === 'camera' && (
          <CameraFields d={(booking.activationDetails.camera || {}) as CameraDetails} set={set} errors={errors} />
        )}
        {type === 'catering' && (
          <CateringFields d={(booking.activationDetails.catering || {}) as CateringDetails} set={set} />
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
        <Field label="Preferred format">
          <Select
            value={d.preferredFormat || ''}
            onChange={(v) => set('preferredFormat', v)}
            placeholder="Select format…"
            options={[
              { value: 'mini_zigzag', label: 'Mini zigzag' },
              { value: 'print_element', label: 'Print element' },
              { value: 'other', label: 'Other' },
            ]}
          />
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

function PosFields({ d, set }: { d: PosPackageDetails; set: (f: string, v: unknown) => void }) {
  return (
    <div className="sk-formgrid">
      <div>
        <Field label="POS package required">
          <RadioGroup value={d.required || ''} onChange={(v) => set('required', v)} options={YES_NO} />
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
        <Field label="Requested">
          <RadioGroup value={d.requested || ''} onChange={(v) => set('requested', v)} options={YES_NO} />
        </Field>
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

function CameraFields({
  d,
  set,
  errors,
}: {
  d: CameraDetails;
  set: (f: string, v: unknown) => void;
  errors: Errors;
}) {
  return (
    <div className="sk-formgrid">
      <div>
        <Field label="Requested">
          <RadioGroup value={d.requested || ''} onChange={(v) => set('requested', v)} options={YES_NO} />
        </Field>
        <Field label="Camera type">
          <Select
            value={d.cameraType || ''}
            onChange={(v) => set('cameraType', v)}
            placeholder="Select type…"
            options={[
              { value: 'disposable', label: 'Disposable' },
              { value: 'digital', label: 'Digital' },
              { value: 'tbc', label: 'To be confirmed' },
            ]}
          />
        </Field>
        <Field label="Quantity" required error={errors['camera.quantity']}>
          <TextInput
            value={d.quantity || ''}
            onChange={(v) => set('quantity', v)}
            placeholder="e.g. 50"
            inputMode="numeric"
            invalid={!!errors['camera.quantity']}
          />
        </Field>
      </div>
      <div>
        <Field label="Purpose">
          <Select
            value={d.purpose || ''}
            onChange={(v) => set('purpose', v)}
            placeholder="Select purpose…"
            options={[
              { value: 'staff_activation', label: 'Staff activation' },
              { value: 'consumer_activation', label: 'Consumer activation' },
              { value: 'competition', label: 'Competition' },
              { value: 'resale_potential', label: 'Resale potential' },
            ]}
          />
        </Field>
        <Field label="Notes" hint="Camera activation scope is under HQ evaluation.">
          <Textarea value={d.notes || ''} onChange={(v) => set('notes', v)} rows={2} />
        </Field>
      </div>
    </div>
  );
}

function CateringFields({
  d,
  set,
}: {
  d: CateringDetails;
  set: (f: string, v: unknown) => void;
}) {
  return (
    <div className="sk-formgrid">
      <div>
        <Field label="Requested">
          <RadioGroup value={d.requested || ''} onChange={(v) => set('requested', v)} options={YES_NO} />
        </Field>
        <Field label="Event date or period">
          <TextInput
            value={d.eventPeriod || ''}
            onChange={(v) => set('eventPeriod', v)}
            placeholder="e.g. 2026-05-22 or May 2026"
          />
        </Field>
      </div>
      <div>
        <Field label="Estimated number of guests">
          <TextInput
            value={d.estimatedGuests || ''}
            onChange={(v) => set('estimatedGuests', v)}
            placeholder="e.g. 80"
            inputMode="numeric"
          />
        </Field>
        <Field label="Notes">
          <Textarea value={d.notes || ''} onChange={(v) => set('notes', v)} rows={2} />
        </Field>
      </div>
    </div>
  );
}
