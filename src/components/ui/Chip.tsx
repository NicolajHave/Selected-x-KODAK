import type { ReactNode } from 'react';

interface ChipProps {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

export function Chip({ active, children, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={`sk-chip${active ? ' sk-chip--on' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
