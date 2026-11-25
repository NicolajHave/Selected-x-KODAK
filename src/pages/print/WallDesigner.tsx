import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { BookingSubmission } from '../../types';
import { Button } from '../../components/ui/Button';
import { CAMPAIGN_IMAGES, imageById } from '../../data/campaignImages';
import { deleteDesign, saveDesign, type StoredDesign } from '../../data/printDesigns';
import { coverPlacement, rateDpi } from '../../print/geometry';
import {
  defaultWallTemplate,
  distributeImages,
  frameWithBleed,
  newId,
  newPanel,
  normalizeWall,
  wallFromTemplate,
  type WallDesign,
  type WallFrame,
  type WallPanel,
} from '../../print/designs';
import { buildWallPrintPdf, buildWallProofPdf, frameDpi, type FrameCheck } from '../../print/wallPdf';
import { Originals, loadFonts, resolveLibrary } from '../../print/assets';
import { downloadBytes, fileSlug } from '../../utils/download';
import { ColorField, NumberField, SaveBadge, Section, useAutosave } from './controls';

interface Props {
  bookings: BookingSubmission[];
  stored: StoredDesign[];
  by: string;
}

const TEMPLATE_KEY = 'wall-template';
const PANEL_GAP = 120;

interface WallEntry {
  key: string;
  title: string;
  subtitle: string;
  bookingId?: string;
  images: string[];
}

type Size = { width: number; height: number };

