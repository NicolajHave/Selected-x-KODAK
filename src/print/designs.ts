/**
 * Design documents for the two print tools. They are plain JSON so they can be
 * stored as-is in `kodak_print_designs` and survive app updates; `normalize*`
 * fills anything an older saved copy is missing.
 */
import { gridCells, splitEvenly, type Rect } from './geometry';

/* ------------------------------------------------------------------ wheel */

export interface WheelSegment {
  /** Prize text. A line break starts a new line. */
  label: string;
  background: string;
  textColor: string;
  /** Optional artwork, stored downscaled as a data URL. */
  imageDataUrl?: string;
}

export type CutMode = 'whole' | 'segments';
export type TextOrientation = 'radial' | 'tangential';

export interface WheelDesign {
  version: 1;
  segments: number;
  outerMm: number;
  hubMm: number;
  startDeg: number;
  bleedMm: number;
  /** Printed white line between segments (whole-disc mode only), mm. */
  dividerMm: number;
  fontSizeMm: number;
  /** Where the text sits between hub (0) and rim (1). */
  textPosition: number;
  orientation: TextOrientation;
  cutMode: CutMode;
  sheet: { widthMm: number; heightMm: number; gapMm: number; marginMm: number };
  items: WheelSegment[];
}

export const KODAK_RED = '#d92f1f';
export const KODAK_YELLOW = '#f5b700';
export const INK = '#121212';

const DEFAULT_SEGMENTS: WheelSegment[] = [
  { label: 'KODAK\nCAMERA', background: KODAK_RED, textColor: '#ffffff' },
  { label: 'TOTEBAG', background: KODAK_YELLOW, textColor: INK },
];

export function defaultWheel(): WheelDesign {
  return {
    version: 1,
    segments: 12,
    outerMm: 200,
    hubMm: 50,
    startDeg: 0,
    bleedMm: 2,
    dividerMm: 0,
    fontSizeMm: 6,
    textPosition: 0.55,
    orientation: 'radial',
    cutMode: 'whole',
    sheet: { widthMm: 420, heightMm: 297, gapMm: 4, marginMm: 10 },
    items: resizeSegments([], 12),
  };
}

/** Grow or shrink the segment list; new segments repeat the existing pattern. */
export function resizeSegments(items: WheelSegment[], count: number): WheelSegment[] {
  const source = items.length ? items : DEFAULT_SEGMENTS;
  const out = items.slice(0, count);
  for (let i = out.length; i < count; i++) out.push({ ...source[i % source.length] });
  return out;
}

export function normalizeWheel(raw: unknown): WheelDesign {
  const d = { ...defaultWheel(), ...(raw as Partial<WheelDesign>) };
  d.sheet = { ...defaultWheel().sheet, ...(d.sheet ?? {}) };
  d.segments = Math.min(48, Math.max(2, Math.round(d.segments)));
  d.items = resizeSegments(Array.isArray(d.items) ? d.items : [], d.segments);
  return d;
}

/* ------------------------------------------------------------------- wall */

export interface WallFrame {
  id: string;
  xMm: number;
  yMm: number;
  wMm: number;
  hMm: number;
  /** Campaign library file name, or null for an empty slot. */
  imageId: string | null;
  zoom: number;
  focusX: number;
  focusY: number;
}

export interface WallPanel {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  background: string;
  /** Whether "Distribute images" may place photos on this panel. */
  holdsImages: boolean;
  frames: WallFrame[];
}

export interface WallDesign {
  version: 1;
  name: string;
  /** Booking the wall belongs to; absent for the template and custom walls. */
  bookingId?: string;
  bleedMm: number;
  /** Margin and gutter used by "Distribute images", mm. */
  marginMm: number;
  gutterMm: number;
  panels: WallPanel[];
}

let seq = 0;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export function newPanel(name: string, widthMm = 1000, heightMm = 2000): WallPanel {
  return { id: newId('p'), name, widthMm, heightMm, background: '#ffffff', holdsImages: true, frames: [] };
}

