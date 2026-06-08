import type { Role } from '../types';
import { Lockup } from './ui/Lockup';
import { RoleSwitcher } from './RoleSwitcher';

export type NavKey = 'dashboard' | 'new' | 'admin' | 'export';

export const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'new', label: 'New booking' },
  { key: 'admin', label: 'Admin overview' },
  { key: 'export', label: 'Export' },
];

interface HeaderProps {
  nav: NavKey;
  onNavigate: (key: NavKey) => void;
  role: Role;
  onRoleChange: (role: Role) => void;
  personaName: string;
  personaInitials: string;
}

export function Header({
  nav,
  onNavigate,
  role,
  onRoleChange,
  personaName,
  personaInitials,
}: HeaderProps) {
  return (
    <header className="sk-header">
      <div className="sk-header__left">
        <Lockup size="md" />
        <nav className="sk-nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sk-navlink${nav === item.key ? ' sk-navlink--active' : ''}`}
              aria-current={nav === item.key ? 'page' : undefined}
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="sk-header__right">
        <span className="sk-meta-stamp">2027 · ACTIVATION</span>
        <RoleSwitcher role={role} onChange={onRoleChange} />
        <div className="sk-userchip">
          <span className="sk-userchip__name">{personaName}</span>
          <span className={`sk-avatar sk-avatar--${role}`}>{personaInitials}</span>
        </div>
      </div>
    </header>
  );
}
