import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ink' | 'ghost' | 'text' | 'destruct';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const cls = [
    'sk-btn',
    `sk-btn--${variant}`,
    size === 'sm' ? 'sk-btn--sm' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
