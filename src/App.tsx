import { useEffect, useMemo, useState } from 'react';
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
import { currentAdmin, personaFromEmail, signOutAdmin } from './utils/auth';

export default function App() {
  const [entered, setEntered] = useState(false);
  const [role, setRole] = useState<Role>('rep');
  const [email, setEmail] = useState('');
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [showAdminGate, setShowAdminGate] = useState(false);
  const [nav, setNav] = useState<NavKey>('dashboard');

  const {
    bookings,
    loading,
    error,
    refresh,
    saveDraft,
    submit,
    updateStatus,
    updateNotes,
    remove,
  } = useBookings(role);

  // Transient flow state
  const [editing, setEditing] = useState<BookingSubmission | null>(null);
  const [confirmation, setConfirmation] = useState<BookingSubmission | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Reuse an existing HQ session so admins are not asked to sign in twice.
  useEffect(() => {
    void currentAdmin().then((session) => {
      if (session) {
        setAdminAuthed(true);
        setEmail((current) => current || session.email);
      }
    });
  }, []);

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
    setSubmitError('');
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
    // HQ / Admin is gated: prompt for a real sign-in unless already authed.
    if (next === 'admin' && !adminAuthed) {
      setShowAdminGate(true);
      return;
    }
    enterRole(next);
  };

  const handleEnter = (nextRole: Role, nextEmail: string) => {
    setEmail(nextEmail);
    setRole(nextRole);
    if (nextRole === 'admin') setAdminAuthed(true);
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
    const saved = saveDraft(b);
    setEditing(null);
    setSubmitError('');
    setConfirmation(saved);
  };

  const handleSubmit = async (b: BookingSubmission) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const saved = await submit(b);
      setEditing(null);
      setConfirmation(saved);
    } catch (e) {
      // Stay on the wizard: the booking has NOT reached HQ.
      setSubmitError(
        e instanceof Error
          ? `Could not send this booking to HQ: ${e.message}`
          : 'Could not send this booking to HQ. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- drawer handlers ---------- */
  const handleStatusChange = (status: BookingStatus) => {
    if (drawerId) void updateStatus(drawerId, status);
  };
  const handleNotesChange = (notes: string) => {
    if (drawerId) void updateNotes(drawerId, notes);
  };
  const handleEditFromDrawer = (b: BookingSubmission) => {
    setDrawerId(null);
    setEditing(b);
    setNav('new');
  };
  const handleDeleteFromDrawer = (b: BookingSubmission) => {
    void remove(b.submissionId);
    setDrawerId(null);
  };

  const handleSignOut = () => {
    void signOutAdmin().then(() => {
      setAdminAuthed(false);
      setEmail('');
      setEntered(false);
      setRole('rep');
      setNav('dashboard');
    });
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
        submitting={submitting}
        submitError={submitError}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onCancel={() => {
          setEditing(null);
          setSubmitError('');
          setNav(role === 'admin' ? 'admin' : 'dashboard');
        }}
      />
    );
  } else if (nav === 'admin') {
    content = (
      <AdminOverview
        bookings={bookings}
        loading={loading}
        error={error}
        onOpen={(b) => setDrawerId(b.submissionId)}
        onRefresh={() => void refresh()}
      />
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
      onSignOut={adminAuthed ? handleSignOut : undefined}
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
