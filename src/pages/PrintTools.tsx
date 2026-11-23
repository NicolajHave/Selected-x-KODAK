import { useEffect, useState } from 'react';
import type { BookingSubmission } from '../types';
import { Eyebrow } from '../components/ui/Eyebrow';
import { listDesigns, type StoredDesign } from '../data/printDesigns';
import { normalizeWheel } from '../print/designs';
import { WheelStickerTool } from './print/WheelStickerTool';
import { WallDesigner } from './print/WallDesigner';

interface PrintToolsProps {
  bookings: BookingSubmission[];
  /** Who is signed in, recorded on saved designs. */
  by: string;
}

type Tool = 'walls' | 'wheel';

/** HQ tools that turn bookings into print-ready artwork. */
export function PrintTools({ bookings, by }: PrintToolsProps) {
  const [tool, setTool] = useState<Tool>('walls');
  const [stored, setStored] = useState<StoredDesign[] | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    void listDesigns().then(({ designs, offline: off }) => {
      setStored(designs);
      setOffline(off);
    });
  }, []);

  return (
    <div className="sk-container sk-container--wide sk-pt">
      <div className="sk-pagehead">
        <div>
          <Eyebrow size="lg">HQ · Print tools</Eyebrow>
          <h1>Print-ready artwork</h1>
          <p>
            Lay out the photos for every hero wall and the Spin &amp; Win stickers, then download PDFs the
            printer can use as they are. Work is saved automatically and shared with everyone in HQ.
          </p>
        </div>
      </div>

      <div className="sk-pt-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tool === 'walls'}
          className={tool === 'walls' ? 'on' : ''}
          onClick={() => setTool('walls')}
        >
          Hero wall photos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tool === 'wheel'}
          className={tool === 'wheel' ? 'on' : ''}
          onClick={() => setTool('wheel')}
        >
          Spin &amp; Win stickers
        </button>
      </div>

      {offline && (
        <p className="sk-pt-warn">
          The shared design store couldn't be reached. You can keep working — changes are kept in this browser
          until it is back.
        </p>
      )}

      {!stored ? (
        <div className="sk-empty">Loading designs…</div>
      ) : (
        /* Both stay mounted so switching tabs never drops unsaved edits. */
        <>
          <div hidden={tool !== 'walls'}>
            <WallDesigner bookings={bookings} stored={stored} by={by} />
          </div>
          <div hidden={tool !== 'wheel'}>
            <WheelStickerTool initial={normalizeWheel(stored.find((s) => s.key === 'wheel')?.data)} by={by} />
          </div>
        </>
      )}
    </div>
  );
}
