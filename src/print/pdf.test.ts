import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PDFDict, PDFDocument, PDFName } from 'pdf-lib';
import { PT_PER_MM, minDistance, pathPoints, pathBounds } from './geometry';
import { NINE_UNITED_KNOB, defaultWallTemplate, defaultWheel, distributeImages } from './designs';
import { buildWheelPdf } from './wheelPdf';
import { buildWallPrintPdf, buildWallProofPdf } from './wallPdf';
import { DOWN, UP, knobSegment, segmentShape, sheetLayout } from './wheelLayout';

const root = resolve(__dirname, '..');
const fonts = {
  regular: new Uint8Array(readFileSync(resolve(root, 'assets/fonts/Inter-400.ttf'))),
  bold: new Uint8Array(readFileSync(resolve(root, 'assets/fonts/Inter-700.ttf'))),
};
const photo = new Uint8Array(readFileSync(resolve(root, 'assets/campaign-images/16103927_01.jpg')));
const resolver = async () => ({ bytes: photo, width: 1326, height: 1600, source: 'library' as const });

const mm = (pt: number) => pt / PT_PER_MM;

function hasCutContour(doc: PDFDocument, pageIndex: number) {
  const res = doc.getPage(pageIndex).node.Resources()!;
  const cs = res.lookupMaybe(PDFName.of('ColorSpace'), PDFDict);
  return Boolean(cs?.has(PDFName.of('CutContour')));
}

