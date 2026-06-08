import { useState } from 'react';
import type { Role } from '../types';
import { Lockup } from '../components/ui/Lockup';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Button } from '../components/ui/Button';
import { Field, RadioGroup, TextInput } from '../components/ui/Field';
import { asset } from '../utils/asset';

interface LoginProps {
  onEnter: (role: Role, email: string) => void;
}

/**
 * Entry screen. No real authentication in the MVP — just a role selector so the
 * demo can switch between the Sales Rep and HQ / Admin experience.
 */
export function Login({ onEnter }: LoginProps) {
  const [email, setEmail] = useState('ebbe.lund@selected.dk');
  const [role, setRole] = useState<Role>('rep');

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
            <h1 className="sk-h1">Welcome back</h1>
            <Field label="Work email" required>
              <TextInput value={email} onChange={setEmail} type="email" inputMode="email" />
            </Field>
            <Field label="Access as" hint="Switches the portal between rep and HQ views.">
              <RadioGroup
                value={role}
                onChange={(v) => setRole(v as Role)}
                options={[
                  { value: 'rep', label: 'Sales Rep' },
                  { value: 'admin', label: 'HQ / Admin' },
                ]}
              />
            </Field>
            <div className="sk-spread" style={{ marginTop: 12 }}>
              <Button variant="text">Request access</Button>
              <Button variant="ink" onClick={() => onEnter(role, email)}>
                Continue →
              </Button>
            </div>
            <div className="sk-login__foot">
              <span>v1.0 · internal · demo data</span>
              <span>support@selected.dk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
