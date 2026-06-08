import type { ReactNode } from 'react';
import type { Role } from '../types';
import { Header } from './Header';
import type { NavKey } from './Header';

interface AppShellProps {
  showHeader: boolean;
  nav: NavKey;
  onNavigate: (key: NavKey) => void;
  role: Role;
  onRoleChange: (role: Role) => void;
  personaName: string;
  personaInitials: string;
  children: ReactNode;
}

/**
 * The single embeddable root. Everything renders inside `.sk-portal`, which
 * carries all design tokens — so styles never leak into the host page and the
 * host's body/global styles are never overridden.
 */
export function AppShell({
  showHeader,
  nav,
  onNavigate,
  role,
  onRoleChange,
  personaName,
  personaInitials,
  children,
}: AppShellProps) {
  return (
    <div className="sk-portal">
      {showHeader && (
        <Header
          nav={nav}
          onNavigate={onNavigate}
          role={role}
          onRoleChange={onRoleChange}
          personaName={personaName}
          personaInitials={personaInitials}
        />
      )}
      <main>{children}</main>
    </div>
  );
}
