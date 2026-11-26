/**
 * Print-ready PDF for the Spin & Win stickers.
 *
 * - "whole": one round sticker per wheel, trimmed to the outer diameter, with
 *   the hub cut out. Crop marks + a CutContour path around rim and hub.
 * - "segments": one wedge sticker per segment, laid out on sheets, each with
 *   its own CutContour path.
 */
import type { PDFImage } from 'pdf-lib';
import { coverPlacement } from './geometry';
import type { WheelDesign } from './designs';
import {
  addSheet,
  createPrintDoc,
  cropMarks,
  cutContour,
  dataUrlBytes,
  drawImageLocal,
  drawTextBlockLocal,
  embedImage,
  fillPath,
  strokePath,
  withClip,
  withTransform,
  type FontBytes,
  type Fonts,
  type Sheet,
} from './pdfKit';
import { discCut, dividerLines, segmentShape, sheetLayout } from './wheelLayout';

const SLUG = 10;

/**
 * Which layers go in the file:
 * - 'both': artwork + CutContour — the printer prints and kiss-cuts.
 * - 'cut': CutContour only — the printer kiss-cuts blank stickers.
 * - 'print': artwork only, same positions — stores print it at 100 % on the
 *   blank pre-cut sheets (no cut lines, which an office printer would print).
 */
export type WheelLayers = 'both' | 'cut' | 'print';

const LAYER_NOTE: Record<WheelLayers, string> = {
  both: 'print + kiss-cut path (CutContour)',
  cut: 'kiss-cut path only (CutContour), no print — blank stickers',
  print: 'print only, no cut path — print at 100 % on the pre-cut blank sheets',
};

export async function buildWheelPdf(
  d: WheelDesign,
  fontBytes: FontBytes,
  layers: WheelLayers = 'both',
): Promise<Uint8Array> {
  const { doc, fonts } = await createPrintDoc(fontBytes, `Spin & Win stickers · ${d.segments} segments`);
  const withArt = layers !== 'cut';
  const withCut = layers !== 'print';
  const art = new Map<string, PDFImage>();
  for (const it of d.items) {
    if (it.imageDataUrl && !art.has(it.imageDataUrl)) {
      art.set(it.imageDataUrl, await embedImage(doc, dataUrlBytes(it.imageDataUrl)));
    }
  }
  const stamp = new Date().toISOString().slice(0, 10);
  const spec = `Ø ${d.outerMm} mm · hub Ø ${d.hubMm} mm · ${d.segments} segments · bleed ${d.bleedMm} mm`;

  if (d.cutMode === 'whole') {
    const s = addSheet(doc, d.outerMm, d.outerMm, d.bleedMm, SLUG);
    const c = d.outerMm / 2;
    if (withArt) {
      for (let i = 0; i < d.segments; i++) drawSegment(s, d, i, c, c, null, fonts, art);
      const dividers = dividerLines(d, c, c);
      if (dividers.length) strokePath(s, dividers, '#ffffff', d.dividerMm);
    }
    if (withCut) cutContour(s, discCut(d, c, c));
    cropMarks(s, `Selected × Kodak · Spin & Win sticker · ${spec} · ${LAYER_NOTE[layers]} · ${stamp}`, fonts);
  } else {
    const { slots, perPage } = sheetLayout(d);
    if (!perPage)
      throw new Error('A segment does not fit on the sheet — use a bigger sheet or a smaller margin.');
    const pages = Math.ceil(d.segments / perPage);
    const sheets: Sheet[] = [];
    /* Nothing but the stickers goes on the sheet — the spec lives in the
       PDF's metadata, so no text ends up printed on the backing paper. */
    doc.setSubject(
      `Sticker sheet, ${d.sheet.widthMm} × ${d.sheet.heightMm} mm · ${spec} · ` +
        `inset ${d.insetMm} mm · ${LAYER_NOTE[layers]} · ${stamp}`,
    );
    for (let p = 0; p < pages; p++) sheets.push(addSheet(doc, d.sheet.widthMm, d.sheet.heightMm, 0, 0));
    for (const slot of slots) {
      const s = sheets[slot.page];
      if (withArt) drawSegment(s, d, slot.segment, slot.cx, slot.cy, slot.angle, fonts, art);
      if (withCut) cutContour(s, segmentShape(d, slot.segment, slot.cx, slot.cy, slot.angle).cut!);
    }
  }
  return doc.save();
}

function drawSegment(
  s: Sheet,
  d: WheelDesign,
  i: number,
  cx: number,
  cy: number,
  drawAt: number | null,
  fonts: Fonts,
  art: Map<string, PDFImage>,
) {
  const seg = d.items[i % d.items.length];
  const shape = segmentShape(d, i, cx, cy, drawAt);
  fillPath(s, shape.print, seg.background);
  const img = seg.imageDataUrl ? art.get(seg.imageDataUrl) : undefined;
  if (img) {
    withClip(s, shape.print, () => {
      withTransform(s, { x: cx, y: cy }, shape.center + Math.PI / 2, () => {
        drawImageLocal(
          s,
          img,
          coverPlacement(shape.imageBox, img.width, img.height, { zoom: 1, focusX: 0.5, focusY: 0.5 }),
        );
      });
    });
  }
  const lines = seg.label
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length) {
    withTransform(s, shape.text, shape.text.angle, () =>
      drawTextBlockLocal(s, lines, fonts.bold, d.fontSizeMm, seg.textColor),
    );
  }
}
