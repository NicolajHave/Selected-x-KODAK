/**
 * Storage for the print tools' designs (`kodak_print_designs`).
 *
 * One row per design: the wheel stickers, the wall template, and one wall per
 * hero-wall booking or custom wall. When Supabase isn't reachable the design
 * is kept in this browser so work isn't lost, and the caller is told.
 */
import { supabase } from './supabaseClient';
import { readJSON, writeJSON } from '../utils/storage';

export type DesignKind = 'wheel' | 'wall' | 'wall_template';

export interface StoredDesign {
  key: string;
  kind: DesignKind;
  data: unknown;
  updatedAt: string;
  updatedBy: string | null;
}

const LOCAL_KEY = 'sk-print-designs';

type LocalStore = Record<string, StoredDesign>;

interface Row {
  key: string;
  kind: DesignKind;
  data: unknown;
  updated_at: string;
  updated_by: string | null;
}

const fromRow = (r: Row): StoredDesign => ({
  key: r.key,
  kind: r.kind,
  data: r.data,
  updatedAt: r.updated_at,
  updatedBy: r.updated_by,
});

/** All designs; local copies win when they are newer than the server's. */
export async function listDesigns(): Promise<{ designs: StoredDesign[]; offline: boolean }> {
  const local = readJSON<LocalStore>(LOCAL_KEY, {});
  if (!supabase) return { designs: Object.values(local), offline: true };
  const { data, error } = await supabase
    .from('kodak_print_designs')
    .select('key, kind, data, updated_at, updated_by');
  if (error) return { designs: Object.values(local), offline: true };
  const merged = new Map((data as Row[]).map((r) => [r.key, fromRow(r)]));
  for (const d of Object.values(local)) {
    const server = merged.get(d.key);
    if (!server || server.updatedAt < d.updatedAt) merged.set(d.key, d);
  }
  return { designs: [...merged.values()], offline: false };
}

/**
 * Save a design. Returns true when it reached the server; false means it is
 * only in this browser for now (it is retried on the next save).
 */
export async function saveDesign(
  key: string,
  kind: DesignKind,
  data: unknown,
  updatedBy: string,
): Promise<boolean> {
  const updatedAt = new Date().toISOString();
  const local = readJSON<LocalStore>(LOCAL_KEY, {});
  if (supabase) {
    const { error } = await supabase
      .from('kodak_print_designs')
      .upsert({ key, kind, data, updated_by: updatedBy, updated_at: updatedAt });
    if (!error) {
      if (local[key]) {
        delete local[key];
        writeJSON(LOCAL_KEY, local);
      }
      return true;
    }
  }
  local[key] = { key, kind, data, updatedAt, updatedBy };
  writeJSON(LOCAL_KEY, local);
  return false;
}

export async function deleteDesign(key: string): Promise<void> {
  const local = readJSON<LocalStore>(LOCAL_KEY, {});
  if (local[key]) {
    delete local[key];
    writeJSON(LOCAL_KEY, local);
  }
  if (supabase) {
    const { error } = await supabase.from('kodak_print_designs').delete().eq('key', key);
    if (error) throw new Error(error.message);
  }
}
