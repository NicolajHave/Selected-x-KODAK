import { Fragment } from 'react';
import { Eyebrow } from './ui/Eyebrow';

interface StepProgressProps {
  steps: string[];
  current: number;
  onJump?: (index: number) => void;
}

/** Numbered step indicator for the booking wizard. */
export function StepProgress({ steps, current, onJump }: StepProgressProps) {
  return (
    <div className="sk-steps">
      {steps.map((s, i) => {
        const done = i < current;
        const cur = i === current;
        const numCls = done ? 'sk-step__num--done' : cur ? 'sk-step__num--cur' : '';
        const clickable = onJump && i <= current;
        return (
          <Fragment key={s}>
            <div className="sk-step">
              <span
                className={`sk-step__num ${numCls}`}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => onJump(i) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') onJump(i);
                      }
                    : undefined
                }
                style={clickable ? { cursor: 'pointer' } : undefined}
              >
                {done ? '✓' : i + 1}
              </span>
              <Eyebrow style={{ color: cur ? 'var(--fg-1)' : 'var(--fg-3)' }}>{s}</Eyebrow>
            </div>
            {i < steps.length - 1 && (
              <div className={`sk-step__line${done ? ' sk-step__line--done' : ''}`} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
