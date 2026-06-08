import { useId } from 'react';
import type { ReactNode } from 'react';

/* ---------- Field wrapper (label + hint + error) ---------- */

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function Field({ label, hint, required, error, htmlFor, children }: FieldProps) {
  return (
    <div className="sk-field">
      <label className="sk-label" htmlFor={htmlFor}>
        <span>
          {label}
          {required && (
            <span className="sk-label__dot" aria-hidden="true">
              ·
            </span>
          )}
        </span>
      </label>
      {children}
      {hint && !error && <div className="sk-hint">{hint}</div>}
      {error && (
        <div className="sk-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

/* ---------- Text input ---------- */

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  type?: string;
  invalid?: boolean;
  inputMode?: 'text' | 'numeric' | 'email';
  ariaLabel?: string;
}

export function TextInput({
  value,
  onChange,
  placeholder,
  id,
  type = 'text',
  invalid,
  inputMode,
  ariaLabel,
}: TextInputProps) {
  return (
    <input
      id={id}
      type={type}
      inputMode={inputMode}
      aria-label={ariaLabel}
      className={`sk-input${invalid ? ' sk-input--invalid' : ''}`}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/* ---------- Select ---------- */

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  ariaLabel?: string;
}

export function Select({ value, onChange, options, placeholder, id, ariaLabel }: SelectProps) {
  return (
    <div className="sk-select-wrap">
      <select
        id={id}
        aria-label={ariaLabel}
        className="sk-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------- Textarea ---------- */

interface TextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  id?: string;
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength = 500,
  id,
}: TextareaProps) {
  return (
    <div>
      <textarea
        id={id}
        className="sk-textarea"
        value={value}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="sk-charcount">
        {value.length} / {maxLength}
      </div>
    </div>
  );
}

/* ---------- Checkbox ---------- */

interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <label className="sk-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="sk-check__box" aria-hidden="true">
        {checked ? '✓' : ''}
      </span>
      {label}
    </label>
  );
}

/* ---------- Radio group ---------- */

interface RadioGroupProps {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  inline?: boolean;
  name?: string;
}

export function RadioGroup({ value, onChange, options, inline = true, name }: RadioGroupProps) {
  const auto = useId();
  const groupName = name || auto;
  return (
    <div className={`sk-radios${inline ? '' : ' sk-radios--col'}`} role="radiogroup">
      {options.map((o) => (
        <label key={o.value} className="sk-radio">
          <input
            type="radio"
            name={groupName}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          <span className="sk-radio__dot" aria-hidden="true" />
          {o.label}
        </label>
      ))}
    </div>
  );
}
