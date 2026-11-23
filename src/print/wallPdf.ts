/**
 * Print-ready PDFs for the hero wall artwork.
 *
 * Print file: one page per panel at 1:1, trim = panel size, with bleed, crop
 * marks and a slug note. Photos are embedded byte-for-byte (no recompression),
 * clipped to their frames; frames touching the panel edge run into the bleed.
 *
 * Proof: A3 landscape, one page per wall, panels side by side, for sign-off.
 */
import type { PDFDocument, PDFImage } from 'pdf-lib';
import {
  PT_PER_MM,
  coverPlacement,
  effectiveDpi,
  rateDpi,
  rectPath,
  type DpiRating,
  type Rect,
} from './geometry';
import { frameWithBleed, type WallDesign, type WallFrame, type WallPanel } from './designs';
import {
  addSheet,
  createPrintDoc,
  cropMarks,
  drawImageAt,
  embedImage,
  fillPath,
  strokePath,
  withClip,
  type FontBytes,
  type Sheet,
} from './pdfKit';

export interface ResolvedImage {
  bytes: Uint8Array;
  width: number;
  height: number;
  /** 'original' = full-resolution file loaded by HQ, 'library' = the 1600 px portal copy. */
  source: 'original' | 'library';
}

export type ImageResolver = (imageId: string) => Promise<ResolvedImage | null>;

export interface FrameCheck {
  panel: string;
  frame: number;
  imageId: string | null;
  source: ResolvedImage['source'] | 'missing' | 'empty';
  pixels?: string;
  dpi?: number;
  rating?: DpiRating;
}

/** Effective resolution of every frame — the same numbers the print file uses. */
export function frameDpi(frame: WallFrame, panel: WallPanel, bleed: number, px: number, py: number): number {
  const rect = frameWithBleed(frame, panel, bleed);
  return effectiveDpi(px, coverPlacement(rect, px, py, frame).w);
}

class ImageCache {
  private embedded = new Map<string, { img: PDFImage; info: ResolvedImage } | null>();
  constructor(
    private doc: PDFDocument,
    private resolve: ImageResolver,
  ) {}
  async get(id: string) {
    if (!this.embedded.has(id)) {
      const info = await this.resolve(id);
      this.embedded.set(id, info ? { img: await embedImage(this.doc, info.bytes), info } : null);
    }
    return this.embedded.get(id) ?? null;
  }
}

function drawPanelContent(
  s: Sheet,
  panel: WallPanel,
  bleed: number,
  placed: { frame: WallFrame; img: PDFImage; info: ResolvedImage }[],
) {
  fillPath(
    s,
    rectPath({ x: -bleed, y: -bleed, w: panel.widthMm + 2 * bleed, h: panel.heightMm + 2 * bleed }),
    panel.background,
  );
  for (const { frame, img, info } of placed) {
    const rect = frameWithBleed(frame, panel, bleed);
    const at = coverPlacement(rect, info.width, info.height, frame);
    withClip(s, rectPath(rect), () => drawImageAt(s, img, at));
  }
}

export async function buildWallPrintPdf(
  design: WallDesign,
  resolve: ImageResolver,
  fontBytes: FontBytes,
): Promise<{ bytes: Uint8Array; checks: FrameCheck[] }> {
  const { doc, fonts } = await createPrintDoc(fontBytes, `${design.name} · hero wall print file`);
  const cache = new ImageCache(doc, resolve);
  const checks: FrameCheck[] = [];
  const stamp = new Date().toISOString().slice(0, 10);
  for (const panel of design.panels) {
    const s = addSheet(doc, panel.widthMm, panel.heightMm, design.bleedMm, 12);
    const placed = [];
    for (const [n, frame] of panel.frames.entries()) {
      if (!frame.imageId) {
        checks.push({ panel: panel.name, frame: n + 1, imageId: null, source: 'empty' });
        continue;
      }
      const hit = await cache.get(frame.imageId);
      if (!hit) {
        checks.push({ panel: panel.name, frame: n + 1, imageId: frame.imageId, source: 'missing' });
        continue;
      }
      placed.push({ frame, ...hit });
      const dpi = frameDpi(frame, panel, design.bleedMm, hit.info.width, hit.info.height);
      checks.push({
        panel: panel.name,
        frame: n + 1,
        imageId: frame.imageId,
        source: hit.info.source,
        pixels: `${hit.info.width}×${hit.info.height}`,
        dpi: Math.round(dpi),
        rating: rateDpi(dpi),
      });
    }
    drawPanelContent(s, panel, design.bleedMm, placed);
    cropMarks(
      s,
      `${design.name} · ${panel.name} · trim ${panel.widthMm} × ${panel.heightMm} mm · bleed ${design.bleedMm} mm · scale 1:1 · ${stamp}`,
      fonts,
    );
  }
  return { bytes: await doc.save(), checks };
}

