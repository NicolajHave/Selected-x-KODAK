import { describe, expect, it } from 'vitest';
import {
  coverPlacement,
  effectiveDpi,
  gridCells,
  offsetWedgePath,
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

describe('offsetWedgePath', () => {
  /* Distance from a point to the radial line at angle a through the origin. */
  const toEdge = (x: number, y: number, a: number) => Math.abs(-Math.sin(a) * x + Math.cos(a) * y);
  const a0 = -Math.PI / 2 - Math.PI / 10;
  const a1 = -Math.PI / 2 + Math.PI / 10;

  it('moves the straight edges parallel by exactly the offset', () => {
    for (const off of [2, -2]) {
      const p = offsetWedgePath(0, 0, 30, 99, a0, a1, off);
      const corners = p.filter((c) => c.op === 'M' || c.op === 'L') as { x: number; y: number }[];
      // first corner lies on the a0 side, the line's corner on the a1 side
      expect(toEdge(corners[0].x, corners[0].y, a0)).toBeCloseTo(2, 6);
      expect(toEdge(corners[1].x, corners[1].y, a1)).toBeCloseTo(2, 6);
      expect(Math.hypot(corners[0].x, corners[0].y)).toBeCloseTo(99 + off, 6);
      expect(Math.hypot(corners[1].x, corners[1].y)).toBeCloseTo(30 - off, 6);
    }
  });

  it('ends in a point when the hub is too small for the inset', () => {
    const p = offsetWedgePath(0, 0, 0, 99, a0, a1, -3);
    const apex = p.filter((c) => c.op === 'L')[0] as { x: number; y: number };
    expect(apex.x).toBeCloseTo(0, 6);
    expect(-apex.y).toBeCloseTo(3 / Math.sin(Math.PI / 10), 6);
  });
});
