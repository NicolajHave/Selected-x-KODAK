import { describe, expect, it } from 'vitest';
import {
  NINE_UNITED_WHEEL,
  defaultWallTemplate,
  defaultWheel,
  distributeImages,
  frameWithBleed,
  normalizeWheel,
  resizeSegments,
  newPanel,
  wallFromTemplate,
} from './designs';

describe('wheel designs', () => {
  it('repeats the existing pattern when segments are added', () => {
    const two = defaultWheel().items.slice(0, 2);
    const six = resizeSegments(two, 6);
    expect(six).toHaveLength(6);
    expect(six[4].label).toBe(two[0].label);
    expect(six[5].background).toBe(two[1].background);
  });

  it("starts from Nine United's drawing of the tabletop wheel", () => {
    const d = defaultWheel();
    expect(d.segments).toBe(10);
    expect(d.outerMm).toBe(198);
    expect(d.hubMm).toBe(60);
    expect(d.startDeg).toBe(18);
    expect(d.knob).toEqual(NINE_UNITED_WHEEL.knob);
    expect(d.items).toHaveLength(10);
  });

  it('normalizes an old or partial saved design', () => {
    const d = normalizeWheel({ segments: 8, sheet: { widthMm: 300 } });
    expect(d.items).toHaveLength(8);
    expect(d.sheet.widthMm).toBe(300);
    expect(d.sheet.heightMm).toBe(297);
    expect(d.bleedMm).toBe(2);
  });
});

describe('wall designs', () => {
  const images = Array.from({ length: 13 }, (_, i) => `img-${i + 1}.jpg`);

  it('distributes images over the panels that hold images, in order', () => {
    const t = { ...defaultWallTemplate(), panels: [newPanel('A'), newPanel('B'), newPanel('C')] };
    t.panels[1].holdsImages = false;
    const d = distributeImages(t, images);
    expect(d.panels[0].frames).toHaveLength(7);
    expect(d.panels[1].frames).toHaveLength(0);
    expect(d.panels[2].frames).toHaveLength(6);
    expect(d.panels[0].frames[0].imageId).toBe('img-1.jpg');
    expect(d.panels[2].frames.at(-1)!.imageId).toBe('img-13.jpg');
  });

  it('starts the template as one 630 × 1500 mm photo wall', () => {
    const t = defaultWallTemplate();
    expect(t.panels).toHaveLength(1);
    expect([t.panels[0].widthMm, t.panels[0].heightMm]).toEqual([630, 1500]);
  });

  it('makes empty slots on the template', () => {
    const d = distributeImages(defaultWallTemplate(), Array(12).fill(null));
    expect(d.panels.flatMap((p) => p.frames)).toHaveLength(12);
    expect(d.panels.every((p) => p.frames.every((f) => f.imageId === null))).toBe(true);
  });

  it("fills the template's slots with the booking's images", () => {
    const t = distributeImages(defaultWallTemplate(), Array(6).fill(null));
    const wall = wallFromTemplate(t, 'Magasin', 'SUB-1', images.slice(0, 4));
    const ids = wall.panels.flatMap((p) => p.frames.map((f) => f.imageId));
    expect(ids).toEqual(['img-1.jpg', 'img-2.jpg', 'img-3.jpg', 'img-4.jpg', null, null]);
    expect(wall.bookingId).toBe('SUB-1');
    // new ids, so editing the wall never touches the template
    expect(wall.panels[0].id).not.toBe(t.panels[0].id);
  });

  it('lays out images itself when the template has no slots yet', () => {
    const wall = wallFromTemplate(defaultWallTemplate(), 'Salling', 'SUB-2', images);
    expect(wall.panels.flatMap((p) => p.frames)).toHaveLength(13);
  });

  it('adds bleed only on sides touching the panel edge', () => {
    const panel = { ...defaultWallTemplate().panels[0], widthMm: 1000, heightMm: 2000 };
    const inner = {
      id: 'a',
      xMm: 60,
      yMm: 60,
      wMm: 400,
      hMm: 500,
      imageId: null,
      zoom: 1,
      focusX: 0.5,
      focusY: 0.5,
    };
    expect(frameWithBleed(inner, panel, 5)).toEqual({ x: 60, y: 60, w: 400, h: 500 });
    const full = { ...inner, xMm: 0, yMm: 0, wMm: 1000, hMm: 2000 };
    expect(frameWithBleed(full, panel, 5)).toEqual({ x: -5, y: -5, w: 1010, h: 2010 });
  });
});
