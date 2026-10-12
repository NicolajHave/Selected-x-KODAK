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
  /** Provided only when an HQ session is active. */
  onSignOut?: () => void;
  /** When false, "New booking" is left out of the navigation. */
  bookingsOpen?: boolean;
}

export function Header({
  nav,
  onNavigate,
  role,
  onRoleChange,
  personaName,
  personaInitials,
  onSignOut,
  bookingsOpen = true,
}: HeaderProps) {
  return (
    <header className="sk-header">
      <div className="sk-header__left">
        <Lockup size="md" />
        <nav className="sk-nav" aria-label="Main">
          {NAV_ITEMS.filter((item) => bookingsOpen || item.key !== 'new').map((item) => (
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
        {onSignOut && (
          <button type="button" className="sk-navlink" onClick={onSignOut}>
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
