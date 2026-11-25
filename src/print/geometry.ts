/**
 * Print geometry shared by the sticker and wall tools.
 *
 * Everything is in millimetres with y pointing DOWN (the way the SVG previews
 * draw). The PDF writers flip y themselves, so preview and print file come out
 * of the same numbers.
 */

export const PT_PER_MM = 72 / 25.4;
export const MM_PER_INCH = 25.4;

export type PathCmd =
  | { op: 'M'; x: number; y: number }
  | { op: 'L'; x: number; y: number }
  | { op: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { op: 'Z' };

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const deg = (d: number) => (d * Math.PI) / 180;

/**
 * Bezier segments for a circular arc from angle a0 to a1 (radians, y-down,
 * so positive angles turn clockwise on screen). Does not emit the start point.
 */
export function arcCommands(cx: number, cy: number, r: number, a0: number, a1: number): PathCmd[] {
  const sweep = a1 - a0;
  const n = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2) - 1e-9));
  const step = sweep / n;
  const k = (4 / 3) * Math.tan(step / 4);
  const out: PathCmd[] = [];
  for (let i = 0; i < n; i++) {
    const s = a0 + i * step;
    const e = s + step;
    const [cs, ss, ce, se] = [Math.cos(s), Math.sin(s), Math.cos(e), Math.sin(e)];
    out.push({
      op: 'C',
      x1: cx + r * (cs - k * ss),
      y1: cy + r * (ss + k * cs),
      x2: cx + r * (ce + k * se),
      y2: cy + r * (se - k * ce),
      x: cx + r * ce,
      y: cy + r * se,
    });
  }
  return out;
}

/** A full circle as a closed path. */
export function circlePath(cx: number, cy: number, r: number): PathCmd[] {
  return [{ op: 'M', x: cx + r, y: cy }, ...arcCommands(cx, cy, r, 0, 2 * Math.PI), { op: 'Z' }];
}

/**
 * Ring sector between radii r1 (inner, may be 0) and r2, from a0 to a1
 * (radians, y-down). With r1 = 0 it is a plain pie slice.
 */
export function sectorPath(
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  a0: number,
  a1: number,
): PathCmd[] {
  const cmds: PathCmd[] = [
    { op: 'M', x: cx + r2 * Math.cos(a0), y: cy + r2 * Math.sin(a0) },
    ...arcCommands(cx, cy, r2, a0, a1),
  ];
  if (r1 > 0) {
    cmds.push({ op: 'L', x: cx + r1 * Math.cos(a1), y: cy + r1 * Math.sin(a1) });
    cmds.push(...arcCommands(cx, cy, r1, a1, a0));
  } else {
    cmds.push({ op: 'L', x: cx, y: cy });
  }
  cmds.push({ op: 'Z' });
  return cmds;
}

export function rectPath(r: Rect): PathCmd[] {
  return [
    { op: 'M', x: r.x, y: r.y },
    { op: 'L', x: r.x + r.w, y: r.y },
    { op: 'L', x: r.x + r.w, y: r.y + r.h },
    { op: 'L', x: r.x, y: r.y + r.h },
    { op: 'Z' },
  ];
}

export function pathToSvg(cmds: PathCmd[]): string {
  const f = (n: number) => Number(n.toFixed(3));
  return cmds
    .map((c) => {
      switch (c.op) {
        case 'M':
        case 'L':
          return `${c.op}${f(c.x)} ${f(c.y)}`;
        case 'C':
          return `C${f(c.x1)} ${f(c.y1)} ${f(c.x2)} ${f(c.y2)} ${f(c.x)} ${f(c.y)}`;
        case 'Z':
          return 'Z';
      }
    })
    .join(' ');
}

/* ------------------------------------------------------------------ wheel */

export interface WheelGeometry {
  segments: number;
  /** Outer diameter of the printed face, mm. */
  outerMm: number;
  /** Diameter of the centre hub left unprinted (cut out), mm. 0 = none. */
  hubMm: number;
  /** Rotation of segment 1's centre, degrees clockwise from 12 o'clock. */
  startDeg: number;
}

/** Centre angle and half-width of segment i, in radians (y-down). */
export function segmentAngles(g: WheelGeometry, i: number): { center: number; half: number } {
  const span = (2 * Math.PI) / g.segments;
  return { center: deg(-90 + g.startDeg) + i * span, half: span / 2 };
}

/**
 * A ring sector with every edge moved by `off` mm: positive grows it (bleed),
 * negative shrinks it (a sticker inset from the printed segment). The straight
 * edges move parallel to themselves, so the distance is exact everywhere.
 * When the inner arc disappears the shape ends in a point.
 */
export function offsetWedgePath(
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  a0: number,
  a1: number,
  off: number,
): PathCmd[] {
  const R2 = r2 + off;
  const R1 = r1 - off;
  const half = (a1 - a0) / 2;
  const mid = a0 + half;
  const da = (r: number) => Math.asin(Math.max(-1, Math.min(1, off / r)));
  const cmds: PathCmd[] = [
    { op: 'M', x: cx + R2 * Math.cos(a0 - da(R2)), y: cy + R2 * Math.sin(a0 - da(R2)) },
    ...arcCommands(cx, cy, R2, a0 - da(R2), a1 + da(R2)),
  ];
  /* The offset edges meet this far from the centre (negative = behind it). */
  const apex = -off / Math.sin(half);
  if (R1 > Math.abs(off) + 1e-6 && R1 > apex) {
    cmds.push({ op: 'L', x: cx + R1 * Math.cos(a1 + da(R1)), y: cy + R1 * Math.sin(a1 + da(R1)) });
    cmds.push(...arcCommands(cx, cy, R1, a1 + da(R1), a0 - da(R1)));
  } else {
    cmds.push({ op: 'L', x: cx + apex * Math.cos(mid), y: cy + apex * Math.sin(mid) });
  }
  cmds.push({ op: 'Z' });
  return cmds;
}

