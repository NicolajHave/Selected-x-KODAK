import type { ReactNode, CSSProperties } from 'react';

interface EyebrowProps {
  children: ReactNode;
  size?: 'sm' | 'lg';
  as?: 'div' | 'span';
  style?: CSSProperties;
  className?: string;
}

/** ALL-CAPS editorial eyebrow — the core rhythm device of the design system. */
export function Eyebrow({ children, size = 'sm', as = 'div', style, className }: EyebrowProps) {
  const Tag = as;
  return (
    <Tag
      className={`sk-eyebrow${size === 'lg' ? ' sk-eyebrow--lg' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
