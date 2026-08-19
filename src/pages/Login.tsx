import { useState } from 'react';
import type { Role } from '../types';
import { Lockup } from '../components/ui/Lockup';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { Field, RadioGroup, TextInput } from '../components/ui/Field';
import { asset } from '../utils/asset';
import { signInAdmin, supabaseConfigured } from '../utils/auth';

interface LoginProps {
  onEnter: (role: Role, email: string) => void;
}

/**
 * Entry screen.
 *
 * Sales Rep access is open — enter a work email and continue. The HQ / Admin
 * view requires a real sign-in against Supabase Auth (see utils/auth).
 */
export function Login({ onEnter }: LoginProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('rep');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your work email.');
      return;
    }
    if (role === 'admin') {
      if (!supabaseConfigured) {
        setError('The portal is not connected to its database yet.');
        return;
      }
      setBusy(true);
      const message = await signInAdmin(email, password);
      setBusy(false);
      if (message) {
        setError(message);
        return;
      }
    }
    onEnter(role, email.trim());
  };

  return (
    <div className="sk-login">
      <div
        className="sk-login__hero"
        style={{ backgroundImage: `url('${asset('brand/photos/wall-front.png')}')` }}
      >
        <div className="sk-login__herotext">
          <Eyebrow size="lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Stories through the lens
          </Eyebrow>
          <h2 className="sk-h1">
            Selected x Kodak
            <br />
            Partner Booking Portal.
          </h2>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 14 }}>
            Internal sales tool · 2027 Program
          </div>
        </div>
      </div>

      <div className="sk-login__form">
        <div className="sk-login__inner">
          <Lockup size="md" />
          <div style={{ marginTop: 40 }}>
            <Eyebrow size="lg">Sign in</Eyebrow>
            <h1 className="sk-h1">Welcome</h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <Field label="Work email" required>
                <TextInput value={email} onChange={setEmail} type="email" inputMode="email" />
              </Field>
              <Field label="Access as" hint="HQ / Admin requires a password.">
                <RadioGroup
                  value={role}
                  onChange={(v) => {
                    setRole(v as Role);
                    setError('');
                  }}
                  options={[
                    { value: 'rep', label: 'Sales Rep' },
                    { value: 'admin', label: 'HQ / Admin' },
                  ]}
                />
              </Field>
              {role === 'admin' && (
                <Field label="Password" required>
                  <TextInput value={password} onChange={setPassword} type="password" />
                </Field>
              )}
              {error && (
                <div className="sk-login__error" role="alert">
                  {error}
                </div>
              )}
              <div className="sk-spread" style={{ marginTop: 12 }}>
                <Button variant="text" type="button">
                  Request access
                </Button>
                <Button variant="ink" type="submit" disabled={busy}>
                  {busy ? 'Signing in…' : 'Continue →'}
                </Button>
              </div>
            </form>
            <div className="sk-login__foot">
              <span>v1.0 · Internal tool · 2027 Program</span>
              <span>Selected × Kodak</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
