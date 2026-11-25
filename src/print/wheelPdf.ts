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

export async function buildWheelPdf(d: WheelDesign, fontBytes: FontBytes): Promise<Uint8Array> {
  const { doc, fonts } = await createPrintDoc(fontBytes, `Spin & Win stickers · ${d.segments} segments`);
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
    for (let i = 0; i < d.segments; i++) drawSegment(s, d, i, c, c, false, fonts, art);
    const dividers = dividerLines(d, c, c);
    if (dividers.length) strokePath(s, dividers, '#ffffff', d.dividerMm);
    cutContour(s, discCut(d, c, c));
    cropMarks(s, `Selected × Kodak · Spin & Win sticker · ${spec} · cut path: CutContour · ${stamp}`, fonts);
  } else {
    const { slots, perPage } = sheetLayout(d);
    if (!perPage)
      throw new Error('A segment does not fit on the sheet — use a bigger sheet or a smaller margin.');
    const pages = Math.ceil(d.segments / perPage);
    const sheets: Sheet[] = [];
    for (let p = 0; p < pages; p++) {
      const s = addSheet(doc, d.sheet.widthMm, d.sheet.heightMm, 0, 0);
      s.page.drawText(
        `Selected × Kodak · Spin & Win wedge stickers · ${spec} · sheet ${p + 1}/${pages} · cut path: CutContour · ${stamp}`,
        { x: s.x(d.sheet.marginMm), y: s.y(d.sheet.marginMm / 2) - 2, size: 6.5, font: fonts.regular },
      );
      sheets.push(s);
    }
    slots.forEach((slot, i) => {
      const s = sheets[slot.page];
      drawSegment(s, d, i, slot.cx, slot.cy, true, fonts, art);
      cutContour(s, segmentShape(d, i, slot.cx, slot.cy, true).cut!);
    });
  }
  return doc.save();
}

function drawSegment(
  s: Sheet,
  d: WheelDesign,
  i: number,
  cx: number,
  cy: number,
  pointUp: boolean,
  fonts: Fonts,
  art: Map<string, PDFImage>,
) {
  const seg = d.items[i % d.items.length];
  const shape = segmentShape(d, i, cx, cy, pointUp);
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
