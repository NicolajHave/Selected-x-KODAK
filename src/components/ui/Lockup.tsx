interface LockupProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES: Record<NonNullable<LockupProps['size']>, number> = {
  sm: 16,
  md: 22,
  lg: 36,
};

/** Monochrome "Selected x KODAK" lockup (2027 build). */
export function Lockup({ size = 'md' }: LockupProps) {
  const px = SIZES[size];
  return (
    <span className="sk-lockup" aria-label="Selected x Kodak">
      <span className="sk-lockup__sel" style={{ fontSize: px }}>
        Selected
      </span>
      <span className="sk-lockup__x" style={{ fontSize: px * 0.56 }}>
        x
      </span>
      <span className="sk-lockup__kodak" style={{ fontSize: px * 0.92 }}>
        KODAK
      </span>
    </span>
  );
}
