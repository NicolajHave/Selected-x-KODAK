import { useState } from 'react';
import { Button } from './ui/Button';
import { Eyebrow } from './ui/Eyebrow';
import { Field, TextInput } from './ui/Field';
import { adminPasswordConfigured, verifyAdmin } from '../utils/auth';

interface AdminGateProps {
  defaultEmail?: string;
  onSuccess: (email: string) => void;
  onCancel: () => void;
}

/**
 * Modal shown when a user tries to enter the HQ / Admin view without having
 * signed in as admin. Validates the authorised email + shared admin password.
 */
export function AdminGate({ defaultEmail = '', onSuccess, onCancel }: AdminGateProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    setError('');
    if (!adminPasswordConfigured()) {
      setError('Admin access is not configured yet. Contact the portal owner.');
      return;
    }
    if (!verifyAdmin(email, password)) {
      setError('That email or password is not authorised for HQ / Admin.');
      return;
    }
    onSuccess(email.trim());
  };

  return (
    <div
      className="sk-scrim sk-scrim--center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="sk-modal" role="dialog" aria-modal="true" aria-label="HQ / Admin sign in">
        <Eyebrow size="lg">Restricted</Eyebrow>
        <h2 className="sk-drawer__title">HQ / Admin sign in</h2>
        <p style={{ color: 'var(--fg-3)', fontSize: 14, margin: '4px 0 18px' }}>
          This area is limited to authorised HQ users.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field label="Work email" required>
            <TextInput value={email} onChange={setEmail} type="email" inputMode="email" />
          </Field>
          <Field label="Admin password" required>
            <TextInput value={password} onChange={setPassword} type="password" />
          </Field>
          {error && (
            <div className="sk-login__error" role="alert">
              {error}
            </div>
          )}
          <div className="sk-spread" style={{ marginTop: 16 }}>
            <Button variant="text" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="ink" type="submit">
              Sign in →
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
