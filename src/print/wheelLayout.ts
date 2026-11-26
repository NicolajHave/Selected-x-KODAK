/**
 * Shapes for the Spin & Win stickers, shared by the on-screen preview and the
 * PDF so the two can't drift apart. Millimetres, y down.
 */
import {
  circlePath,
  minDistance,
  pathPoints,
  offsetWedgePath,
  pathBounds,
  radialRectPath,
  sectorPath,
  segmentAngles,
  type PathCmd,
  type Rect,
} from './geometry';
import type { WheelDesign } from './designs';

export interface SegmentShape {
  index: number;
  /** Centre angle, radians, y-down. */
  center: number;
  /** Area to fill with colour (includes bleed). */
  print: PathCmd[];
  /** Where the plotter cuts (separate stickers only), including any knob hole. */
  cut: PathCmd[] | null;
  /** Artwork box in the segment's local frame (segment pointing up, centre at 0,0). */
  imageBox: Rect;
  /** Text anchor and the angle its baseline runs at (radians, y-down). */
  text: { x: number; y: number; angle: number };
}

/** Centre angles for stickers drawn on a sheet, pointing to 12 or 6 o'clock. */
export const UP = -Math.PI / 2;
export const DOWN = Math.PI / 2;
const rad = (d: number) => (d * Math.PI) / 180;

/** Printed area of one segment, centred on `center`. */
function printPath(d: WheelDesign, cx: number, cy: number, center: number, half: number): PathCmd[] {
  const r1 = d.hubMm / 2;
  const r2 = d.outerMm / 2;
  if (d.cutMode === 'segments') {
    return offsetWedgePath(cx, cy, r1, r2, center - half, center + half, d.bleedMm - d.insetMm);
  }
  return sectorPath(cx, cy, Math.max(0, r1 - d.bleedMm), r2 + d.bleedMm, center - half, center + half);
}

/** Index of the segment the knob sits on, or -1. */
export function knobSegment(d: WheelDesign): number {
  if (!d.knob) return -1;
  const span = 360 / d.segments;
  const fromFirstEdge = (((d.knob.angleDeg - d.startDeg + span / 2) % 360) + 360) % 360;
  return Math.floor(fromFirstEdge / span) % d.segments;
}

/**
 * The hole to cut for the knob, drawn for segment i at its place on the wheel
 * (drawAt = null) or turned with the sticker when it is drawn at another
 * angle. Null when the knob is not on this segment.
 */
export function knobHole(
  d: WheelDesign,
  i: number,
  cx: number,
  cy: number,
  drawAt: number | null,
): PathCmd[] | null {
  const k = d.knob;
  if (!k || knobSegment(d) !== i) return null;
  const { center } = segmentAngles(d, i);
  const angle = rad(-90 + k.angleDeg) + (drawAt === null ? 0 : drawAt - center);
  return radialRectPath(cx, cy, angle, k.rMm, k.lengthMm + 2 * k.clearanceMm, k.widthMm + 2 * k.clearanceMm);
}

/** The knob itself (no clearance), for the preview. */
export function knobOutline(d: WheelDesign, cx: number, cy: number): PathCmd[] | null {
  const k = d.knob;
  return k ? radialRectPath(cx, cy, rad(-90 + k.angleDeg), k.rMm, k.lengthMm, k.widthMm) : null;
}

/**
 * Segment i drawn around (cx, cy): at its place on the wheel (drawAt = null),
 * or as a separate sticker turned so its centre line points along drawAt
 * (UP / DOWN on a sheet).
 */
export function segmentShape(
  d: WheelDesign,
  i: number,
  cx: number,
  cy: number,
  drawAt: number | null,
): SegmentShape {
  const r1 = d.hubMm / 2;
  const r2 = d.outerMm / 2;
  const { center: wheelCenter, half } = segmentAngles(d, i);
  const center = drawAt ?? wheelCenter;
  const separate = d.cutMode === 'segments';
  const cut = separate
    ? [
        ...offsetWedgePath(cx, cy, r1, r2, center - half, center + half, -d.insetMm),
        ...(knobHole(d, i, cx, cy, drawAt) ?? []),
      ]
    : null;
  const tr = r1 + (r2 - r1) * d.textPosition;
  return {
    index: i,
    center,
    print: printPath(d, cx, cy, center, half),
    cut,
    imageBox: pathBounds(printPath(d, 0, 0, UP, half)),
    text: {
      x: cx + tr * Math.cos(center),
      y: cy + tr * Math.sin(center),
      angle: d.orientation === 'radial' ? center : center + Math.PI / 2,
    },
  };
}

