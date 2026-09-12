import { describe, expect, it } from 'vitest';
import { idsToApply, pruneToVisible, toggleAll, toggleId } from './selection';

const set = (...ids: string[]) => new Set(ids);

describe('toggleId', () => {
  it('adds an id that is not selected', () => {
    expect([...toggleId(set('a'), 'b')]).toEqual(['a', 'b']);
  });

  it('removes an id that is selected', () => {
    expect([...toggleId(set('a', 'b'), 'a')]).toEqual(['b']);
  });

  it('does not mutate the set it was given', () => {
    const before = set('a');
    toggleId(before, 'b');
    expect([...before]).toEqual(['a']);
  });
});

describe('toggleAll', () => {
  it('selects every visible row when some are unselected', () => {
    expect([...toggleAll(set('a'), ['a', 'b', 'c'])]).toEqual(['a', 'b', 'c']);
  });

  it('clears when every visible row is already selected', () => {
    expect([...toggleAll(set('a', 'b'), ['a', 'b'])]).toEqual([]);
  });

  it('ignores selected rows that are not visible', () => {
    // 'hidden' was filtered away; ticking "all" must not carry it along.
    expect([...toggleAll(set('hidden'), ['a', 'b'])]).toEqual(['a', 'b']);
  });

  it('clears when there are no visible rows at all', () => {
    expect([...toggleAll(set('a'), [])]).toEqual([]);
  });
});

describe('pruneToVisible', () => {
  it('drops selections that have been filtered away', () => {
    expect([...pruneToVisible(set('a', 'b'), ['a'])]).toEqual(['a']);
  });

  it('returns the same set when everything is still visible', () => {
    const before = set('a', 'b');
    expect(pruneToVisible(before, ['a', 'b', 'c'])).toBe(before);
  });

  it('returns the same set when nothing is selected', () => {
    const before = set();
    expect(pruneToVisible(before, ['a'])).toBe(before);
  });
});

describe('idsToApply', () => {
  it('keeps only ids that are both selected and visible', () => {
    expect(idsToApply(set('a', 'gone'), ['a', 'b'])).toEqual(['a']);
  });

  it('returns them in the order shown on screen', () => {
    expect(idsToApply(set('c', 'a'), ['a', 'b', 'c'])).toEqual(['a', 'c']);
  });

  it('is empty when the selection is entirely off screen', () => {
    expect(idsToApply(set('gone'), ['a', 'b'])).toEqual([]);
  });
});
