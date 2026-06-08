import type { ReactNode } from 'react';
import { Eyebrow } from './ui/Eyebrow';

interface FormSectionProps {
  eyebrow: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}

/** A ruled section header grouping related fields. */
export function FormSection({ eyebrow, title, aside, children }: FormSectionProps) {
  return (
    <section className="sk-section">
      <div className="sk-section__head">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <div className="sk-section__title">{title}</div>
        </div>
        {aside && <div>{aside}</div>}
      </div>
      {children}
    </section>
  );
}