/** Whole-disc cut lines: the rim, the hub hole if there is one, and the knob hole. */
export function discCut(d: WheelDesign, cx: number, cy: number): PathCmd[] {
  const out = circlePath(cx, cy, d.outerMm / 2);
  if (d.hubMm > 0) out.push(...circlePath(cx, cy, d.hubMm / 2));
  const k = knobSegment(d);
  if (k >= 0) out.push(...(knobHole(d, k, cx, cy, null) ?? []));
  return out;
}

/** Printed dividing lines between segments (whole disc). */
export function dividerLines(d: WheelDesign, cx: number, cy: number): PathCmd[] {
  if (d.dividerMm <= 0) return [];
  const r1 = d.hubMm / 2;
  const r2 = d.outerMm / 2 + d.bleedMm;
  const out: PathCmd[] = [];
  for (let i = 0; i < d.segments; i++) {
    const { center, half } = segmentAngles(d, i);
    const a = center - half;
    out.push({ op: 'M', x: cx + r1 * Math.cos(a), y: cy + r1 * Math.sin(a) });
    out.push({ op: 'L', x: cx + r2 * Math.cos(a), y: cy + r2 * Math.sin(a) });
  }
  return out;
}

export interface SheetSlot {
  page: number;
  /** Which segment's sticker goes here (spares repeat the segments in order). */
  segment: number;
  /** Wheel centre to draw the sticker around, sheet mm. */
  cx: number;
  cy: number;
  /** Direction the sticker points: UP or DOWN. */
  angle: number;
}

/** Bounding box of one sticker including bleed, around a wheel centre at 0,0. */
export function stickerBounds(d: WheelDesign, angle = UP): Rect {
  return pathBounds(printPath(d, 0, 0, angle, Math.PI / d.segments));
}

/**
 * How far apart (centre to centre) an UP and a DOWN sticker must sit side by
 * side in a row so their printed areas keep `gap` mm apart.
 */
export function nestedPitch(d: WheelDesign): number {
  const half = Math.PI / d.segments;
  const up = pathPoints(printPath(d, 0, 0, UP, half), 0.5);
  const b = stickerBounds(d, UP);
  /* A DOWN sticker sharing the row band: mirror of UP in that band. */
  const downDy = 2 * b.y + b.h;
  const down = pathPoints(printPath(d, 0, downDy, DOWN, half), 0.5);
  const gap = d.sheet.gapMm;
  let lo = 0;
  let hi = b.w + gap;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    const shifted = down.map((p) => ({ x: p.x + mid, y: p.y }));
    if (minDistance(up, shifted) >= gap) hi = mid;
    else lo = mid;
  }
  return hi;
}

/**
 * Where each separate sticker goes on the sheets. Rows alternate stickers
 * pointing up and down so they nest — or a plain grid, whichever fits more —
 * and the block is centred on the sheet.
 */
export function sheetLayout(d: WheelDesign): { slots: SheetSlot[]; perPage: number; cell: Rect } {
  const b = stickerBounds(d, UP);
  const { widthMm: W, heightMm: H, gapMm: g, marginMm: m } = d.sheet;
  const usableW = W - 2 * m;
  const usableH = H - 2 * m;
  const rows = Math.max(0, Math.floor((usableH + g) / (b.h + g)));

  const gridCols = Math.max(0, Math.floor((usableW + g) / (b.w + g)));
  const pitch = nestedPitch(d);
  const nestCols = b.w <= usableW ? 1 + Math.floor((usableW - b.w) / pitch) : 0;
  const nested = nestCols * rows > gridCols * rows;
  const cols = nested ? nestCols : gridCols;
  const step = nested ? pitch : b.w + g;
  const perPage = cols * rows;
  if (!perPage) return { slots: [], perPage: 0, cell: b };

  const blockW = b.w + (cols - 1) * step;
  const blockH = rows * b.h + (rows - 1) * g;
  const x0 = (W - blockW) / 2;
  const y0 = (H - blockH) / 2;
  const count = d.fillSheet ? Math.ceil(d.segments / perPage) * perPage : d.segments;
  const slots: SheetSlot[] = [];
  for (let i = 0; i < count; i++) {
    const k = i % perPage;
    const col = k % cols;
    const row = Math.floor(k / cols);
    const left = x0 + col * step;
    const top = y0 + row * (b.h + g);
    const down = nested && col % 2 === 1;
    slots.push({
      page: Math.floor(i / perPage),
      segment: i % d.segments,
      cx: left - b.x,
      /* A DOWN sticker is the UP one mirrored within the same row band. */
      cy: down ? top + b.y + b.h : top - b.y,
      angle: down ? DOWN : UP,
    });
  }
  return { slots, perPage, cell: b };
}
