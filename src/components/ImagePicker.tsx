import { CAMPAIGN_IMAGES, imageById, libraryIsEmpty } from '../data/campaignImages';

interface ImagePickerProps {
  selected: string[];
  onChange: (next: string[]) => void;
  /** Hides the picker's own heading when the page already provides one. */
  bare?: boolean;
}

/**
 * Lets a rep choose which campaign images go on their printed builds.
 *
 * The library is whatever HQ has put in `src/assets/campaign-images/`, so this
 * needs no maintenance when images are added or removed.
 */
export function ImagePicker({ selected, onChange, bare = false }: ImagePickerProps) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  /* Images chosen before a file was removed from the library. */
  const missing = selected.filter((id) => !imageById(id));

  if (libraryIsEmpty) {
    return (
      <div className="sk-empty" style={{ textAlign: 'left' }}>
        HQ has not uploaded the campaign images yet. You can submit the booking now
        and come back to choose images before production starts.
      </div>
    );
  }

  return (
    <div>
      {!bare && (
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

      <div className="sk-imggrid">
        {CAMPAIGN_IMAGES.map((img) => {
          const on = selected.includes(img.id);
          return (
            <button
              key={img.id}
              type="button"
              className={`sk-imgcard${on ? ' sk-imgcard--on' : ''}`}
              aria-pressed={on}
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

      {missing.length > 0 && (
        <div className="sk-login__error" role="alert" style={{ marginTop: 14 }}>
          {missing.length} previously selected image
          {missing.length === 1 ? ' is' : 's are'} no longer in the library:{' '}
          {missing.join(', ')}. Pick a replacement.
        </div>
      )}
    </div>
  );
}