export function WallDesigner({ bookings, stored, by }: Props) {
  const [template, setTemplate] = useState<WallDesign>(() => {
    const t = stored.find((s) => s.key === TEMPLATE_KEY);
    return t ? normalizeWall(t.data, 'Hero wall template') : defaultWallTemplate();
  });
  const [walls, setWalls] = useState<Record<string, WallDesign>>(() =>
    Object.fromEntries(
      stored.filter((s) => s.kind === 'wall').map((s) => [s.key, normalizeWall(s.data, s.key)]),
    ),
  );
  /* Walls that exist on the server or have been edited here. */
  const [touched, setTouched] = useState<Set<string>>(
    () => new Set(stored.filter((s) => s.kind === 'wall').map((s) => s.key)),
  );

  const heroBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.selectedActivations.includes('hero_popup') && b.status !== 'declined')
        .sort(
          (a, b) =>
            a.partnerInfo.market.localeCompare(b.partnerInfo.market) ||
            a.partnerInfo.partnerName.localeCompare(b.partnerInfo.partnerName),
        ),
    [bookings],
  );

  const entries: WallEntry[] = useMemo(() => {
    const fromBookings = heroBookings.map((b) => ({
      key: `wall:${b.submissionId}`,
      title: b.partnerInfo.partnerName,
      subtitle: [b.partnerInfo.market, b.partnerInfo.storeName || b.partnerInfo.city, b.submissionId]
        .filter(Boolean)
        .join(' · '),
      bookingId: b.submissionId,
      images: b.selectedImages ?? [],
    }));
    const custom = Object.entries(walls)
      .filter(([k]) => k.startsWith('wall:custom:'))
      .map(([k, w]) => ({ key: k, title: w.name, subtitle: 'Custom wall', images: [] as string[] }));
    return [...fromBookings, ...custom];
  }, [heroBookings, walls]);
  const maxChosen = Math.max(0, ...heroBookings.map((b) => b.selectedImages?.length ?? 0));

  const [openKey, setOpenKey] = useState<string>(TEMPLATE_KEY);
  const entry = entries.find((e) => e.key === openKey);
  const isTemplate = openKey === TEMPLATE_KEY;

  /* A booking's wall is built from the template the first time it is opened. */
  useEffect(() => {
    if (isTemplate || walls[openKey]) return;
    setWalls((w) => ({
      ...w,
      [openKey]: wallFromTemplate(template, entry?.title ?? 'Wall', entry?.bookingId, entry?.images ?? []),
    }));
  }, [openKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const design = isTemplate ? template : walls[openKey];
  const setDesign = (value: WallDesign) => {
    if (isTemplate) setTemplate(value);
    else {
      setWalls((w) => ({ ...w, [openKey]: value }));
      setTouched((t) => (t.has(openKey) ? t : new Set(t).add(openKey)));
    }
  };

  /* Full-resolution originals are shared by every wall in this session. */
  const originals = useRef(new Originals());
  const [originalCount, setOriginalCount] = useState(0);

  const subtitleFor = (d: WallDesign) =>
    entries.find((x) => x.bookingId && x.bookingId === d.bookingId)?.subtitle ?? 'Custom wall';

  const [allBusy, setAllBusy] = useState(false);
  const [allNote, setAllNote] = useState('');
  const exportAllProofs = async () => {
    setAllBusy(true);
    setAllNote('');
    try {
      const list = entries
        .filter((e) => touched.has(e.key))
        .map((e) => walls[e.key])
        .filter((w): w is WallDesign => Boolean(w));
      if (!list.length) throw new Error('No walls have been designed yet.');
      const bytes = await buildWallProofPdf(list, resolveLibrary, await loadFonts(), subtitleFor);
      downloadBytes(bytes, 'hero-walls-proofs.pdf', 'application/pdf');
      setAllNote(`Proof with ${list.length} wall${list.length === 1 ? '' : 's'} downloaded.`);
    } catch (e) {
      setAllNote(e instanceof Error ? e.message : 'Could not build the proofs.');
    } finally {
      setAllBusy(false);
    }
  };

  const addCustomWall = () => {
    const name = window.prompt('Name of the wall (e.g. "Selected Antwerp flagship")')?.trim();
    if (!name) return;
    const key = `wall:custom:${newId('w')}`;
    const wall = wallFromTemplate(template, name, undefined, []);
    setWalls((w) => ({ ...w, [key]: wall }));
    setTouched((t) => new Set(t).add(key));
    void saveDesign(key, 'wall', wall, by);
    setOpenKey(key);
  };
  const removeCustomWall = async () => {
    if (!design || !window.confirm(`Delete "${design.name}"? This cannot be undone.`)) return;
    const key = openKey;
    setOpenKey(TEMPLATE_KEY);
    await deleteDesign(key);
    setWalls((w) => {
      const next = { ...w };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="sk-pt-wall">
      <aside className="sk-pt-walls" aria-label="Walls">
        <button
          type="button"
          className={`sk-pt-wallitem${isTemplate ? ' on' : ''}`}
          onClick={() => setOpenKey(TEMPLATE_KEY)}
        >
          <b>Template</b>
          <span>Panel sizes and default frames for every wall</span>
        </button>
        <div className="sk-eyebrow sk-pt-walls__head">Hero-wall bookings · {heroBookings.length}</div>
        {entries.map((e) => {
          const w = touched.has(e.key) ? walls[e.key] : undefined;
          const imgs = w ? w.panels.reduce((a, p) => a + p.frames.filter((f) => f.imageId).length, 0) : 0;
          return (
            <button
              key={e.key}
              type="button"
              className={`sk-pt-wallitem${openKey === e.key ? ' on' : ''}`}
              onClick={() => setOpenKey(e.key)}
            >
              <b>{e.title}</b>
              <span>{e.subtitle}</span>
              <span className={`sk-pt-status${w ? ' sk-pt-status--on' : ''}`}>
                {w
                  ? `In progress · ${imgs} photo${imgs === 1 ? '' : 's'}`
                  : e.bookingId
                    ? `Not started · ${e.images.length} chosen`
                    : 'Not started'}
              </span>
            </button>
          );
        })}
        <Button variant="ghost" size="sm" onClick={addCustomWall}>
          + Custom wall (e.g. Retail store)
        </Button>
        <Button variant="text" size="sm" onClick={() => void exportAllProofs()} disabled={allBusy}>
          {allBusy ? 'Building…' : 'Proofs of all walls ↓'}
        </Button>
        {allNote && <p className="sk-pt-note">{allNote}</p>}
      </aside>

      {design ? (
        <WallEditor
          key={openKey}
          storageKey={openKey}
          design={design}
          onChange={setDesign}
          isTemplate={isTemplate}
          template={template}
          entry={entry}
          maxChosen={maxChosen}
          originals={originals.current}
          originalCount={originalCount}
          onOriginals={(files) => {
            originals.current.add(files);
            setOriginalCount(originals.current.count);
          }}
          onDelete={openKey.startsWith('wall:custom:') ? () => void removeCustomWall() : undefined}
          by={by}
        />
      ) : (
        <div className="sk-pt-stage">
          <div className="sk-empty">Preparing the wall…</div>
        </div>
      )}
    </div>
  );
}

interface EditorProps {
  storageKey: string;
  design: WallDesign;
  onChange: (d: WallDesign) => void;
  isTemplate: boolean;
  template: WallDesign;
  entry?: WallEntry;
  maxChosen: number;
  originals: Originals;
  originalCount: number;
  onOriginals: (files: FileList) => void;
  onDelete?: () => void;
  by: string;
}

function WallEditor({
  storageKey,
  design,
  onChange,
  isTemplate,
  template,
  entry,
  maxChosen,
  originals,
  originalCount,
  onOriginals,
  onDelete,
  by,
}: EditorProps) {
  const save = useAutosave(storageKey, isTemplate ? 'wall_template' : 'wall', design, by);
  const setDesign = (next: WallDesign | ((cur: WallDesign) => WallDesign)) =>
    onChange(typeof next === 'function' ? next(design) : next);

  const [sel, setSel] = useState<{ panelId: string; frameId?: string } | null>(null);
  const selPanel = design.panels.find((p) => p.id === sel?.panelId) ?? null;
  const selFrame = selPanel?.frames.find((f) => f.id === sel?.frameId) ?? null;
  const [templateSlots, setTemplateSlots] = useState(Math.max(1, maxChosen || 12));

  const updatePanel = (panelId: string, patch: Partial<WallPanel>) =>
    setDesign((d) => ({ ...d, panels: d.panels.map((p) => (p.id === panelId ? { ...p, ...patch } : p)) }));
  const updateFrame = (panelId: string, frameId: string, patch: Partial<WallFrame>) =>
    setDesign((d) => ({
      ...d,
      panels: d.panels.map((p) =>
        p.id === panelId
          ? { ...p, frames: p.frames.map((f) => (f.id === frameId ? { ...f, ...patch } : f)) }
          : p,
      ),
    }));

  /* ---------- images ---------- */
  const ownImages = entry?.images ?? [];
  const [showAll, setShowAll] = useState(false);
  const pickable = showAll || isTemplate || !ownImages.length ? CAMPAIGN_IMAGES.map((i) => i.id) : ownImages;
  const usedIds = design.panels.flatMap((p) => p.frames.map((f) => f.imageId)).filter(Boolean) as string[];
  const sizes = useImageSizes(usedIds);

  const [origSizes, setOrigSizes] = useState<Record<string, Size>>({});
  useEffect(() => {
    let live = true;
    void Promise.all(
      usedIds
        .filter((id) => originals.has(id) && !origSizes[id])
        .map(async (id) => [id, await originals.size(id)!] as const),
    ).then((found) => {
      if (live && found.length) setOrigSizes((s) => ({ ...s, ...Object.fromEntries(found) }));
    });
    return () => {
      live = false;
    };
  }, [usedIds.join('|'), originalCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const assign = (imageId: string) => {
    if (selPanel && selFrame) {
      updateFrame(selPanel.id, selFrame.id, { imageId, zoom: 1, focusX: 0.5, focusY: 0.5 });
      return;
    }
    const empty = design.panels.flatMap((p) => p.frames.map((f) => ({ p, f }))).find(({ f }) => !f.imageId);
    if (empty) {
      updateFrame(empty.p.id, empty.f.id, { imageId });
      setSel({ panelId: empty.p.id, frameId: empty.f.id });
    }
  };

  /* ---------- resolution check (same maths as the PDF) ---------- */
  const checks = design.panels.flatMap((p) =>
    p.frames.map((f, n) => {
      const orig = f.imageId ? origSizes[f.imageId] : undefined;
      const lib = f.imageId ? sizes[f.imageId] : undefined;
      const sz = orig ?? lib;
      const dpi = f.imageId && sz ? frameDpi(f, p, design.bleedMm, sz.width, sz.height) : undefined;
      return {
        panel: p.name,
        frame: n + 1,
        frameId: f.id,
        panelId: p.id,
        imageId: f.imageId,
        source: !f.imageId
          ? 'empty'
          : !imageById(f.imageId) && !orig
            ? 'missing'
            : orig
              ? 'original'
              : 'library',
        dpi: dpi ? Math.round(dpi) : undefined,
        rating: dpi ? rateDpi(dpi) : undefined,
      };
    }),
  );
  const emptyCount = checks.filter((c) => c.source === 'empty').length;
  const lowCount = checks.filter((c) => c.rating === 'low').length;
  const libCount = checks.filter((c) => c.source === 'library').length;

  /* ---------- export ---------- */
  const [busy, setBusy] = useState('');
  const [exportNote, setExportNote] = useState<{ ok: boolean; text: string } | null>(null);
  const resolve = async (id: string) => (await originals.resolve(id)) ?? resolveLibrary(id);

  const exportPrint = async () => {
    setBusy('print');
    setExportNote(null);
    try {
      const { bytes, checks: c } = await buildWallPrintPdf(design, resolve, await loadFonts());
      downloadBytes(bytes, `${fileSlug(design.name)}-hero-wall-print.pdf`, 'application/pdf');
      setExportNote({ ok: true, text: summarize(c) });
    } catch (e) {
      setExportNote({ ok: false, text: e instanceof Error ? e.message : 'Could not build the PDF.' });
    } finally {
      setBusy('');
    }
  };

  const exportProof = async () => {
    setBusy('proof');
    setExportNote(null);
    try {
      const bytes = await buildWallProofPdf([design], resolveLibrary, await loadFonts(), () =>
        isTemplate ? 'Template' : (entry?.subtitle ?? 'Custom wall'),
      );
      downloadBytes(bytes, `${fileSlug(design.name)}-proof.pdf`, 'application/pdf');
      setExportNote({ ok: true, text: 'Proof downloaded.' });
    } catch (e) {
      setExportNote({ ok: false, text: e instanceof Error ? e.message : 'Could not build the proof.' });
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <div className="sk-pt-stage">
        <div className="sk-pt-stage__bar">
          <div>
            <span className="sk-eyebrow">{isTemplate ? 'Template' : (entry?.subtitle ?? 'Wall')}</span>
            <h2 className="sk-pt-title">{design.name}</h2>
          </div>
          <SaveBadge state={save} />
        </div>
        {!isTemplate && entry?.bookingId && ownImages.length === 0 && (
          <p className="sk-pt-warn">
            No images were chosen on this booking — pick them from the library on the right.
          </p>
        )}
        <div className="sk-pt-chips">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setDesign((d) =>
                distributeImages(
                  d,
                  isTemplate ? Array<null>(templateSlots).fill(null) : ownImages.length ? ownImages : usedIds,
                ),
              )
            }
            disabled={!isTemplate && !ownImages.length && !usedIds.length}
            title="Lay the photos out in an even grid on every panel that holds images"
          >
            Distribute images evenly
          </Button>
          {!isTemplate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (
                  window.confirm(
                    'Replace this wall with the template layout? Your frame changes on this wall are lost.',
                  )
                ) {
                  setDesign(
                    wallFromTemplate(
                      template,
                      design.name,
                      design.bookingId,
                      ownImages.length ? ownImages : usedIds,
                    ),
                  );
                }
              }}
            >
              Restart from template
            </Button>
          )}
          {isTemplate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setDesign((d) => ({ ...d, panels: [...d.panels, newPanel(`Panel ${d.panels.length + 1}`)] }))
              }
            >
              + Panel
            </Button>
          )}
          {onDelete && (
            <Button variant="destruct" size="sm" onClick={onDelete}>
              Delete wall
            </Button>
          )}
        </div>

        <WallCanvas design={design} sizes={sizes} sel={sel} onSelect={setSel} onFrame={updateFrame} />
        <p className="sk-pt-legend">
          Drag a photo to move it, the corner handle to resize. Dashed line = bleed ({design.bleedMm} mm);
          photos that touch a panel edge run into it.
        </p>
      </div>

      <div className="sk-pt-panel">
        <Section title="Wall">
          <div className="sk-pt-grid">
            <NumberField
              label="Bleed"
              unit="mm"
              value={design.bleedMm}
              min={0}
              max={50}
              onChange={(v) => setDesign((d) => ({ ...d, bleedMm: v }))}
            />
            <NumberField
              label="Margin"
              unit="mm"
              value={design.marginMm}
              min={0}
              onChange={(v) => setDesign((d) => ({ ...d, marginMm: v }))}
              hint="for Distribute"
            />
            <NumberField
              label="Gutter"
              unit="mm"
              value={design.gutterMm}
              min={0}
              onChange={(v) => setDesign((d) => ({ ...d, gutterMm: v }))}
              hint="for Distribute"
            />
          </div>
          {isTemplate && (
            <NumberField
              label="Photo slots"
              value={templateSlots}
              min={1}
              max={60}
              onChange={(v) => setTemplateSlots(Math.round(v))}
              hint={`Empty frames "Distribute" makes on the template · stores chose up to ${maxChosen}`}
            />
          )}
          {isTemplate && (
            <p className="sk-pt-note">
              The photo wall is 630 × 1500 mm. Check the bleed with the printer. Walls start from this
              template the first time they are opened; "Restart from template" picks up later changes.
            </p>
          )}
        </Section>

        {selPanel && (
          <Section
            title={selFrame ? `Photo · ${selPanel.name}` : selPanel.name}
            aside={
              <Button variant="text" size="sm" onClick={() => setSel(null)}>
                Close
              </Button>
            }
          >
            {selFrame ? (
              <FrameInspector
                frame={selFrame}
                panel={selPanel}
                onChange={(patch) => updateFrame(selPanel.id, selFrame.id, patch)}
                onDelete={() => {
                  updatePanel(selPanel.id, { frames: selPanel.frames.filter((f) => f.id !== selFrame.id) });
                  setSel({ panelId: selPanel.id });
                }}
                onDuplicate={() => {
                  const copy = {
                    ...selFrame,
                    id: newId('f'),
                    xMm: selFrame.xMm + 20,
                    yMm: selFrame.yMm + 20,
                  };
                  updatePanel(selPanel.id, { frames: [...selPanel.frames, copy] });
                  setSel({ panelId: selPanel.id, frameId: copy.id });
                }}
              />
            ) : (
              <PanelInspector
                panel={selPanel}
                onChange={(patch) => updatePanel(selPanel.id, patch)}
                onAddFrame={() => {
                  const f: WallFrame = {
                    id: newId('f'),
                    xMm: design.marginMm,
                    yMm: design.marginMm,
                    wMm: Math.min(600, selPanel.widthMm - 2 * design.marginMm),
                    hMm: Math.min(750, selPanel.heightMm - 2 * design.marginMm),
                    imageId: null,
                    zoom: 1,
                    focusX: 0.5,
                    focusY: 0.5,
                  };
                  updatePanel(selPanel.id, { frames: [...selPanel.frames, f] });
                  setSel({ panelId: selPanel.id, frameId: f.id });
                }}
                onRemove={
                  design.panels.length > 1
                    ? () => {
                        setDesign((d) => ({ ...d, panels: d.panels.filter((p) => p.id !== selPanel.id) }));
                        setSel(null);
                      }
                    : undefined
                }
              />
            )}
          </Section>
        )}

        <Section
          title={
            showAll || isTemplate || !ownImages.length
              ? 'Campaign library'
              : `Chosen by the store · ${ownImages.length}`
          }
          aside={
            !isTemplate && ownImages.length > 0 ? (
              <Button variant="text" size="sm" onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Only chosen' : 'Whole library'}
              </Button>
            ) : undefined
          }
        >
          <p className="sk-pt-note">
            {selFrame
              ? 'Click a photo to put it in the selected frame.'
              : 'Click a photo to fill the next empty frame.'}
          </p>
          <div className="sk-pt-thumbs">
            {pickable.map((id) => {
              const img = imageById(id);
              const uses = usedIds.filter((u) => u === id).length;
              return (
                <button key={id} type="button" className="sk-pt-thumb" onClick={() => assign(id)} title={id}>
                  {img ? (
                    <img src={img.url} alt={img.label} loading="lazy" />
                  ) : (
                    <span className="sk-pt-thumb__missing">Missing</span>
                  )}
                  {uses > 0 && <span className="sk-pt-thumb__uses">{uses}×</span>}
                  {originals.has(id) && <span className="sk-pt-thumb__hi">HI-RES</span>}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Print resolution">
          <p className="sk-pt-note">
            The portal's copies are 1600 px — too small for a wall. Load the full-resolution originals from
            the shoot; they're matched by file name and stay on this computer.
          </p>
          <label className="sk-btn sk-btn--ghost sk-btn--sm">
            Load originals… ({originalCount} loaded)
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) onOriginals(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
          {originals.rejected.length > 0 && (
            <p className="sk-pt-warn">
              Skipped {originals.rejected.length} file(s) that aren't JPEG/PNG (e.g. {originals.rejected[0]}).
              Export TIFF/PSD to JPEG first.
            </p>
          )}
          <table className="sk-pt-dpi">
            <tbody>
              {checks.map((c) => (
                <tr key={c.frameId} onClick={() => setSel({ panelId: c.panelId, frameId: c.frameId })}>
                  <td>
                    {c.panel} · {c.frame}
                  </td>
                  <td className="sk-mono">
                    {c.imageId ? c.imageId.replace(/\.[^.]+$/, '').slice(-22) : '—'}
                  </td>
                  <td>
                    {c.source === 'empty' ? (
                      <span className="sk-pt-tag sk-pt-tag--low">Empty</span>
                    ) : c.source === 'missing' ? (
                      <span className="sk-pt-tag sk-pt-tag--low">Missing</span>
                    ) : (
                      <span className={`sk-pt-tag sk-pt-tag--${c.rating ?? 'ok'}`}>
                        {c.dpi ?? '…'} ppi{c.source === 'library' ? ' · copy' : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <div className="sk-pt-actions">
          {(emptyCount > 0 || lowCount > 0 || libCount > 0) && (
            <p className="sk-pt-warn">
              {[
                emptyCount ? `${emptyCount} empty frame${emptyCount === 1 ? '' : 's'}` : '',
                libCount ? `${libCount} photo${libCount === 1 ? '' : 's'} from 1600 px copies` : '',
                lowCount ? `${lowCount} below 100 ppi` : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          <Button onClick={() => void exportPrint()} disabled={Boolean(busy)}>
            {busy === 'print' ? 'Building print PDF…' : 'Download print PDF ↓'}
          </Button>
          <Button variant="ghost" onClick={() => void exportProof()} disabled={Boolean(busy)}>
            {busy === 'proof' ? 'Building…' : 'Download proof ↓'}
          </Button>
          {exportNote && <p className={exportNote.ok ? 'sk-pt-note' : 'sk-error'}>{exportNote.text}</p>}
          <p className="sk-pt-note">
            Print PDF: one page per panel at 1:1, trim = panel size, {design.bleedMm} mm bleed, crop marks,
            photos embedded without recompression. RGB — the printer converts to CMYK.
          </p>
        </div>
      </div>
    </>
  );
}

function summarize(c: FrameCheck[]): string {
  const placed = c.filter((x) => x.dpi !== undefined);
  const parts = [`Print PDF downloaded · ${placed.length} photo${placed.length === 1 ? '' : 's'}`];
  const lib = c.filter((x) => x.source === 'library').length;
  const low = c.filter((x) => x.rating === 'low').length;
  const empty = c.filter((x) => x.source === 'empty' || x.source === 'missing').length;
  if (lib) parts.push(`${lib} from 1600 px copies`);
  if (low) parts.push(`${low} below 100 ppi`);
  if (empty) parts.push(`${empty} empty`);
  const min = placed.length ? Math.min(...placed.map((x) => x.dpi!)) : 0;
  if (placed.length) parts.push(`lowest ${min} ppi`);
  return parts.join(' · ');
}

/* ------------------------------------------------------------------ canvas */

function useImageSizes(ids: string[]): Record<string, Size> {
  const [sizes, setSizes] = useState<Record<string, Size>>({});
  const key = [...new Set(ids)].sort().join('|');
  useEffect(() => {
    let live = true;
    const missing = key.split('|').filter((id) => id && !sizes[id]);
    void Promise.all(
      missing.map(async (id) => {
        const r = await resolveLibrary(id);
        return r ? ([id, { width: r.width, height: r.height }] as const) : null;
      }),
    ).then((found) => {
      const ok = found.filter(Boolean) as (readonly [string, Size])[];
      if (live && ok.length) setSizes((s) => ({ ...s, ...Object.fromEntries(ok) }));
    });
    return () => {
      live = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return sizes;
}

interface CanvasProps {
  design: WallDesign;
  sizes: Record<string, Size>;
  sel: { panelId: string; frameId?: string } | null;
  onSelect: (s: { panelId: string; frameId?: string } | null) => void;
  onFrame: (panelId: string, frameId: string, patch: Partial<WallFrame>) => void;
}

function WallCanvas({ design, sizes, sel, onSelect, onFrame }: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    mode: 'move' | 'resize';
    panel: WallPanel;
    frame: WallFrame;
    x: number;
    y: number;
  } | null>(null);
  const b = design.bleedMm;
  const pad = Math.max(40, b + 20);

  const offsets: number[] = [];
  let x = pad;
  for (const p of design.panels) {
    offsets.push(x);
    x += p.widthMm + PANEL_GAP;
  }
  const W = x - PANEL_GAP + pad;
  const H = Math.max(...design.panels.map((p) => p.heightMm)) + 2 * pad + 60;

  const toMm = (e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    const p = m ? pt.matrixTransform(m.inverse()) : pt;
    return { x: p.x, y: p.y };
  };

  const start = (e: RPointerEvent, mode: 'move' | 'resize', panel: WallPanel, frame: WallFrame) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const p = toMm(e);
    drag.current = { mode, panel, frame, x: p.x, y: p.y };
    onSelect({ panelId: panel.id, frameId: frame.id });
  };

  const move = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toMm(e);
    const dx = Math.round(p.x - d.x);
    const dy = Math.round(p.y - d.y);
    const { panel, frame } = d;
    if (d.mode === 'move') {
      onFrame(panel.id, frame.id, {
        xMm: clamp(frame.xMm + dx, 0, panel.widthMm - frame.wMm),
        yMm: clamp(frame.yMm + dy, 0, panel.heightMm - frame.hMm),
      });
    } else {
      onFrame(panel.id, frame.id, {
        wMm: clamp(frame.wMm + dx, 20, panel.widthMm - frame.xMm),
        hMm: clamp(frame.hMm + dy, 20, panel.heightMm - frame.yMm),
      });
    }
  };

  const handle = Math.max(18, W / 120);

  return (
    <svg
      ref={svgRef}
      className="sk-pt-canvas"
      viewBox={`0 0 ${W} ${H}`}
      onPointerMove={move}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onPointerDown={() => onSelect(null)}
    >
      {design.panels.map((panel, pi) => {
        const ox = offsets[pi];
        const oy = pad;
        const panelSel = sel?.panelId === panel.id;
        return (
          <g key={panel.id} transform={`translate(${ox} ${oy})`}>
            <rect
              x={-b}
              y={-b}
              width={panel.widthMm + 2 * b}
              height={panel.heightMm + 2 * b}
              className="sk-pt-bleed"
            />
            <rect
              width={panel.widthMm}
              height={panel.heightMm}
              fill={panel.background}
              className={`sk-pt-panelrect${panelSel && !sel?.frameId ? ' on' : ''}`}
              onPointerDown={(e) => {
                e.stopPropagation();
                onSelect({ panelId: panel.id });
              }}
            />
            {panel.frames.map((f) => {
              const on = sel?.frameId === f.id;
              const rect = frameWithBleed(f, panel, b);
              const size = f.imageId ? sizes[f.imageId] : undefined;
              const img = f.imageId ? imageById(f.imageId) : undefined;
              const clipId = `clip-${f.id}`;
              const at = size ? coverPlacement(rect, size.width, size.height, f) : rect;
              return (
                <g key={f.id}>
                  <clipPath id={clipId}>
                    <rect x={rect.x} y={rect.y} width={rect.w} height={rect.h} />
                  </clipPath>
                  {img ? (
                    <image
                      href={img.url}
                      x={at.x}
                      y={at.y}
                      width={at.w}
                      height={at.h}
                      preserveAspectRatio={size ? 'none' : 'xMidYMid slice'}
                      clipPath={`url(#${clipId})`}
                    />
                  ) : (
                    <rect x={f.xMm} y={f.yMm} width={f.wMm} height={f.hMm} className="sk-pt-empty" />
                  )}
                  <rect
                    x={f.xMm}
                    y={f.yMm}
                    width={f.wMm}
                    height={f.hMm}
                    className={`sk-pt-frame${on ? ' on' : ''}`}
                    onPointerDown={(e) => start(e, 'move', panel, f)}
                  />
                  {on && (
                    <rect
                      x={f.xMm + f.wMm - handle / 2}
                      y={f.yMm + f.hMm - handle / 2}
                      width={handle}
                      height={handle}
                      className="sk-pt-handle"
                      onPointerDown={(e) => start(e, 'resize', panel, f)}
                    />
                  )}
                </g>
              );
            })}
            <text
              x={0}
              y={panel.heightMm + b + 45}
              className="sk-pt-paneltext"
              fontSize={Math.max(28, W / 70)}
            >
              {panel.name} · {panel.widthMm} × {panel.heightMm} mm
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));

/* --------------------------------------------------------------- inspectors */

function FrameInspector({
  frame,
  panel,
  onChange,
  onDelete,
  onDuplicate,
}: {
  frame: WallFrame;
  panel: WallPanel;
  onChange: (patch: Partial<WallFrame>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const img = frame.imageId ? imageById(frame.imageId) : undefined;
  return (
    <>
      <p className="sk-pt-note sk-mono">{frame.imageId ?? 'Empty frame — pick a photo below'}</p>
      {frame.imageId && !img && <p className="sk-pt-warn">This file is no longer in the campaign library.</p>}
      <div className="sk-pt-grid">
        <NumberField
          label="X"
          unit="mm"
          value={frame.xMm}
          min={0}
          max={panel.widthMm}
          onChange={(v) => onChange({ xMm: v })}
        />
        <NumberField
          label="Y"
          unit="mm"
          value={frame.yMm}
          min={0}
          max={panel.heightMm}
          onChange={(v) => onChange({ yMm: v })}
        />
        <NumberField
          label="Width"
          unit="mm"
          value={frame.wMm}
          min={10}
          max={panel.widthMm}
          onChange={(v) => onChange({ wMm: v })}
        />
        <NumberField
          label="Height"
          unit="mm"
          value={frame.hMm}
          min={10}
          max={panel.heightMm}
          onChange={(v) => onChange({ hMm: v })}
        />
      </div>
      <label className="sk-pt-slider">
        <span>Zoom {frame.zoom.toFixed(2)}×</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={frame.zoom}
          onChange={(e) => onChange({ zoom: Number(e.target.value) })}
        />
      </label>
      <label className="sk-pt-slider">
        <span>Crop left ↔ right</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={frame.focusX}
          onChange={(e) => onChange({ focusX: Number(e.target.value) })}
        />
      </label>
      <label className="sk-pt-slider">
        <span>Crop top ↕ bottom</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={frame.focusY}
          onChange={(e) => onChange({ focusY: Number(e.target.value) })}
        />
      </label>
      <div className="sk-pt-chips">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ xMm: 0, yMm: 0, wMm: panel.widthMm, hMm: panel.heightMm })}
        >
          Fill panel (full bleed)
        </Button>
        <Button variant="ghost" size="sm" onClick={onDuplicate}>
          Duplicate
        </Button>
        {frame.imageId && (
          <Button variant="ghost" size="sm" onClick={() => onChange({ imageId: null })}>
            Clear photo
          </Button>
        )}
        <Button variant="destruct" size="sm" onClick={onDelete}>
          Delete frame
        </Button>
      </div>
    </>
  );
}

function PanelInspector({
  panel,
  onChange,
  onAddFrame,
  onRemove,
}: {
  panel: WallPanel;
  onChange: (patch: Partial<WallPanel>) => void;
  onAddFrame: () => void;
  onRemove?: () => void;
}) {
  return (
    <>
      <label className="sk-pt-field">
        <span className="sk-pt-field__label">Name</span>
        <span className="sk-pt-field__input">
          <input value={panel.name} onChange={(e) => onChange({ name: e.target.value })} />
        </span>
      </label>
      <div className="sk-pt-grid">
        <NumberField
          label="Width (trim)"
          unit="mm"
          value={panel.widthMm}
          min={100}
          max={5000}
          onChange={(v) => onChange({ widthMm: v })}
        />
        <NumberField
          label="Height (trim)"
          unit="mm"
          value={panel.heightMm}
          min={100}
          max={5000}
          onChange={(v) => onChange({ heightMm: v })}
        />
      </div>
      <div className="sk-pt-row">
        <span className="sk-pt-field__label">Background</span>
        <ColorField
          label="Panel background"
          value={panel.background}
          onChange={(v) => onChange({ background: v })}
        />
      </div>
      <label className="sk-pt-check">
        <input
          type="checkbox"
          checked={panel.holdsImages}
          onChange={(e) => onChange({ holdsImages: e.target.checked })}
        />
        Photos go on this panel (used by "Distribute images evenly")
      </label>
      <div className="sk-pt-chips">
        <Button variant="ghost" size="sm" onClick={onAddFrame}>
          + Photo frame
        </Button>
        {onRemove && (
          <Button variant="destruct" size="sm" onClick={onRemove}>
            Remove panel
          </Button>
        )}
      </div>
    </>
  );
}
