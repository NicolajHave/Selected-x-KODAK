import { useState } from 'react';
import { Button } from './ui/Button';
import { Eyebrow } from './ui/Eyebrow';
import { Field, TextInput } from './ui/Field';
import { isAdminEmail, supabaseConfigured } from '../utils/auth';

interface AdminGateProps {
  defaultEmail?: string;
  onSuccess: (email: string) => void;
  onCancel: () => void;
}

/**
 * Shown when someone switches to the HQ / Admin view. Access is granted on the
 * email alone — it must be on the allowlist, but there is no password.
 */
export function AdminGate({ defaultEmail = '', onSuccess, onCancel }: AdminGateProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (!supabaseConfigured) {
      setError('The portal is not connected to its database yet.');
      return;
    }
    setBusy(true);
    const allowed = await isAdminEmail(email);
    setBusy(false);
    if (!allowed) {
      setError('That email does not have HQ access.');
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
      <div className="sk-modal" role="dialog" aria-modal="true" aria-label="HQ / Admin access">
        <Eyebrow size="lg">Restricted</Eyebrow>
        <h2 className="sk-drawer__title">HQ / Admin access</h2>
        <p style={{ color: 'var(--fg-3)', fontSize: 14, margin: '4px 0 18px' }}>
          Enter your work email. This area is limited to approved HQ addresses.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Field label="Work email" required>
            <TextInput value={email} onChange={setEmail} type="email" inputMode="email" />
          </Field>
          {error && (
            <div className="sk-login__error" role="alert">
              {error}
            </div>
          )}
          <div className="sk-spread" style={{ marginTop: 16 }}>
            <Button variant="text" type="button" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
            <Button variant="ink" type="submit" disabled={busy}>
              {busy ? 'Checking…' : 'Continue →'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
