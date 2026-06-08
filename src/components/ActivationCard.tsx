import type { ActivationDef } from '../data/catalog';
import { ACTIVATION_AVAILABILITY_LABEL } from '../data/catalog';
import { Eyebrow } from './ui/Eyebrow';

interface ActivationCardProps {
  def: ActivationDef;
  selected: boolean;
  onToggle: () => void;
}

/** Selectable activation card (Step 3). Multi-select. */
export function ActivationCard({ def, selected, onToggle }: ActivationCardProps) {
  return (
    <button
      type="button"
      className={`sk-selcard${selected ? ' sk-selcard--on' : ''}`}
      aria-pressed={selected}
      onClick={onToggle}
    >
      {def.image && (
        <span
          className="sk-selcard__media"
          style={{ backgroundImage: `url('${def.image}')` }}
          aria-hidden="true"
        />
      )}
      <div className="sk-selcard__head">
        <div>
          <span className="sk-mono" style={{ fontSize: 11, color: 'var(--fg-4)', letterSpacing: '0.08em' }}>
            CASE {def.code}
          </span>
          <div className="sk-selcard__title">{def.name}</div>
        </div>
        <span className={`sk-tick${selected ? ' sk-tick--on' : ''}`} aria-hidden="true">
          {selected ? '✓' : ''}
        </span>
      </div>
      <div className="sk-selcard__desc">{def.description}</div>
      <div className="sk-selcard__foot">
        <Eyebrow>Recommended · {def.recommendedLabel}</Eyebrow>
        <span className={`sk-avail sk-avail--${def.availability}`}>
          {ACTIVATION_AVAILABILITY_LABEL[def.availability]}
        </span>
      </div>
      <div className="sk-selcard__foot" style={{ borderTop: 'none', paddingTop: 4, marginTop: 4 }}>
        <Eyebrow>Cost owner</Eyebrow>
        <span className="sk-mono" style={{ fontSize: 12 }}>
          {def.costOwner}
        </span>
      </div>
    </button>
  );
}
