/** Turn an activation's detail block into label/value pairs for display. */
import type { ActivationType, BookingSubmission } from '../types';
import { ACTIVATION_BY_TYPE } from '../data/catalog';

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
        { label: 'Cost owner', value: ACTIVATION_BY_TYPE.hero_popup.costOwner },
        { label: 'Notes', value: d.notes },
      ]);
    }
    case 'campaign_element': {
      const d = det.campaign_element;
      if (!d) return [];
      return clean([
        { label: 'Requested quantity', value: d.requestedQuantity },
        { label: 'Format', value: 'Mini zigzag' },
        { label: 'Cost owner', value: ACTIVATION_BY_TYPE.campaign_element.costOwner },
        { label: 'Notes', value: d.notes },
      ]);
    }
    case 'digital_package': {
      const d = det.digital_package;
      if (!d) return [];
      return clean([
        { label: 'Package', value: 'Full digital asset package' },
        { label: 'Delivery email', value: d.deliveryEmail },
        { label: 'Go-live period', value: d.goLivePeriod },
        { label: 'Notes', value: d.notes },
      ]);
    }
    case 'spin_win': {
      const d = det.spin_win;
      if (!d) return [];
      return clean([
        { label: 'Prize type', value: d.prizeType },
        { label: 'Estimated event period', value: d.estimatedEventPeriod },
        { label: 'Cost owner', value: ACTIVATION_BY_TYPE.spin_win.costOwner },
        { label: 'Notes', value: d.notes },
      ]);
    }
  }
}