/**
 * Starting template. The panel sizes are placeholders until BuskMogensen
 * confirms the real print sizes — HQ edits them once on the template.
 */
export function defaultWallTemplate(): WallDesign {
  return {
    version: 1,
    name: 'Hero wall template',
    bleedMm: 5,
    marginMm: 60,
    gutterMm: 20,
    panels: [newPanel('Panel 1 · left'), newPanel('Panel 2 · centre'), newPanel('Panel 3 · right')],
  };
}

export function normalizeWall(raw: unknown, fallbackName: string): WallDesign {
  const base = defaultWallTemplate();
  const d = { ...base, ...(raw as Partial<WallDesign>) };
  d.name = d.name || fallbackName;
  d.panels = (Array.isArray(d.panels) && d.panels.length ? d.panels : base.panels).map((p) => ({
    ...newPanel(p.name ?? 'Panel'),
    ...p,
    frames: (p.frames ?? []).map((f) => ({ zoom: 1, focusX: 0.5, focusY: 0.5, imageId: null, ...f })),
  }));
  return d;
}

/** A booking's wall, starting from the template's panels and their empty frames. */
export function wallFromTemplate(
  template: WallDesign,
  name: string,
  bookingId: string | undefined,
  images: string[],
): WallDesign {
  const copy: WallDesign = JSON.parse(JSON.stringify(template));
  copy.name = name;
  copy.bookingId = bookingId;
  copy.panels = copy.panels.map((p) => ({
    ...p,
    id: newId('p'),
    frames: p.frames.map((f) => ({ ...f, id: newId('f'), imageId: null })),
  }));
  const slots = copy.panels.flatMap((p) => p.frames);
  if (slots.length) {
    slots.forEach((f, i) => (f.imageId = images[i] ?? null));
    return copy;
  }
  return distributeImages(copy, images);
}

/** Portrait-leaning cells suit the campaign shots (mostly ~4:5). */
const CELL_ASPECT = 0.8;

/**
 * Lay the images out in an even grid across the panels that hold images,
 * replacing their frames. Panels that don't hold images are left alone.
 * Pass nulls to make empty slots (the template).
 */
export function distributeImages(design: WallDesign, images: (string | null)[]): WallDesign {
  const targets = design.panels.filter((p) => p.holdsImages);
  if (!targets.length) return design;
  const groups = splitEvenly(images, targets.length);
  const byPanel = new Map(targets.map((p, i) => [p.id, groups[i]]));
  return {
    ...design,
    panels: design.panels.map((p) => {
      const group = byPanel.get(p.id);
      if (!group) return p;
      const area: Rect = {
        x: design.marginMm,
        y: design.marginMm,
        w: p.widthMm - 2 * design.marginMm,
        h: p.heightMm - 2 * design.marginMm,
      };
      const cells = gridCells(area, group.length, design.gutterMm, CELL_ASPECT);
      return {
        ...p,
        frames: cells.map((c, i) => ({
          id: newId('f'),
          xMm: round(c.x),
          yMm: round(c.y),
          wMm: round(c.w),
          hMm: round(c.h),
          imageId: group[i] ?? null,
          zoom: 1,
          focusX: 0.5,
          focusY: 0.5,
        })),
      };
    }),
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

/**
 * Frame rectangle with bleed added on every side that touches the panel edge,
 * so full-bleed photos run past the trim.
 */
export function frameWithBleed(f: WallFrame, panel: WallPanel, bleed: number): Rect {
  const eps = 0.05;
  const left = f.xMm <= eps ? bleed : 0;
  const top = f.yMm <= eps ? bleed : 0;
  const right = f.xMm + f.wMm >= panel.widthMm - eps ? bleed : 0;
  const bottom = f.yMm + f.hMm >= panel.heightMm - eps ? bleed : 0;
  return { x: f.xMm - left, y: f.yMm - top, w: f.wMm + left + right, h: f.hMm + top + bottom };
}
