import { useEffect, useRef, useState, type ReactNode } from 'react';
import { saveDesign, type DesignKind } from '../../data/printDesigns';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  hint?: string;
}

/** Compact numeric input that only reports valid numbers. */
export function NumberField({ label, value, onChange, unit, step = 1, min, max, hint }: NumberFieldProps) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <label className="sk-pt-field">
      <span className="sk-pt-field__label">{label}</span>
      <span className="sk-pt-field__input">
        <input
          type="number"
          inputMode="decimal"
          value={text}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value.replace(',', '.'));
            if (e.target.value !== '' && Number.isFinite(n)) {
              onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)));
            }
          }}
          onBlur={() => setText(String(value))}
        />
        {unit && <span className="sk-pt-field__unit">{unit}</span>}
      </span>
      {hint && <span className="sk-pt-field__hint">{hint}</span>}
    </label>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="sk-pt-color" title={label}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
      <span className="sk-mono">{value.toUpperCase()}</span>
    </label>
  );
}

export function Section({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="sk-pt-section">
      <div className="sk-pt-section__head">
        <h3>{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

export type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: Date }
  | { kind: 'local'; at: Date };

/**
 * Save `value` under `key` a moment after it stops changing. The first value
 * (what was loaded) is not written back.
 */
export function useAutosave(key: string | null, kind: DesignKind, value: unknown, by: string): SaveState {
  const [state, setState] = useState<SaveState>({ kind: 'idle' });
  const first = useRef(true);
  const lastKey = useRef(key);
  /* An edit still waiting for its timer, written at once on switch/unmount. */
  const pending = useRef<{ key: string; kind: DesignKind; value: unknown; by: string } | null>(null);
  const flush = () => {
    const p = pending.current;
    pending.current = null;
    if (p) void saveDesign(p.key, p.kind, p.value, p.by);
  };

  useEffect(() => flush, []);

  useEffect(() => {
    if (lastKey.current !== key) {
      flush();
      lastKey.current = key;
      first.current = true;
      setState({ kind: 'idle' });
    }
    if (!key) return;
    if (first.current) {
      first.current = false;
      return;
    }
    setState({ kind: 'saving' });
    pending.current = { key, kind, value, by };
    const t = setTimeout(() => {
      pending.current = null;
      void saveDesign(key, kind, value, by).then((ok) =>
        setState({ kind: ok ? 'saved' : 'local', at: new Date() }),
      );
    }, 900);
    return () => clearTimeout(t);
  }, [key, kind, value, by]);
  return state;
}

export function SaveBadge({ state }: { state: SaveState }) {
  const time = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  switch (state.kind) {
    case 'idle':
      return <span className="sk-pt-save">All changes saved</span>;
    case 'saving':
      return <span className="sk-pt-save">Saving…</span>;
    case 'saved':
      return <span className="sk-pt-save">Saved {time(state.at)}</span>;
    case 'local':
      return (
        <span className="sk-pt-save sk-pt-save--warn">
          Saved in this browser only ({time(state.at)}) — the server could not be reached
        </span>
      );
  }
}
