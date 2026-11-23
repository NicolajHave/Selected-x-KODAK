import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PDFDict, PDFDocument, PDFName } from 'pdf-lib';
import { PT_PER_MM } from './geometry';
import { defaultWallTemplate, defaultWheel, distributeImages } from './designs';
import { buildWheelPdf } from './wheelPdf';
import { buildWallPrintPdf, buildWallProofPdf } from './wallPdf';
import { sheetLayout } from './wheelLayout';

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
    const d = { ...defaultWheel(), outerMm: 190, hubMm: 40, bleedMm: 2 };
    const doc = await PDFDocument.load(await buildWheelPdf(d, fonts));
    expect(doc.getPageCount()).toBe(1);
    const trim = doc.getPage(0).getTrimBox();
    expect(mm(trim.width)).toBeCloseTo(190, 1);
    expect(mm(trim.height)).toBeCloseTo(190, 1);
    const bleed = doc.getPage(0).getBleedBox();
    expect(mm(bleed.width)).toBeCloseTo(194, 1);
    expect(hasCutContour(doc, 0)).toBe(true);
  });

  it('lays separate wedges out over as many sheets as needed', async () => {
    const d = { ...defaultWheel(), cutMode: 'segments' as const, outerMm: 300, segments: 12 };
    const { perPage } = sheetLayout(d);
    expect(perPage).toBeGreaterThan(0);
    const doc = await PDFDocument.load(await buildWheelPdf(d, fonts));
    expect(doc.getPageCount()).toBe(Math.ceil(12 / perPage));
    expect(mm(doc.getPage(0).getWidth())).toBeCloseTo(420, 1);
    expect(hasCutContour(doc, 0)).toBe(true);
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
    expect(doc.getPageCount()).toBe(3);
    const trim = doc.getPage(0).getTrimBox();
    expect(mm(trim.width)).toBeCloseTo(1000, 0);
    expect(mm(trim.height)).toBeCloseTo(2000, 0);
    expect(mm(doc.getPage(0).getBleedBox().width)).toBeCloseTo(1010, 0);

    expect(checks.filter((c) => c.source === 'empty')).toHaveLength(1);
    const placed = checks.filter((c) => c.dpi !== undefined);
    expect(placed).toHaveLength(8);
    // 1326 px across a frame ~400 mm wide is well under 100 ppi
    expect(placed.every((c) => c.rating === 'low')).toBe(true);
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