describe('wheel sticker PDF', () => {
  it('makes one round sticker with trim = outer diameter and a CutContour path', async () => {
    const d = { ...defaultWheel(), cutMode: 'whole' as const, outerMm: 190, hubMm: 40, bleedMm: 2 };
    const doc = await PDFDocument.load(await buildWheelPdf(d, fonts));
    expect(doc.getPageCount()).toBe(1);
    const trim = doc.getPage(0).getTrimBox();
    expect(mm(trim.width)).toBeCloseTo(190, 1);
    expect(mm(trim.height)).toBeCloseTo(190, 1);
    const bleed = doc.getPage(0).getBleedBox();
    expect(mm(bleed.width)).toBeCloseTo(194, 1);
    expect(hasCutContour(doc, 0)).toBe(true);
  });

  it('fits a full set of the 10 wheel stickers on one A4 kiss-cut sheet', async () => {
    const d = defaultWheel();
    const { slots, perPage } = sheetLayout(d);
    expect(perPage).toBeGreaterThanOrEqual(10);
    expect(new Set(slots.map((s) => s.angle))).toEqual(new Set([UP, DOWN])); // nested up/down

    expect(slots).toHaveLength(perPage); // the rest of the sheet holds spares
    expect(slots.slice(0, 10).map((s) => s.segment)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const shapes = slots.map((s) => segmentShape(d, s.segment, s.cx, s.cy, s.angle));
    for (const sh of shapes) {
      const b = pathBounds(sh.print);
      expect(b.x).toBeGreaterThanOrEqual(d.sheet.marginMm - 0.5);
      expect(b.y).toBeGreaterThanOrEqual(d.sheet.marginMm - 0.5);
      expect(b.x + b.w).toBeLessThanOrEqual(d.sheet.widthMm - d.sheet.marginMm + 0.5);
      expect(b.y + b.h).toBeLessThanOrEqual(d.sheet.heightMm - d.sheet.marginMm + 0.5);
    }
    // printed areas (incl. bleed) of neighbours keep the gap
    const pts = shapes.map((sh) => pathPoints(sh.print, 0.5));
    for (let a = 0; a < pts.length; a++)
      for (let b = a + 1; b < pts.length; b++)
        expect(minDistance(pts[a], pts[b])).toBeGreaterThan(d.sheet.gapMm - 0.6);

    const doc = await PDFDocument.load(await buildWheelPdf(d, fonts));
    expect(doc.getPageCount()).toBe(1);
    expect(mm(doc.getPage(0).getWidth())).toBeCloseTo(210, 1);
    expect(mm(doc.getPage(0).getHeight())).toBeCloseTo(297, 1);
    expect(hasCutContour(doc, 0)).toBe(true);
  });

  it('lays separate wedges out over as many sheets as needed', async () => {
    const d = {
      ...defaultWheel(),
      outerMm: 300,
      segments: 12,
      sheet: { widthMm: 420, heightMm: 297, gapMm: 4, marginMm: 10 },
    };
    const { perPage } = sheetLayout(d);
    expect(perPage).toBeGreaterThan(0);
    expect(sheetLayout({ ...d, fillSheet: false }).slots).toHaveLength(12);
    const doc = await PDFDocument.load(await buildWheelPdf(d, fonts));
    expect(doc.getPageCount()).toBe(Math.ceil(12 / perPage));
    expect(mm(doc.getPage(0).getWidth())).toBeCloseTo(420, 1);
    expect(hasCutContour(doc, 0)).toBe(true);
  });

  it('cuts the knob hole into the sticker of the segment it sits on', async () => {
    const d = { ...defaultWheel(), knob: NINE_UNITED_KNOB };
    expect(knobSegment(d)).toBe(2);
    expect(segmentShape(d, 2, 0, 0, UP).cut!.filter((c) => c.op === 'M')).toHaveLength(2);
    expect(segmentShape(d, 1, 0, 0, UP).cut!.filter((c) => c.op === 'M')).toHaveLength(1);
    expect(segmentShape({ ...d, knob: null }, 2, 0, 0, UP).cut!.filter((c) => c.op === 'M')).toHaveLength(1);
  });

  it('refuses a sheet too small for one wedge', async () => {
    const d = {
      ...defaultWheel(),
      cutMode: 'segments' as const,
      outerMm: 600,
      sheet: { widthMm: 100, heightMm: 100, gapMm: 4, marginMm: 10 },
    };
    await expect(buildWheelPdf(d, fonts)).rejects.toThrow(/does not fit/);
  });
});

describe('hero wall PDFs', () => {
  const images = Array.from({ length: 9 }, (_, i) => `img-${i}.jpg`);
  const design = distributeImages({ ...defaultWallTemplate(), name: 'Magasin KGS' }, images);
  design.panels[0].frames[0] = { ...design.panels[0].frames[0], imageId: null };

  it('writes one 1:1 page per panel with bleed, and reports resolution', async () => {
    const { bytes, checks } = await buildWallPrintPdf(design, resolver, fonts);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    const trim = doc.getPage(0).getTrimBox();
    expect(mm(trim.width)).toBeCloseTo(630, 0);
    expect(mm(trim.height)).toBeCloseTo(1500, 0);
    expect(mm(doc.getPage(0).getBleedBox().width)).toBeCloseTo(640, 0);

    expect(checks.filter((c) => c.source === 'empty')).toHaveLength(1);
    const placed = checks.filter((c) => c.dpi !== undefined);
    expect(placed).toHaveLength(8);
    // 1326 px across a ~280 mm cell (2 columns on 630 mm) prints at ~120 ppi
    for (const c of placed) {
      expect(c.dpi).toBeGreaterThan(100);
      expect(c.dpi).toBeLessThan(150);
      expect(c.rating).toBe('ok');
    }
  });

  it('embeds each photo once however often it is used', async () => {
    const one = {
      ...design,
      panels: design.panels.map((p) => ({
        ...p,
        frames: p.frames.map((f) => ({ ...f, imageId: 'same.jpg' })),
      })),
    };
    const { bytes } = await buildWallPrintPdf(one, resolver, fonts);
    expect(bytes.length).toBeLessThan(photo.length * 2 + 200_000);
  });

  it('puts every wall on its own A3 proof page', async () => {
    const doc = await PDFDocument.load(
      await buildWallProofPdf([design, design], resolver, fonts, () => 'DK'),
    );
    expect(doc.getPageCount()).toBe(2);
    expect(mm(doc.getPage(0).getWidth())).toBeCloseTo(420, 0);
  });
});
