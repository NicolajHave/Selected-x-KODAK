import { describe, expect, it } from 'vitest';
import {
  coverPlacement,
  effectiveDpi,
  gridCells,
  rateDpi,
  sectorBounds,
  sectorPath,
  segmentAngles,
  splitEvenly,
} from './geometry';

describe('segmentAngles', () => {
  it("puts segment 1 at 12 o'clock and steps clockwise", () => {
    const g = { segments: 4, outerMm: 200, hubMm: 0, startDeg: 0 };
    expect(segmentAngles(g, 0).center).toBeCloseTo(-Math.PI / 2);
    expect(segmentAngles(g, 1).center).toBeCloseTo(0);
    expect(segmentAngles(g, 0).half).toBeCloseTo(Math.PI / 4);
  });
});

describe('sectorPath / sectorBounds', () => {
  it('closes a ring sector through the inner arc', () => {
    const p = sectorPath(0, 0, 25, 100, -Math.PI / 2 - 0.2, -Math.PI / 2 + 0.2);
    expect(p[0].op).toBe('M');
    expect(p.at(-1)!.op).toBe('Z');
    expect(p.some((c) => c.op === 'L')).toBe(true);
  });

  it('bounds an upright quarter pie slice', () => {
    const b = sectorBounds(0, 0, 0, 100, -Math.PI * 0.75, -Math.PI * 0.25);
    expect(b.y).toBeCloseTo(-100, 1);
    expect(b.h).toBeCloseTo(100, 1);
    expect(b.w).toBeCloseTo(2 * 100 * Math.sin(Math.PI / 4), 1);
  });
});

describe('coverPlacement', () => {
  const frame = { x: 10, y: 20, w: 400, h: 500 };

  it('covers the frame exactly in one direction at zoom 1', () => {
    const at = coverPlacement(frame, 1600, 1000, { zoom: 1, focusX: 0.5, focusY: 0.5 });
    expect(at.h).toBeCloseTo(500);
    expect(at.w).toBeCloseTo(800);
    expect(at.x).toBeCloseTo(10 - 200); // centred overflow
    expect(at.y).toBeCloseTo(20);
  });

  it('keeps the chosen edge with focus 0 / 1 and grows with zoom', () => {
    const left = coverPlacement(frame, 1600, 1000, { zoom: 1, focusX: 0, focusY: 0.5 });
    expect(left.x).toBeCloseTo(10);
    const right = coverPlacement(frame, 1600, 1000, { zoom: 1, focusX: 1, focusY: 0.5 });
    expect(right.x + right.w).toBeCloseTo(410);
    const zoomed = coverPlacement(frame, 1600, 1000, { zoom: 2, focusX: 0.5, focusY: 0.5 });
    expect(zoomed.h).toBeCloseTo(1000);
  });
});

describe('effectiveDpi / rateDpi', () => {
  it('converts pixels over millimetres to ppi', () => {
    expect(effectiveDpi(3000, 254)).toBeCloseTo(300);
    expect(rateDpi(160)).toBe('good');
    expect(rateDpi(120)).toBe('ok');
    expect(rateDpi(40)).toBe('low');
  });
});

describe('gridCells', () => {
  it('fills the area with the requested number of cells, inside it', () => {
    const area = { x: 60, y: 60, w: 880, h: 1880 };
    const cells = gridCells(area, 7, 20, 0.8);
    expect(cells).toHaveLength(7);
    for (const c of cells) {
      expect(c.x).toBeGreaterThanOrEqual(area.x - 1e-6);
      expect(c.y).toBeGreaterThanOrEqual(area.y - 1e-6);
      expect(c.x + c.w).toBeLessThanOrEqual(area.x + area.w + 1e-6);
      expect(c.y + c.h).toBeLessThanOrEqual(area.y + area.h + 1e-6);
    }
  });

  it('returns nothing for zero images', () => {
    expect(gridCells({ x: 0, y: 0, w: 100, h: 100 }, 0, 5, 1)).toEqual([]);
  });
});

describe('splitEvenly', () => {
  it('keeps order and spreads the remainder over the first groups', () => {
    expect(splitEvenly([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([
      [1, 2, 3],
      [4, 5],
      [6, 7],
    ]);
  });
});
