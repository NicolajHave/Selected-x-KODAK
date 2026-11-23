/**
 * Small layer over pdf-lib for print-ready output: pages with trim, bleed and
 * slug boxes, crop marks, clipping, and a CutContour spot colour for sticker
 * plotters. Coordinates in are millimetres from the TRIM top-left, y down.
 */
import {
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFOperator,
  appendBezierCurve,
  clip,
  closePath,
  concatTransformationMatrix,
  endPath,
  fill,
  lineTo,
  moveTo,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  setFillingRgbColor,
  setLineWidth,
  setStrokingRgbColor,
  stroke,
  type PDFFont,
  type PDFImage,
  type PDFOperatorNames,
  type PDFPage,
} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { PT_PER_MM, type PathCmd, type Rect } from './geometry';

export interface FontBytes {
  regular: Uint8Array;
  bold: Uint8Array;
}

export interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

export async function createPrintDoc(fontBytes: FontBytes, title: string) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts: Fonts = {
    regular: await doc.embedFont(fontBytes.regular),
    bold: await doc.embedFont(fontBytes.bold),
  };
  doc.setTitle(title);
  doc.setCreator('Selected × Kodak partner portal');
  doc.setProducer('Selected × Kodak partner portal (pdf-lib)');
  return { doc, fonts };
}

export interface Sheet {
  doc: PDFDocument;
  page: PDFPage;
  trimW: number;
  trimH: number;
  bleed: number;
  slug: number;
  /** mm (trim-relative, y down) → PDF points. */
  x: (mm: number) => number;
  y: (mm: number) => number;
}

/** A page whose TrimBox is trimW × trimH mm, with bleed and a slug for marks. */
export function addSheet(doc: PDFDocument, trimW: number, trimH: number, bleed: number, slug: number): Sheet {
  const off = bleed + slug;
  const W = (trimW + 2 * off) * PT_PER_MM;
  const H = (trimH + 2 * off) * PT_PER_MM;
  const page = doc.addPage([W, H]);
  page.setBleedBox(
    slug * PT_PER_MM,
    slug * PT_PER_MM,
    (trimW + 2 * bleed) * PT_PER_MM,
    (trimH + 2 * bleed) * PT_PER_MM,
  );
  page.setTrimBox(off * PT_PER_MM, off * PT_PER_MM, trimW * PT_PER_MM, trimH * PT_PER_MM);
  return {
    doc,
    page,
    trimW,
    trimH,
    bleed,
    slug,
    x: (mm) => (mm + off) * PT_PER_MM,
    y: (mm) => H - (mm + off) * PT_PER_MM,
  };
}

