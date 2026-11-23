/**
 * Shapes for the Spin & Win stickers, shared by the on-screen preview and the
 * PDF so the two can't drift apart. Millimetres, y down.
 */
import {
  circlePath,
  sectorBounds,
  sectorPath,
  segmentAngles,
  wedgeBleedAngle,
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
  /** Where the plotter cuts (separate wedges only). */
  cut: PathCmd[] | null;
  /** Artwork box in the segment's local frame (segment pointing up, centre at 0,0). */
  imageBox: Rect;
  /** Text anchor and the angle its baseline runs at (radians, y-down). */
  text: { x: number; y: number; angle: number };
}

const UP = -Math.PI / 2;

/**
 * Segment i drawn around (cx, cy). `pointUp` draws it as a separate wedge
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
  const b = d.bleedMm;
  const { center: wheelCenter, half } = segmentAngles(d, i);
  const center = pointUp ? UP : wheelCenter;
  const separate = d.cutMode === 'segments';
  const widen = separate ? wedgeBleedAngle(d, b) : 0;
  const pr1 = Math.max(0, r1 - b);
  const pr2 = r2 + b;
  const print = sectorPath(cx, cy, pr1, pr2, center - half - widen, center + half + widen);
  const cut = separate ? sectorPath(cx, cy, r1, r2, center - half, center + half) : null;
  const imageBox = sectorBounds(0, 0, pr1, pr2, UP - half - widen, UP + half + widen);
  const tr = r1 + (r2 - r1) * d.textPosition;
  return {
    index: i,
    center,
    print,
    cut,
    imageBox,
    text: {
      x: cx + tr * Math.cos(center),
      y: cy + tr * Math.sin(center),
      angle: d.orientation === 'radial' ? center : center + Math.PI / 2,
    },
  };
}

/** Whole-disc cut lines: the rim and, if there is one, the hub hole. */
export function discCut(d: WheelDesign, cx: number, cy: number): PathCmd[] {
  const out = circlePath(cx, cy, d.outerMm / 2);
  if (d.hubMm > 0) out.push(...circlePath(cx, cy, d.hubMm / 2));
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
  /** Wheel centre to draw the upright wedge around, sheet mm. */
  cx: number;
  cy: number;
}

/** Where each separate wedge goes on the sticker sheets. */
export function sheetLayout(d: WheelDesign): { slots: SheetSlot[]; perPage: number; cell: Rect } {
  const bounds = sectorBoundsOf(d);
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

/** Bounding box of one upright wedge including bleed, around a wheel centre at 0,0. */
export function sectorBoundsOf(d: WheelDesign): Rect {
  const r1 = d.hubMm / 2;
  const r2 = d.outerMm / 2;
  const b = d.bleedMm;
  const half = Math.PI / d.segments;
  const widen = d.cutMode === 'segments' ? wedgeBleedAngle(d, b) : 0;
  return sectorBounds(0, 0, Math.max(0, r1 - b), r2 + b, UP - half - widen, UP + half + widen);
}
