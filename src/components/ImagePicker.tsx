import { CAMPAIGN_IMAGES, imageById, libraryIsEmpty } from '../data/campaignImages';
import { formatDeadline, isPastDeadline } from '../data/settings';

interface ImagePickerProps {
  selected: string[];
  onChange: (next: string[]) => void;
  /** Hides the picker's own heading when the page already provides one. */
  bare?: boolean;
  /** When selection closes. Null while it is still being read. */
  deadline?: Date | null;
}

/**
 * Lets a rep choose which campaign images go on their printed builds.
 *
 * The library is whatever HQ has put in `src/assets/campaign-images/`, so this
 * needs no maintenance when images are added or removed. After the deadline the
 * picker goes read-only — the database enforces the same rule, this just shows
 * it before a rep tries.
 */
export function ImagePicker({
  selected,
  onChange,
  bare = false,
  deadline = null,
}: ImagePickerProps) {
  const locked = isPastDeadline(deadline);

  const toggle = (id: string) => {
    if (locked) return;
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  /* Images chosen before a file was removed from the library. */
  const missing = selected.filter((id) => !imageById(id));

  if (libraryIsEmpty) {
    return (
      <div className="sk-empty" style={{ textAlign: 'left' }}>
        HQ has not uploaded the campaign images yet. You can submit the booking now
        and come back to choose images before selection closes
        {deadline ? ` on ${formatDeadline(deadline)}` : ''}.
      </div>
    );
  }

  /* After the deadline only the chosen images are shown, and they cannot change. */
  const shown = locked ? CAMPAIGN_IMAGES.filter((i) => selected.includes(i.id)) : CAMPAIGN_IMAGES;

  return (
    <div>
      {locked && (
        <div className="sk-lockbar" role="status">
          <strong>Selection closed</strong>
          {deadline ? ` on ${formatDeadline(deadline)}.` : '.'} Contact HQ to change the
          images on this booking.
        </div>
      )}

      {!bare && !locked && (
        <div className="sk-spread" style={{ alignItems: 'baseline', marginBottom: 12 }}>
          <div className="sk-muted" style={{ fontSize: 13 }}>
            Pick the images for this booking. Leave it empty and HQ applies the default
            campaign visual.
          </div>
          <div className="sk-mono" style={{ fontSize: 12, color: 'var(--fg-3)' }}>
            {selected.length} selected
          </div>
        </div>
      )}

      {locked && shown.length === 0 ? (
        <div className="sk-empty" style={{ textAlign: 'left' }}>
          No images were selected before the deadline, so HQ applies the default
          campaign visual to this booking.
        </div>
      ) : (
        <div className="sk-imggrid">
          {shown.map((img) => {
            const on = selected.includes(img.id);
            return (
              <button
                key={img.id}
                type="button"
                className={`sk-imgcard${on ? ' sk-imgcard--on' : ''}${locked ? ' sk-imgcard--locked' : ''}`}
                aria-pressed={on}
                disabled={locked}
                onClick={() => toggle(img.id)}
              >
                <span
                  className="sk-imgcard__media"
                  style={{ backgroundImage: `url('${img.url}')` }}
                  aria-hidden="true"
                />
                <span className="sk-imgcard__foot">
                  <span className="sk-imgcard__label">{img.label}</span>
                  <span className={`sk-tick${on ? ' sk-tick--on' : ''}`} aria-hidden="true">
                    {on ? '✓' : ''}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!locked && deadline && (
        <p className="sk-muted" style={{ fontSize: 11, marginTop: 12 }}>
          Selection closes {formatDeadline(deadline)}. After that, images can only be
          changed by HQ.
        </p>
      )}

      {!locked && missing.length > 0 && (
        <div className="sk-login__error" role="alert" style={{ marginTop: 14 }}>
          {missing.length} previously selected image
          {missing.length === 1 ? ' is' : 's are'} no longer in the library:{' '}
          {missing.join(', ')}. Pick a replacement.
        </div>
      )}
    </div>
  );
}
