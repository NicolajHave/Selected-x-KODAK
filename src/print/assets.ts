/**
 * Browser-side loading for the print tools: embedded fonts, campaign images
 * (library copies) and the full-resolution originals HQ picks from disk.
 */
import interRegularUrl from '../assets/fonts/Inter-400.ttf?url';
import interBoldUrl from '../assets/fonts/Inter-700.ttf?url';
import { imageById } from '../data/campaignImages';
import type { FontBytes } from './pdfKit';
import type { ResolvedImage } from './wallPdf';

let fontsPromise: Promise<FontBytes> | null = null;

export function loadFonts(): Promise<FontBytes> {
  fontsPromise ??= Promise.all([fetchBytes(interRegularUrl), fetchBytes(interBoldUrl)]).then(
    ([regular, bold]) => ({ regular, bold }),
  );
  return fontsPromise;
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

async function pixelSize(blob: Blob): Promise<{ width: number; height: number }> {
  const bmp = await createImageBitmap(blob);
  const size = { width: bmp.width, height: bmp.height };
  bmp.close();
  return size;
}

/** Match key for an image: file name without extension, lower case. */
export const imageKey = (name: string) => name.replace(/\.[^.]+$/, '').toLowerCase();

const PRINTABLE = /\.(jpe?g|png)$/i;

/**
 * Full-resolution originals chosen by HQ, matched to library images by file
 * name (extension ignored). Kept in memory for the session only — the files
 * stay on HQ's machine.
 */
export class Originals {
  private files = new Map<string, File>();
  private sizes = new Map<string, Promise<{ width: number; height: number }>>();
  readonly rejected: string[] = [];

  add(list: FileList | File[]) {
    for (const f of Array.from(list)) {
      if (PRINTABLE.test(f.name)) this.files.set(imageKey(f.name), f);
      else this.rejected.push(f.name);
    }
  }

  get count() {
    return this.files.size;
  }

  has(imageId: string) {
    return this.files.has(imageKey(imageId));
  }

  size(imageId: string) {
    const f = this.files.get(imageKey(imageId));
    if (!f) return null;
    const k = imageKey(imageId);
    if (!this.sizes.has(k)) this.sizes.set(k, pixelSize(f));
    return this.sizes.get(k)!;
  }

  async resolve(imageId: string): Promise<ResolvedImage | null> {
    const f = this.files.get(imageKey(imageId));
    if (!f) return null;
    const { width, height } = await this.size(imageId)!;
    return { bytes: new Uint8Array(await f.arrayBuffer()), width, height, source: 'original' };
  }
}

const libraryCache = new Map<string, Promise<ResolvedImage | null>>();

/** The 1600 px copy bundled with the portal. */
export function resolveLibrary(imageId: string): Promise<ResolvedImage | null> {
  if (!libraryCache.has(imageId)) {
    const img = imageById(imageId);
    libraryCache.set(
      imageId,
      img
        ? fetch(img.url)
            .then((r) => r.blob())
            .then(async (blob) => ({
              bytes: new Uint8Array(await blob.arrayBuffer()),
              ...(await pixelSize(blob)),
              source: 'library' as const,
            }))
            .catch(() => null)
        : Promise.resolve(null),
    );
  }
  return libraryCache.get(imageId)!;
}

/**
 * Shrink an uploaded artwork file to at most `max` px on its long edge and
 * return it as a data URL — small enough to store inside a design.
 */
export async function artworkDataUrl(file: File, max = 1600): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const png = /png$/i.test(file.type);
  return canvas.toDataURL(png ? 'image/png' : 'image/jpeg', 0.92);
}