export function hexToRgb(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0xffffff;
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

function pathOps(s: Sheet, cmds: PathCmd[]): PDFOperator[] {
  return cmds.map((c) => {
    switch (c.op) {
      case 'M':
        return moveTo(s.x(c.x), s.y(c.y));
      case 'L':
        return lineTo(s.x(c.x), s.y(c.y));
      case 'C':
        return appendBezierCurve(s.x(c.x1), s.y(c.y1), s.x(c.x2), s.y(c.y2), s.x(c.x), s.y(c.y));
      case 'Z':
        return closePath();
    }
  });
}

export function fillPath(s: Sheet, cmds: PathCmd[], hex: string) {
  const { r, g, b } = hexToRgb(hex);
  s.page.pushOperators(
    pushGraphicsState(),
    setFillingRgbColor(r, g, b),
    ...pathOps(s, cmds),
    fill(),
    popGraphicsState(),
  );
}

export function strokePath(s: Sheet, cmds: PathCmd[], hex: string, widthMm: number) {
  const { r, g, b } = hexToRgb(hex);
  s.page.pushOperators(
    pushGraphicsState(),
    setStrokingRgbColor(r, g, b),
    setLineWidth(widthMm * PT_PER_MM),
    ...pathOps(s, cmds),
    stroke(),
    popGraphicsState(),
  );
}

/** Run `draw` with everything clipped to `cmds`. */
export function withClip(s: Sheet, cmds: PathCmd[], draw: () => void) {
  s.page.pushOperators(pushGraphicsState(), ...pathOps(s, cmds), clip(), endPath());
  draw();
  s.page.pushOperators(popGraphicsState());
}

/**
 * Run `draw` in a local system centred on `center` (mm) and turned by `angle`
 * (radians, clockwise on screen). Inside, units are PDF points with y UP.
 */
export function withTransform(s: Sheet, center: { x: number; y: number }, angle: number, draw: () => void) {
  const c = Math.cos(angle);
  const n = Math.sin(angle);
  s.page.pushOperators(
    pushGraphicsState(),
    concatTransformationMatrix(c, -n, n, c, s.x(center.x), s.y(center.y)),
  );
  draw();
  s.page.pushOperators(popGraphicsState());
}

/** Draw an image into a mm rectangle (y down), no clipping. */
export function drawImageAt(s: Sheet, img: PDFImage, r: Rect) {
  s.page.drawImage(img, {
    x: s.x(r.x),
    y: s.y(r.y + r.h),
    width: r.w * PT_PER_MM,
    height: r.h * PT_PER_MM,
  });
}

/** Draw an image into a rectangle given in the local system of withTransform (mm, y down). */
export function drawImageLocal(s: Sheet, img: PDFImage, r: Rect) {
  s.page.drawImage(img, {
    x: r.x * PT_PER_MM,
    y: -(r.y + r.h) * PT_PER_MM,
    width: r.w * PT_PER_MM,
    height: r.h * PT_PER_MM,
  });
}

/**
 * Centre a block of lines on the local origin of withTransform, reading along +x.
 */
export function drawTextBlockLocal(s: Sheet, lines: string[], font: PDFFont, sizeMm: number, hex: string) {
  const size = sizeMm * PT_PER_MM;
  const lineH = size * 1.12;
  const cap = font.heightAtSize(size, { descender: false }) * 0.72;
  const { r, g, b } = hexToRgb(hex);
  lines.forEach((line, i) => {
    const w = font.widthOfTextAtSize(line, size);
    const baseline = ((lines.length - 1) / 2 - i) * lineH - cap / 2;
    s.page.drawText(line, { x: -w / 2, y: baseline, size, font, color: rgb(r, g, b) });
  });
}

/* ------------------------------------------------------------- cut contour */

const CUT_CS = 'CutContour';
const CUT_GS = 'GSCutOverprint';

/**
 * Register the CutContour spot colour (100 % magenta alternate, overprinting)
 * on the page. Plotter RIPs (Roland, Mimaki, Summa, Caldera…) cut along any
 * path stroked in a separation named exactly "CutContour".
 */
function ensureCutResources(s: Sheet) {
  const { doc, page } = s;
  const resources = page.node.normalizedEntries().Resources;
  let cs = resources.lookupMaybe(PDFName.of('ColorSpace'), PDFDict);
  if (!cs) {
    cs = doc.context.obj({});
    resources.set(PDFName.of('ColorSpace'), cs);
  }
  if (!cs.has(PDFName.of(CUT_CS))) {
    const tint = doc.context.obj({
      FunctionType: 2,
      Domain: [0, 1],
      C0: [0, 0, 0, 0],
      C1: [0, 1, 0, 0],
      N: 1,
    });
    const sep = doc.context.obj([
      PDFName.of('Separation'),
      PDFName.of(CUT_CS),
      PDFName.of('DeviceCMYK'),
      doc.context.register(tint),
    ]);
    cs.set(PDFName.of(CUT_CS), doc.context.register(sep));
  }
  let gs = resources.lookupMaybe(PDFName.of('ExtGState'), PDFDict);
  if (!gs) {
    gs = doc.context.obj({});
    resources.set(PDFName.of('ExtGState'), gs);
  }
  if (!gs.has(PDFName.of(CUT_GS))) {
    gs.set(
      PDFName.of(CUT_GS),
      doc.context.register(doc.context.obj({ Type: 'ExtGState', OP: true, op: true, OPM: 1 })),
    );
  }
}

const op = (name: string, args: (PDFName | PDFNumber)[]) => PDFOperator.of(name as PDFOperatorNames, args);

export function cutContour(s: Sheet, cmds: PathCmd[]) {
  ensureCutResources(s);
  s.page.pushOperators(
    pushGraphicsState(),
    op('gs', [PDFName.of(CUT_GS)]),
    op('CS', [PDFName.of(CUT_CS)]),
    op('SCN', [PDFNumber.of(1)]),
    setLineWidth(0.25),
    ...pathOps(s, cmds),
    stroke(),
    popGraphicsState(),
  );
}

/* ------------------------------------------------------------ crop marks */

/** Crop marks at the four trim corners, outside the bleed, plus a slug note. */
export function cropMarks(s: Sheet, note: string, fonts: Fonts) {
  const gap = s.bleed + 1;
  const len = Math.max(3, Math.min(8, s.slug - 2));
  const { trimW: w, trimH: h } = s;
  const marks: PathCmd[] = [];
  for (const [cx, sx] of [
    [0, -1],
    [w, 1],
  ] as const) {
    for (const [cy, sy] of [
      [0, -1],
      [h, 1],
    ] as const) {
      marks.push({ op: 'M', x: cx + sx * gap, y: cy }, { op: 'L', x: cx + sx * (gap + len), y: cy });
      marks.push({ op: 'M', x: cx, y: cy + sy * gap }, { op: 'L', x: cx, y: cy + sy * (gap + len) });
    }
  }
  s.page.pushOperators(
    pushGraphicsState(),
    setStrokingRgbColor(0, 0, 0),
    setLineWidth(0.3),
    ...pathOps(s, marks),
    stroke(),
    popGraphicsState(),
  );
  if (s.slug >= 6) {
    s.page.drawText(note, {
      x: s.x(gap + len + 2),
      y: s.y(h + s.bleed + s.slug / 2) - 2.5,
      size: 6.5,
      font: fonts.regular,
      color: rgb(0.2, 0.2, 0.2),
    });
  }
}

/* ----------------------------------------------------------------- images */

export async function embedImage(doc: PDFDocument, bytes: Uint8Array): Promise<PDFImage> {
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return isPng ? doc.embedPng(bytes) : doc.embedJpg(bytes);
}

/** Decode a data: URL to bytes (used for artwork stored inside a design). */
export function dataUrlBytes(url: string): Uint8Array {
  const b64 = url.slice(url.indexOf(',') + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
