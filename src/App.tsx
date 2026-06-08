import { useMemo, useState } from 'react';
import type { BookingStatus, BookingSubmission, Role } from './types';
import { AppShell } from './components/AppShell';
import type { NavKey } from './components/Header';
import { BookingDrawer } from './components/BookingDrawer';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewBooking } from './pages/NewBooking';
import { AdminOverview } from './pages/AdminOverview';
import { ExportView } from './pages/ExportView';
import { ConfirmationScreen } from './components/ConfirmationScreen';
import { AdminGate } from './components/AdminGate';
import { useBookings } from './hooks/useBookings';
import { emptyBooking } from './utils/booking';
import { personaFromEmail } from './utils/auth';

export default function App() {
  const { bookings, refresh, save, updateStatus, updateNotes, remove } = useBookings();

  const [entered, setEntered] = useState(false);
  const [role, setRole] = useState<Role>('rep');
  const [email, setEmail] = useState('');
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [showAdminGate, setShowAdminGate] = useState(false);
  const [nav, setNav] = useState<NavKey>('dashboard');

  // Transient flow state
  const [editing, setEditing] = useState<BookingSubmission | null>(null);
  const [confirmation, setConfirmation] = useState<BookingSubmission | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const persona = useMemo(
    () => personaFromEmail(email || 'guest@selected'),
    [email],
  );
  const drawerBooking = useMemo(
    () => bookings.find((b) => b.submissionId === drawerId) || null,
    [bookings, drawerId],
  );

  /* ---------- navigation ---------- */
  const startNew = () => {
    setEditing(emptyBooking(persona.name, persona.email));
    setConfirmation(null);
    setNav('new');
  };

  const handleNavigate = (key: NavKey) => {
    setConfirmation(null);
    if (key === 'new') {
      startNew();
      return;
    }
    setEditing(null);
    setNav(key);
  };

  const enterRole = (next: Role) => {
    setRole(next);
    setEditing(null);
    setConfirmation(null);
    setNav(next === 'admin' ? 'admin' : 'dashboard');
  };

  const handleRoleChange = (next: Role) => {
    // HQ / Admin is gated: prompt for the admin password unless already authed.
    if (next === 'admin' && !adminAuthed) {
      setShowAdminGate(true);
      return;
    }
    enterRole(next);
  };

  const handleEnter = (nextRole: Role, nextEmail: string) => {
    setEmail(nextEmail);
    setRole(nextRole);
    setAdminAuthed(nextRole === 'admin');
    setNav(nextRole === 'admin' ? 'admin' : 'dashboard');
    setEntered(true);
  };

  const handleAdminGateSuccess = (adminEmail: string) => {
    setEmail(adminEmail);
    setAdminAuthed(true);
    setShowAdminGate(false);
    enterRole('admin');
  };

  /* ---------- wizard handlers ---------- */
  const handleSaveDraft = (b: BookingSubmission) => {
    const saved = save({ ...b, status: 'draft' });
    setEditing(null);
    setConfirmation(saved);
  };

  const handleSubmit = (b: BookingSubmission) => {
    const now = new Date().toISOString();
    const saved = save({
      ...b,
      status: 'submitted',
      submittedAt: b.submittedAt || now,
    });
    setEditing(null);
    setConfirmation(saved);
  };

  /* ---------- drawer handlers ---------- */
  const handleStatusChange = (status: BookingStatus) => {
    if (drawerId) updateStatus(drawerId, status);
  };
  const handleNotesChange = (notes: string) => {
    if (drawerId) updateNotes(drawerId, notes);
  };
  const handleEditFromDrawer = (b: BookingSubmission) => {
    setDrawerId(null);
    setEditing(b);
    setNav('new');
  };
  const handleDeleteFromDrawer = (b: BookingSubmission) => {
    remove(b.submissionId);
    setDrawerId(null);
  };

  if (!entered) {
    return (
      <AppShell
        showHeader={false}
        nav={nav}
        onNavigate={handleNavigate}
        role={role}
        onRoleChange={handleRoleChange}
        personaName={persona.name}
        personaInitials={persona.initials}
      >
        <Login onEnter={handleEnter} />
      </AppShell>
    );
  }

  /* ---------- main content ---------- */
  let content;
  if (confirmation) {
    content = (
      <ConfirmationScreen
        booking={confirmation}
        onNew={startNew}
        onHome={() => {
          setConfirmation(null);
          setNav(role === 'admin' ? 'admin' : 'dashboard');
        }}
        onView={() => {
          setDrawerId(confirmation.submissionId);
          setConfirmation(null);
          setNav(role === 'admin' ? 'admin' : 'dashboard');
        }}
      />
    );
  } else if (nav === 'new' && editing) {
    content = (
      <NewBooking
        initial={editing}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onCancel={() => {
          setEditing(null);
          setNav(role === 'admin' ? 'admin' : 'dashboard');
        }}
      />
    );
  } else if (nav === 'admin') {
    content = (
      <AdminOverview bookings={bookings} onOpen={(b) => setDrawerId(b.submissionId)} onRefresh={refresh} />
    );
  } else if (nav === 'export') {
    content = <ExportView bookings={bookings} />;
  } else {
    content = (
      <Dashboard
        bookings={bookings}
        personaName={persona.name}
        onNew={startNew}
        onOpen={(b) => setDrawerId(b.submissionId)}
      />
    );
  }

  return (
    <AppShell
      showHeader
      nav={nav}
      onNavigate={handleNavigate}
      role={role}
      onRoleChange={handleRoleChange}
      personaName={persona.name}
      personaInitials={persona.initials}
    >
      {content}
      <BookingDrawer
        booking={drawerBooking}
        role={role}
        onClose={() => setDrawerId(null)}
        onStatusChange={handleStatusChange}
        onNotesChange={handleNotesChange}
        onEdit={handleEditFromDrawer}
        onDelete={handleDeleteFromDrawer}
      />
      {showAdminGate && (
        <AdminGate
          defaultEmail={email}
          onSuccess={handleAdminGateSuccess}
          onCancel={() => setShowAdminGate(false)}
        />
      )}
    </AppShell>
  );
}
