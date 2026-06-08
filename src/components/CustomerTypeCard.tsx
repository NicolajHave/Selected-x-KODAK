import type { CustomerTypeDef } from '../data/catalog';

interface CustomerTypeCardProps {
  def: CustomerTypeDef;
  selected: boolean;
  onSelect: () => void;
}

/** Selectable card for a customer type (Step 2). Single-select. */
export function CustomerTypeCard({ def, selected, onSelect }: CustomerTypeCardProps) {
  return (
    <button
      type="button"
      className={`sk-selcard${selected ? ' sk-selcard--on' : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <div className="sk-selcard__head">
        <div className="sk-selcard__title">{def.name}</div>
        <span className={`sk-tick${selected ? ' sk-tick--on' : ''}`} aria-hidden="true">
          {selected ? '✓' : ''}
        </span>
      </div>
      <div className="sk-selcard__helper">{def.helper}</div>
    </button>
  );
}
