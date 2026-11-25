/**
 * Shapes for the Spin & Win stickers, shared by the on-screen preview and the
 * PDF so the two can't drift apart. Millimetres, y down.
 */
import {
  circlePath,
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

const UP = -Math.PI / 2;
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
 * The hole to cut for the knob, drawn for segment i at its position (or
 * rotated with it when the segment is drawn pointing up). Null when the knob
 * is not on this segment.
 */
export function knobHole(
  d: WheelDesign,
  i: number,
  cx: number,
  cy: number,
  pointUp: boolean,
): PathCmd[] | null {
  const k = d.knob;
  if (!k || knobSegment(d) !== i) return null;
  const { center } = segmentAngles(d, i);
  const angle = rad(-90 + k.angleDeg) + (pointUp ? UP - center : 0);
  return radialRectPath(cx, cy, angle, k.rMm, k.lengthMm + 2 * k.clearanceMm, k.widthMm + 2 * k.clearanceMm);
}

/** The knob itself (no clearance), for the preview. */
export function knobOutline(d: WheelDesign, cx: number, cy: number): PathCmd[] | null {
  const k = d.knob;
  return k ? radialRectPath(cx, cy, rad(-90 + k.angleDeg), k.rMm, k.lengthMm, k.widthMm) : null;
}

/**
 * Segment i drawn around (cx, cy). `pointUp` draws it as a separate sticker
 * pointing to 12 o'clock (sheet layout) instead of at its place on the wheel.
 */
export function segmentShape(
  d: WheelDesign,
  i: number,
  cx: number,
  cy: number,
  pointUp: boolean,
): SegmentShape {
  const r1 = d.hubMm / 2;
  const r2 = d.outerMm / 2;
  const { center: wheelCenter, half } = segmentAngles(d, i);
  const center = pointUp ? UP : wheelCenter;
  const separate = d.cutMode === 'segments';
  const cut = separate
    ? [
        ...offsetWedgePath(cx, cy, r1, r2, center - half, center + half, -d.insetMm),
        ...(knobHole(d, i, cx, cy, pointUp) ?? []),
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
  if (k >= 0) out.push(...(knobHole(d, k, cx, cy, false) ?? []));
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
  /** Wheel centre to draw the upright sticker around, sheet mm. */
  cx: number;
  cy: number;
}

/** Bounding box of one upright sticker including bleed, around a wheel centre at 0,0. */
export function stickerBounds(d: WheelDesign): Rect {
  return pathBounds(printPath(d, 0, 0, UP, Math.PI / d.segments));
}

/** Where each separate sticker goes on the sheets. */
export function sheetLayout(d: WheelDesign): { slots: SheetSlot[]; perPage: number; cell: Rect } {
  const bounds = stickerBounds(d);
  const { widthMm: W, heightMm: H, gapMm: g, marginMm: m } = d.sheet;
  const cols = Math.max(0, Math.floor((W - 2 * m + g) / (bounds.w + g)));
  const rows = Math.max(0, Math.floor((H - 2 * m + g) / (bounds.h + g)));
  const perPage = cols * rows;
  if (!perPage) return { slots: [], perPage: 0, cell: bounds };
  const slots: SheetSlot[] = [];
  for (let i = 0; i < d.segments; i++) {
    const k = i % perPage;
    const col = k % cols;
    const row = Math.floor(k / cols);
    const x = m + col * (bounds.w + g);
    const y = m + row * (bounds.h + g);
    slots.push({ page: Math.floor(i / perPage), cx: x - bounds.x, cy: y - bounds.y });
  }
  return { slots, perPage, cell: bounds };
}
