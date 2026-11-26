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

/** Something mounted on the wheel face that stickers must leave a hole for. */
export interface WheelKnob {
  /** Clockwise from 12 o'clock, degrees. */
  angleDeg: number;
  /** Centre of the knob from the wheel centre, mm. */
  rMm: number;
  /** Along the radius, mm. */
  lengthMm: number;
  /** Across the radius, mm. */
  widthMm: number;
  /** Extra room cut around it, mm. */
  clearanceMm: number;
}
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
  /** Separate stickers: gap kept inside each printed segment, mm. */
  insetMm: number;
  /** Hole cut in the sticker for the knob; null = no knob. */
  knob: WheelKnob | null;
  sheet: { widthMm: number; heightMm: number; gapMm: number; marginMm: number };
  /** Separate stickers: fill the last sheet's empty places with spare copies. */
  fillSheet: boolean;
  items: WheelSegment[];
}

/** Pantone 485C as specified for the wheel print. */
export const KODAK_RED = '#ed0000';
/** Pantone 11-4201 TPG Cloud Dancer. */
export const CLOUD_DANCER = '#f0eee9';
export const INK = '#121212';

const DEFAULT_SEGMENTS: WheelSegment[] = [
  { label: 'KODAK\nCAMERA', background: KODAK_RED, textColor: '#ffffff' },
  { label: 'TOTEBAG', background: CLOUD_DANCER, textColor: KODAK_RED },
];

/**
 * The tabletop wheel from Nine United's engineering drawing (21.10.2026):
 * Ø198 mm UV-printed acrylic disc, ten 36° segments with a boundary at
 * 12 o'clock and a Ø60 mm logo disc in the centre.
 */
export const NINE_UNITED_WHEEL = {
  segments: 10,
  outerMm: 198,
  hubMm: 60,
  startDeg: 18,
} as const;

/**
 * The 12 × 8.7 mm knob near the rim at about 3 o'clock on the same drawing.
 * Its exact position isn't confirmed, so stickers ignore it unless HQ turns
 * the knob hole on.
 */
export const NINE_UNITED_KNOB: WheelKnob = {
  angleDeg: 90,
  rMm: 83,
  lengthMm: 12,
  widthMm: 8.7,
  clearanceMm: 2,
};

/** A4 portrait: the sheet size for kiss-cut sticker sheets. */
export const A4_SHEET = { widthMm: 210, heightMm: 297, gapMm: 3, marginMm: 6 };

export function defaultWheel(): WheelDesign {
  return {
    version: 1,
    ...NINE_UNITED_WHEEL,
    knob: null,
    bleedMm: 2,
    dividerMm: 0,
    fontSizeMm: 5.5,
    textPosition: 0.42,
    orientation: 'radial',
    cutMode: 'segments',
    insetMm: 2,
    sheet: { ...A4_SHEET },
    fillSheet: true,
    items: resizeSegments([], NINE_UNITED_WHEEL.segments),
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

export function newPanel(name: string, widthMm = 630, heightMm = 1500): WallPanel {
  return { id: newId('p'), name, widthMm, heightMm, background: '#ffffff', holdsImages: true, frames: [] };
}

/**
 * Starting template: the hero wall's photo surface, 630 mm wide × 1500 mm high
 * (confirmed by Nicolaj 25.11.2026). Bleed stays at 5 mm until the printer says
 * otherwise; HQ can change everything on the template.
 */
export function defaultWallTemplate(): WallDesign {
  return {
    version: 1,
    name: 'Hero wall template',
    bleedMm: 5,
    marginMm: 30,
    gutterMm: 10,
    panels: [newPanel('Photo wall', 630, 1500)],
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