/* ------------------------------------------------------------------ proof */

const A3 = { w: 420, h: 297 };

export async function buildWallProofPdf(
  designs: WallDesign[],
  resolve: ImageResolver,
  fontBytes: FontBytes,
  subtitle: (d: WallDesign) => string,
): Promise<Uint8Array> {
  const { doc, fonts } = await createPrintDoc(fontBytes, 'Hero wall proofs');
  const cache = new ImageCache(doc, resolve);
  const stamp = new Date().toISOString().slice(0, 10);
  for (const design of designs) {
    const s = addSheet(doc, A3.w, A3.h, 0, 0);
    s.page.drawText(design.name, { x: s.x(15), y: s.y(22), size: 18, font: fonts.bold });
    s.page.drawText(`${subtitle(design)} · proof ${stamp} · not to scale`, {
      x: s.x(15),
      y: s.y(29),
      size: 8,
      font: fonts.regular,
    });
    const area: Rect = { x: 15, y: 40, w: A3.w - 30, h: A3.h - 62 };
    const gap = 10;
    const totalW = design.panels.reduce((a, p) => a + p.widthMm, 0);
    const maxH = Math.max(...design.panels.map((p) => p.heightMm));
    const scale = Math.min((area.w - gap * (design.panels.length - 1)) / totalW, area.h / maxH);
    let x = area.x + (area.w - (totalW * scale + gap * (design.panels.length - 1))) / 2;
    for (const panel of design.panels) {
      const ox = x;
      const oy = area.y + (area.h - panel.heightMm * scale) / 2;
      const scaled: Sheet = {
        ...s,
        x: (mm) => s.x(ox + mm * scale),
        y: (mm) => s.y(oy + mm * scale),
      };
      const placed = [];
      for (const frame of panel.frames) {
        const hit = frame.imageId ? await cache.get(frame.imageId) : null;
        if (hit) placed.push({ frame, ...hit });
      }
      drawProofPanel(scaled, panel, placed, scale);
      s.page.drawText(`${panel.name} · ${panel.widthMm} × ${panel.heightMm} mm`, {
        x: s.x(ox),
        y: s.y(oy + panel.heightMm * scale + 6),
        size: 7,
        font: fonts.regular,
      });
      x += panel.widthMm * scale + gap;
    }
  }
  return doc.save();
}

function drawProofPanel(
  s: Sheet,
  panel: WallPanel,
  placed: { frame: WallFrame; img: PDFImage; info: ResolvedImage }[],
  scale: number,
) {
  const trim = rectPath({ x: 0, y: 0, w: panel.widthMm, h: panel.heightMm });
  fillPath(s, trim, panel.background);
  for (const { frame, img, info } of placed) {
    const rect = { x: frame.xMm, y: frame.yMm, w: frame.wMm, h: frame.hMm };
    const at = coverPlacement(rect, info.width, info.height, frame);
    withClip(s, rectPath(rect), () =>
      s.page.drawImage(img, {
        x: s.x(at.x),
        y: s.y(at.y + at.h),
        width: at.w * scale * PT_PER_MM,
        height: at.h * scale * PT_PER_MM,
      }),
    );
  }
  /* Empty frames show as red outlines so a missing photo can't slip through sign-off. */
  for (const frame of panel.frames.filter((f) => !f.imageId)) {
    strokePath(s, rectPath({ x: frame.xMm, y: frame.yMm, w: frame.wMm, h: frame.hMm }), '#d92f1f', 0.4);
  }
  strokePath(s, trim, '#88847b', 0.25);
}
