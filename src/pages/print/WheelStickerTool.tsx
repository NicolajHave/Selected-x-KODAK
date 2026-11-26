import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { pathToSvg } from '../../print/geometry';
import {
  NINE_UNITED_KNOB,
  NINE_UNITED_WHEEL,
  resizeSegments,
  type WheelDesign,
  type WheelKnob,
  type WheelSegment,
} from '../../print/designs';
import {
  discCut,
  dividerLines,
  knobOutline,
  knobSegment,
  segmentShape,
  sheetLayout,
} from '../../print/wheelLayout';
import { buildWheelPdf } from '../../print/wheelPdf';
import { artworkDataUrl, loadFonts } from '../../print/assets';
import { downloadBytes } from '../../utils/download';
import { ColorField, NumberField, SaveBadge, Section, useAutosave } from './controls';

interface Props {
  initial: WheelDesign;
  by: string;
}

const SHEETS = [
  { label: 'A4', w: 210, h: 297 },
  { label: 'A4 landscape', w: 297, h: 210 },
  { label: 'A3', w: 420, h: 297 },
  { label: 'SRA3', w: 450, h: 320 },
];

const toDeg = (r: number) => (r * 180) / Math.PI;

export function WheelStickerTool({ initial, by }: Props) {
  const [d, setD] = useState<WheelDesign>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = useAutosave('wheel', 'wheel', d, by);

  const set = (patch: Partial<WheelDesign>) => setD((cur) => ({ ...cur, ...patch }));
  const setItem = (i: number, patch: Partial<WheelSegment>) =>
    setD((cur) => ({ ...cur, items: cur.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) }));
  const setKnob = (patch: Partial<WheelKnob>) =>
    setD((cur) => ({ ...cur, knob: cur.knob ? { ...cur.knob, ...patch } : null }));
  const setSegments = (n: number) => {
    const segments = Math.round(n);
    setD((cur) => ({ ...cur, segments, items: resizeSegments(cur.items, segments) }));
  };

  const layout = useMemo(() => (d.cutMode === 'segments' ? sheetLayout(d) : null), [d]);
  const sheets = layout?.perPage ? Math.ceil(d.segments / layout.perPage) : 0;

  const exportPdf = async () => {
    setBusy(true);
    setError('');
    try {
      const bytes = await buildWheelPdf(d, await loadFonts());
      const mode = d.cutMode === 'whole' ? 'disc' : 'wedges';
      downloadBytes(
        bytes,
        `spin-win-stickers-${d.segments}seg-${d.outerMm}mm-${mode}.pdf`,
        'application/pdf',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build the PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sk-pt-layout">
      <div className="sk-pt-stage">
        <div className="sk-pt-stage__bar">
          <span className="sk-eyebrow">
            Preview · {d.cutMode === 'whole' ? 'one round sticker' : 'separate wedges'}
          </span>
          <SaveBadge state={save} />
        </div>
        <WheelPreview d={d} />
        <p className="sk-pt-legend">
          <span className="sk-pt-key sk-pt-key--cut" /> cut line (CutContour)
          <span className="sk-pt-key sk-pt-key--trim" /> bleed edge — colour runs {d.bleedMm} mm past the cut
        </p>
        {d.cutMode === 'segments' && layout && (
          <div className="sk-pt-sheet">
            <div className="sk-eyebrow">
              Sheet 1 of {sheets || '–'} · {d.sheet.widthMm} × {d.sheet.heightMm} mm · {layout.perPage} wedges
              per sheet
            </div>
            <SheetPreview d={d} />
          </div>
        )}
      </div>

      <div className="sk-pt-panel">
        <Section
          title="Wheel"
          aside={
            <Button
              variant="text"
              size="sm"
              onClick={() =>
                setD((cur) => ({
                  ...cur,
                  ...NINE_UNITED_WHEEL,
                  items: resizeSegments(cur.items, NINE_UNITED_WHEEL.segments),
                }))
              }
            >
              Reset to drawing
            </Button>
          }
        >
          <p className="sk-pt-note">
            Set from Nine United's drawing (21.10.2026): Ø198 mm UV-printed disc, ten 36° segments, Ø60 mm
            logo disc in the centre.
          </p>
          <div className="sk-pt-grid">
            <NumberField label="Segments" value={d.segments} min={2} max={48} onChange={setSegments} />
            <NumberField
              label="Outer Ø"
              unit="mm"
              value={d.outerMm}
              min={20}
              step={0.5}
              onChange={(v) => set({ outerMm: v })}
            />
            <NumberField
              label="Hub Ø (cut out)"
              unit="mm"
              value={d.hubMm}
              min={0}
              max={d.outerMm - 10}
              step={0.5}
              onChange={(v) => set({ hubMm: v })}
            />
            <NumberField
              label="Bleed"
              unit="mm"
              value={d.bleedMm}
              min={0}
              max={10}
              step={0.5}
              onChange={(v) => set({ bleedMm: v })}
            />
            <NumberField
              label="Rotate"
              unit="°"
              value={d.startDeg}
              min={-180}
              max={180}
              step={0.5}
              onChange={(v) => set({ startDeg: v })}
              hint="Where segment 1's centre sits, clockwise from 12 o'clock"
            />
          </div>
          <label className="sk-pt-check">
            <input
              type="checkbox"
              checked={Boolean(d.knob)}
              onChange={(e) => set({ knob: e.target.checked ? { ...NINE_UNITED_KNOB } : null })}
            />
            Cut a hole for the knob on the wheel face
          </label>
          {d.knob && (
            <>
              <div className="sk-pt-grid">
                <NumberField
                  label="Knob position"
                  unit="°"
                  value={d.knob.angleDeg}
                  min={0}
                  max={360}
                  onChange={(v) => setKnob({ angleDeg: v })}
                  hint="Clockwise from 12 o'clock"
                />
                <NumberField
                  label="Knob centre from middle"
                  unit="mm"
                  value={d.knob.rMm}
                  min={0}
                  max={d.outerMm / 2}
                  step={0.5}
                  onChange={(v) => setKnob({ rMm: v })}
                />
                <NumberField
                  label="Knob length"
                  unit="mm"
                  value={d.knob.lengthMm}
                  min={1}
                  step={0.1}
                  onChange={(v) => setKnob({ lengthMm: v })}
                  hint="Along the radius"
                />
                <NumberField
                  label="Knob width"
                  unit="mm"
                  value={d.knob.widthMm}
                  min={1}
                  step={0.1}
                  onChange={(v) => setKnob({ widthMm: v })}
                />
                <NumberField
                  label="Clearance"
                  unit="mm"
                  value={d.knob.clearanceMm}
                  min={0}
                  step={0.5}
                  onChange={(v) => setKnob({ clearanceMm: v })}
                />
              </div>
              <p className="sk-pt-note">
                The knob sits on segment {knobSegment(d) + 1}; its sticker gets a hole cut around it.
              </p>
            </>
          )}
        </Section>

        <Section title="Text">
          <div className="sk-pt-grid">
            <NumberField
              label="Text height"
              unit="mm"
              value={d.fontSizeMm}
              min={1}
              max={60}
              step={0.5}
              onChange={(v) => set({ fontSizeMm: v })}
            />
            <NumberField
              label="Position hub → rim"
              unit="%"
              value={Math.round(d.textPosition * 100)}
              min={0}
              max={100}
              onChange={(v) => set({ textPosition: v / 100 })}
            />
          </div>
          <div className="sk-pt-toggle" role="radiogroup" aria-label="Text direction">
            {(['radial', 'tangential'] as const).map((o) => (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={d.orientation === o}
                className={d.orientation === o ? 'on' : ''}
                onClick={() => set({ orientation: o })}
              >
                {o === 'radial' ? 'Along the segment' : 'Across the segment'}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Cutting">
          <div className="sk-pt-toggle" role="radiogroup" aria-label="Cut mode">
            <button
              type="button"
              role="radio"
              aria-checked={d.cutMode === 'whole'}
              className={d.cutMode === 'whole' ? 'on' : ''}
              onClick={() => set({ cutMode: 'whole' })}
            >
              One round sticker
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={d.cutMode === 'segments'}
              className={d.cutMode === 'segments' ? 'on' : ''}
              onClick={() => set({ cutMode: 'segments' })}
            >
              One sticker per segment
            </button>
          </div>
          {d.cutMode === 'whole' ? (
            <div className="sk-pt-grid">
              <NumberField
                label="White divider"
                unit="mm"
                value={d.dividerMm}
                min={0}
                max={10}
                step={0.25}
                onChange={(v) => set({ dividerMm: v })}
                hint="0 = none"
              />
            </div>
          ) : (
            <>
              <div className="sk-pt-grid">
                <NumberField
                  label="Inset from segment edges"
                  unit="mm"
                  value={d.insetMm}
                  min={0}
                  max={10}
                  step={0.5}
                  onChange={(v) => set({ insetMm: v })}
                  hint="Room to place the sticker on the printed segment"
                />
              </div>
              <label className="sk-pt-check">
                <input
                  type="checkbox"
                  checked={d.fillSheet}
                  onChange={(e) => set({ fillSheet: e.target.checked })}
                />
                Fill empty places on the sheet with spare stickers
              </label>
              <div className="sk-pt-chips">
                {SHEETS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className={`sk-chip${d.sheet.widthMm === s.w && d.sheet.heightMm === s.h ? ' sk-chip--on' : ''}`}
                    onClick={() => set({ sheet: { ...d.sheet, widthMm: s.w, heightMm: s.h } })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="sk-pt-grid">
                <NumberField
                  label="Sheet width"
                  unit="mm"
                  value={d.sheet.widthMm}
                  min={50}
                  onChange={(v) => set({ sheet: { ...d.sheet, widthMm: v } })}
                />
                <NumberField
                  label="Sheet height"
                  unit="mm"
                  value={d.sheet.heightMm}
                  min={50}
                  onChange={(v) => set({ sheet: { ...d.sheet, heightMm: v } })}
                />
                <NumberField
                  label="Gap"
                  unit="mm"
                  value={d.sheet.gapMm}
                  min={0}
                  step={0.5}
                  onChange={(v) => set({ sheet: { ...d.sheet, gapMm: v } })}
                />
                <NumberField
                  label="Margin"
                  unit="mm"
                  value={d.sheet.marginMm}
                  min={0}
                  step={0.5}
                  onChange={(v) => set({ sheet: { ...d.sheet, marginMm: v } })}
                />
              </div>
              {!layout?.perPage && <p className="sk-error">A segment doesn't fit on this sheet.</p>}
            </>
          )}
        </Section>

        <Section
          title={`Segments · ${d.segments}`}
          aside={
            <Button
              variant="text"
              size="sm"
              onClick={() => set({ items: resizeSegments(d.items.slice(0, 2), d.segments) })}
            >
              Repeat 1–2 around the wheel
            </Button>
          }
        >
          <ol className="sk-pt-segs">
            {d.items.map((it, i) => (
              <li key={i}>
                <span className="sk-pt-segs__n sk-mono">{i + 1}</span>
                <div className="sk-pt-segs__body">
                  <textarea
                    rows={2}
                    value={it.label}
                    aria-label={`Segment ${i + 1} text`}
                    onChange={(e) => setItem(i, { label: e.target.value })}
                  />
                  <div className="sk-pt-segs__row">
                    <ColorField
                      label="Background"
                      value={it.background}
                      onChange={(v) => setItem(i, { background: v })}
                    />
                    <ColorField
                      label="Text colour"
                      value={it.textColor}
                      onChange={(v) => setItem(i, { textColor: v })}
                    />
                    {it.imageDataUrl ? (
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => setItem(i, { imageDataUrl: undefined })}
                      >
                        Remove art
                      </Button>
                    ) : (
                      <label className="sk-btn sk-btn--text sk-btn--sm">
                        Add art
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          hidden
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) setItem(i, { imageDataUrl: await artworkDataUrl(f) });
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <div className="sk-pt-actions">
          <Button
            onClick={() => void exportPdf()}
            disabled={busy || (d.cutMode === 'segments' && !layout?.perPage)}
          >
            {busy ? 'Building PDF…' : 'Download print PDF ↓'}
          </Button>
          {error && <p className="sk-error">{error}</p>}
          {d.cutMode === 'segments' && layout?.perPage ? (
            <p className="sk-pt-note">
              <b>Kiss-cut sheet:</b> {d.sheet.widthMm} × {d.sheet.heightMm} mm,{' '}
              {sheets === 1
                ? `one full wheel (${d.segments} stickers) per sheet`
                : `${layout.perPage} stickers per sheet, ${sheets} sheets per wheel`}
              {d.fillSheet && layout.slots.length > d.segments
                ? ` + ${layout.slots.length - d.segments} spare${layout.slots.length - d.segments === 1 ? '' : 's'}`
                : ''}
              . Order one sheet per wheel plus a few extra. Nothing but the stickers is printed on the sheet.
            </p>
          ) : null}
          <p className="sk-pt-note">
            Vector PDF at 1:1 with {d.bleedMm} mm bleed and fonts embedded. The cut line is a spot colour
            named <b>CutContour</b>, which sticker printers use for the kiss cut (through the sticker, not the
            backing). Colours are RGB — ask the printer to convert to CMYK.
          </p>
        </div>
      </div>
    </div>
  );
}

function SegmentArt({
  d,
  i,
  cx,
  cy,
  drawAt,
  id,
}: {
  d: WheelDesign;
  i: number;
  cx: number;
  cy: number;
  drawAt: number | null;
  id: string;
}) {
  const it = d.items[i % d.items.length];
  const s = segmentShape(d, i, cx, cy, drawAt);
  const lines = it.label
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const clip = `${id}-clip-${i}`;
  const b = s.imageBox;
  return (
    <g>
      <path d={pathToSvg(s.print)} fill={it.background} />
      {it.imageDataUrl && (
        <>
          <clipPath id={clip}>
            <path d={pathToSvg(s.print)} />
          </clipPath>
          <g clipPath={`url(#${clip})`}>
            <g transform={`translate(${cx} ${cy}) rotate(${toDeg(s.center + Math.PI / 2)})`}>
              <image
                href={it.imageDataUrl}
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                preserveAspectRatio="xMidYMid slice"
              />
            </g>
          </g>
        </>
      )}
      {lines.length > 0 && (
        <text
          transform={`translate(${s.text.x} ${s.text.y}) rotate(${toDeg(s.text.angle)})`}
          textAnchor="middle"
          fontSize={d.fontSizeMm}
          fontWeight={700}
          fill={it.textColor}
          fontFamily="Inter, Helvetica, Arial, sans-serif"
        >
          {lines.map((l, k) => (
            <tspan key={k} x={0} dy={k === 0 ? `${0.36 - ((lines.length - 1) / 2) * 1.12}em` : '1.12em'}>
              {l}
            </tspan>
          ))}
        </text>
      )}
      {s.cut && <path d={pathToSvg(s.cut)} className="sk-pt-cut" />}
    </g>
  );
}

function WheelPreview({ d: design }: { d: WheelDesign }) {
  /* Separate wedges are shown assembled, with each wedge's cut line. */
  const wedges = design.cutMode === 'segments';
  const d: WheelDesign = wedges ? { ...design, cutMode: 'whole', dividerMm: 0 } : design;
  const R = d.outerMm / 2 + d.bleedMm + 4;
  const dividers = dividerLines(d, 0, 0);
  const knob = knobOutline(d, 0, 0);
  return (
    <svg
      className="sk-pt-wheel"
      viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`}
      role="img"
      aria-label="Wheel sticker preview"
    >
      {Array.from({ length: d.segments }, (_, i) => (
        <SegmentArt key={i} d={d} i={i} cx={0} cy={0} drawAt={null} id="w" />
      ))}
      {dividers.length > 0 && <path d={pathToSvg(dividers)} stroke="#fff" strokeWidth={d.dividerMm} />}
      {wedges ? (
        Array.from({ length: d.segments }, (_, i) => (
          <path key={i} d={pathToSvg(segmentShape(design, i, 0, 0, null).cut!)} className="sk-pt-cut" />
        ))
      ) : (
        <path d={pathToSvg(discCut(d, 0, 0))} className="sk-pt-cut" fill="none" />
      )}
      <circle r={d.outerMm / 2 + d.bleedMm} className="sk-pt-trim" />
      {d.hubMm > 0 && (
        <circle r={wedges ? d.hubMm / 2 : Math.max(0, d.hubMm / 2 - d.bleedMm)} fill="var(--bg-2)" />
      )}
      {knob && <path d={pathToSvg(knob)} className="sk-pt-knob" />}
      <path d={`M-3 ${-R} L3 ${-R} L0 ${-R + 5} Z`} fill="var(--fg-1)" />
    </svg>
  );
}

function SheetPreview({ d }: { d: WheelDesign }) {
  const { slots } = sheetLayout(d);
  return (
    <svg
      className="sk-pt-sheetsvg"
      viewBox={`0 0 ${d.sheet.widthMm} ${d.sheet.heightMm}`}
      role="img"
      aria-label="Sticker sheet preview"
    >
      <rect
        width={d.sheet.widthMm}
        height={d.sheet.heightMm}
        fill="#fff"
        stroke="var(--rule-2)"
        strokeWidth={0.5}
      />
      {slots.map((s, k) =>
        s.page === 0 ? (
          <SegmentArt key={k} d={d} i={s.segment} cx={s.cx} cy={s.cy} drawAt={s.angle} id={`s${k}`} />
        ) : null,
      )}
    </svg>
  );
}
