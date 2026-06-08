import type { Role } from '../types';

interface RoleSwitcherProps {
  role: Role;
  onChange: (role: Role) => void;
}

/** Demo-only role selector. Replace with real auth/roles for production. */
export function RoleSwitcher({ role, onChange }: RoleSwitcherProps) {
  return (
    <div className="sk-role" role="group" aria-label="Switch role">
      <button
        type="button"
        className={`sk-role__btn${role === 'rep' ? ' sk-role__btn--active' : ''}`}
        aria-pressed={role === 'rep'}
        onClick={() => onChange('rep')}
      >
        Sales Rep
      </button>
      <button
        type="button"
        className={`sk-role__btn${role === 'admin' ? ' sk-role__btn--active' : ''}`}
        aria-pressed={role === 'admin'}
        onClick={() => onChange('admin')}
      >
        HQ / Admin
      </button>
    </div>
  );
}
