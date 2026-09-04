/**
 * Campaign image library.
 *
 * Every image file in `src/assets/campaign-images/` is picked up automatically
 * at build time — HQ adds a file, pushes, and it becomes selectable by reps with
 * no code change. See the README in that folder.
 */

const modules = import.meta.glob<string>(
  '../assets/campaign-images/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  { eager: true, import: 'default' },
);

export interface CampaignImage {
  /** Stable identifier stored on the booking — the original file name. */
  id: string;
  /** Readable label derived from the file name. */
  label: string;
  /** Bundled URL to render. */
  url: string;
}

function labelFrom(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  const words = base.split(/[-_\s]+/).filter(Boolean);
  if (!words.length) return base;
  return words
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export const CAMPAIGN_IMAGES: CampaignImage[] = Object.entries(modules)
  .map(([path, url]) => {
    const id = path.split('/').pop() as string;
    return { id, label: labelFrom(id), url };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

export const imageById = (id: string): CampaignImage | undefined =>
  CAMPAIGN_IMAGES.find((i) => i.id === id);

/** True when HQ has not uploaded any images yet. */
export const libraryIsEmpty = CAMPAIGN_IMAGES.length === 0;