/**
 * Bounding box of a path. Bezier control points are included, which can make
 * the box a hair larger than the curve — never smaller.
 */
export function pathBounds(cmds: PathCmd[]): Rect {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const c of cmds) {
    if (c.op === 'Z') continue;
    xs.push(c.x);
    ys.push(c.y);
    if (c.op === 'C') {
      xs.push(c.x1, c.x2);
      ys.push(c.y1, c.y2);
    }
  }
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/**
 * Rectangle centred `r` mm from (cx, cy) along `angle`, `length` mm along the
 * radius and `width` mm across it.
 */
export function radialRectPath(
  cx: number,
  cy: number,
  angle: number,
  r: number,
  length: number,
  width: number,
): PathCmd[] {
  const u = { x: Math.cos(angle), y: Math.sin(angle) };
  const v = { x: -u.y, y: u.x };
  const pt = (a: number, b: number) => ({ x: cx + u.x * (r + a) + v.x * b, y: cy + u.y * (r + a) + v.y * b });
  const corners = [
    pt(-length / 2, -width / 2),
    pt(length / 2, -width / 2),
    pt(length / 2, width / 2),
    pt(-length / 2, width / 2),
  ];
  return [
    { op: 'M', ...corners[0] },
    { op: 'L', ...corners[1] },
    { op: 'L', ...corners[2] },
    { op: 'L', ...corners[3] },
    { op: 'Z' },
  ];
}

/** Bounding box of a sector, found by sampling — robust for any span. */
export function sectorBounds(cx: number, cy: number, r1: number, r2: number, a0: number, a1: number): Rect {
  const xs: number[] = [];
  const ys: number[] = [];
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    for (const r of [r1, r2]) {
      xs.push(cx + r * Math.cos(a));
      ys.push(cy + r * Math.sin(a));
    }
  }
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/* ------------------------------------------------------------ image fitting */

export interface Crop {
  /** 1 = the image just covers the frame; larger zooms in. */
  zoom: number;
  /** Which part of the overflow is kept: 0 = left/top edge, 0.5 = centre, 1 = right/bottom. */
  focusX: number;
  focusY: number;
}

/**
 * Where to draw an image of px × py pixels so it covers `frame`, honouring the
 * crop. The result is usually larger than the frame — clip to the frame.
 */
export function coverPlacement(frame: Rect, px: number, py: number, crop: Crop): Rect {
  const zoom = Math.max(1, crop.zoom || 1);
  const scale = Math.max(frame.w / px, frame.h / py) * zoom;
  const w = px * scale;
  const h = py * scale;
  const fx = Math.min(1, Math.max(0, crop.focusX));
  const fy = Math.min(1, Math.max(0, crop.focusY));
  return { x: frame.x - (w - frame.w) * fx, y: frame.y - (h - frame.h) * fy, w, h };
}

/** Pixels per inch the image ends up printed at when drawn `drawnWidthMm` wide. */
export function effectiveDpi(pixelWidth: number, drawnWidthMm: number): number {
  return drawnWidthMm > 0 ? (pixelWidth / drawnWidthMm) * MM_PER_INCH : 0;
}

export type DpiRating = 'good' | 'ok' | 'low';

/**
 * Large-format thresholds: a wall is read from a metre or more away, so 150 ppi
 * is plenty and 100 still prints acceptably.
 */
export function rateDpi(dpi: number): DpiRating {
  if (dpi >= 150) return 'good';
  if (dpi >= 100) return 'ok';
  return 'low';
}

/* ------------------------------------------------------------ grid layout */

/**
 * Split an area into `count` cells: picks the column count whose cells come
 * closest to `targetAspect` (width / height). Cells run left-to-right,
 * top-to-bottom; a short last row is centred.
 */
export function gridCells(area: Rect, count: number, gutter: number, targetAspect: number): Rect[] {
  if (count <= 0 || area.w <= 0 || area.h <= 0) return [];
  let best = { cols: 1, rows: count, score: Infinity };
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const cw = (area.w - gutter * (cols - 1)) / cols;
    const ch = (area.h - gutter * (rows - 1)) / rows;
    if (cw <= 0 || ch <= 0) continue;
    const score = Math.abs(Math.log(cw / ch / targetAspect)) + (cols * rows - count) * 0.15;
    if (score < best.score) best = { cols, rows, score };
  }
  const { cols, rows } = best;
  const cw = (area.w - gutter * (cols - 1)) / cols;
  const ch = (area.h - gutter * (rows - 1)) / rows;
  const cells: Rect[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const inRow = row === rows - 1 ? count - cols * (rows - 1) : cols;
    const col = i % cols;
    const offset = ((cols - inRow) * (cw + gutter)) / 2;
    cells.push({
      x: area.x + offset + col * (cw + gutter),
      y: area.y + row * (ch + gutter),
      w: cw,
      h: ch,
    });
  }
  return cells;
}

/** Split `items` as evenly as possible into `buckets` consecutive groups. */
export function splitEvenly<T>(items: T[], buckets: number): T[][] {
  const out: T[][] = [];
  let start = 0;
  for (let b = 0; b < buckets; b++) {
    const size = Math.floor(items.length / buckets) + (b < items.length % buckets ? 1 : 0);
    out.push(items.slice(start, start + size));
    start += size;
  }
  return out;
}
