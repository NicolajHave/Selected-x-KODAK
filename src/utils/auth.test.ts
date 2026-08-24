import { describe, expect, it } from 'vitest';
import { personaFromEmail } from './auth';

describe('personaFromEmail', () => {
  it('derives a display name from the address', () => {
    expect(personaFromEmail('jana.pohl@bestseller.com').name).toBe('Jana Pohl');
  });

  it('is case-insensitive, so one person is never two values', () => {
    const a = personaFromEmail('Sophie.steukers@bestseller.com');
    const b = personaFromEmail('sophie.steukers@bestseller.com');
    expect(a.name).toBe('Sophie Steukers');
    expect(b.name).toBe(a.name);
    expect(b.email).toBe(a.email);
  });

  it('ignores surrounding whitespace', () => {
    expect(personaFromEmail('  markus.rasmussen@bestseller.com  ').name).toBe(
      'Markus Rasmussen',
    );
  });

  it('handles underscores and hyphens as separators', () => {
    expect(personaFromEmail('anne_laure-tascher@bestseller.com').name).toBe(
      'Anne Laure Tascher',
    );
  });

  it('falls back to the whole local part when there is no separator', () => {
    expect(personaFromEmail('remybergeron@gmail.com').name).toBe('Remybergeron');
  });

  it('builds initials from the first two parts', () => {
    expect(personaFromEmail('jana.pohl@bestseller.com').initials).toBe('JP');
    expect(personaFromEmail('remybergeron@gmail.com').initials).toBe('RE');
  });
});
