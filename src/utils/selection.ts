/**
 * Row selection for the HQ overview's bulk actions.
 *
 * Kept apart from the component because the rules are easy to get subtly wrong:
 * a booking that is no longer on screen must never be caught by a bulk change,
 * and "select all" has to mean the rows HQ can currently see, not the whole
 * database.
 */

/** Add an id if missing, remove it if present. */
export function toggleId(selected: Set<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (!next.delete(id)) next.add(id);
  return next;
}

/**
 * Select every visible row, or clear if they are all selected already.
 * Ids outside `visibleIds` are dropped either way.
 */
export function toggleAll(selected: Set<string>, visibleIds: string[]): Set<string> {
  const allOn = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  return allOn ? new Set() : new Set(visibleIds);
}

/**
 * Narrow a selection to what is still on screen.
 *
 * Returns the original set when nothing drops, so React state can be left
 * untouched instead of re-rendering on every filter keystroke.
 */
export function pruneToVisible(selected: Set<string>, visibleIds: string[]): Set<string> {
  if (selected.size === 0) return selected;
  const visible = new Set(visibleIds);
  const next = new Set([...selected].filter((id) => visible.has(id)));
  return next.size === selected.size ? selected : next;
}

/**
 * The ids a bulk action should apply to: selected *and* visible, in the order
 * they appear on screen.
 */
export function idsToApply(selected: Set<string>, visibleIds: string[]): string[] {
  return visibleIds.filter((id) => selected.has(id));
}
