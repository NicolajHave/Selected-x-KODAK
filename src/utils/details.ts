/** Turn an activation's detail block into label/value pairs for display. */
import type { ActivationType, BookingSubmission } from '../types';
import {
  CAMERA_PURPOSE_LABEL,
  CAMERA_TYPE_LABEL,
  CAMPAIGN_FORMAT_LABEL,
  DIGITAL_ASSET_LABELS,
} from '../data/catalog';
import { yesNo } from './format';

export interface DetailRow {
  label: string;
  value: string;
}

function clean(rows: DetailRow[]): DetailRow[] {
  return rows.filter((r) => r.value && r.value !== '—');
}

export function detailRows(b: BookingSubmission, t: ActivationType): DetailRow[] {
  const det = b.activationDetails;
  switch (t) {
    case 'hero_popup': {
      const d = det.hero_popup;
      if (!d) return [];
      return clean([
        { label: 'Requested quantity', value: d.requestedQuantity },
        { label: 'Delivery window', value: d.preferredDeliveryWindow },
        { label: 'Placement notes', value: d.storePlacementNotes },
        { label: 'Double-sided', value: d.doubleSided ? yesNo(d.doubleSided) : '' },
        { label: 'Cost owner', value: d.costOwner },
        { label: 'Notes', value: d.notes },
      ]);
    }
    case 'campaign_element': {
      const d = det.campaign_element;
      if (!d) return [];
      return clean([
        { label: 'Requested quantity', value: d.requestedQuantity },
        {
          label: 'Format',
          value: d.preferredFormat ? CAMPAIGN_FORMAT_LABEL[d.preferredFormat] : '',
        },
        { label: 'Cost owner', value: d.costOwner },
        { label: 'Notes', value: d.notes },
      ]);
    }
    case 'pos_package': {
      const d = det.pos_package;
      if (!d) return [];
      return clean([
        { label: 'POS package required', value: d.required ? yesNo(d.required) : '' },
        { label: 'Notes', value: d.notes },
      ]);
    }
    case 'digital_package': {
      const d = det.digital_package;
      if (!d) return [];
      const assets = DIGITAL_ASSET_LABELS.filter(
        (a) => (d as unknown as Record<string, boolean>)[a.key],
      )
        .map((a) => a.label)
        .join(', ');
      return clean([
        { label: 'Requested assets', value: assets },
        { label: 'Partner platform / usage', value: d.partnerPlatform },
        { label: 'Go-live period', value: d.goLivePeriod },
        { label: 'Notes', value: d.notes },
      ]);
    }
    case 'spin_win': {
      const d = det.spin_win;
      if (!d) return [];
      return clean([
        { label: 'Requested', value: d.requested ? yesNo(d.requested) : '' },
        { label: 'Prize type', value: d.prizeType },
        { label: 'Estimated event period', value: d.estimatedEventPeriod },
        { label: 'Cost owner', value: d.costOwner },
        { label: 'Notes', value: d.notes },
      ]);
    }
    case 'camera': {
      const d = det.camera;
      if (!d) return [];
      return clean([
        { label: 'Requested', value: d.requested ? yesNo(d.requested) : '' },
        { label: 'Camera type', value: d.cameraType ? CAMERA_TYPE_LABEL[d.cameraType] : '' },
        { label: 'Quantity', value: d.quantity },
        { label: 'Purpose', value: d.purpose ? CAMERA_PURPOSE_LABEL[d.purpose] : '' },
        { label: 'Notes', value: d.notes },
      ]);
    }
    case 'catering': {
      const d = det.catering;
      if (!d) return [];
      return clean([
        { label: 'Requested', value: d.requested ? yesNo(d.requested) : '' },
        { label: 'Event date / period', value: d.eventPeriod },
        { label: 'Estimated guests', value: d.estimatedGuests },
        { label: 'Cost owner', value: d.costOwner },
        { label: 'Notes', value: d.notes },
      ]);
    }
  }
}
