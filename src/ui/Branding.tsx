import { useId, useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { BRAND_COLOURS } from '../lib/model';
import { Field, Page, describedBy } from './StepFrame';

/** Branding with a live preview of what citizens and staff will see. */
export function Branding() {
  const { account, update } = useAccount();
  const uid = useId();
  const [draft, setDraft] = useState(account.branding);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const saved = account.branding.saved;
  const missing = [!draft.logo && 'a logo', !draft.colour && 'a colour'].filter(
    Boolean,
  ) as string[];

  const pickFile = (f?: File) => {
    if (!f) return;
    if (!/image\/(png|svg\+xml)/.test(f.type)) return setError('Choose a PNG or SVG file');
    setError('');
    // A data URL, so the logo survives a reload.
    const r = new FileReader();
    r.onload = () => setDraft((d) => ({ ...d, logo: String(r.result) }));
    r.readAsDataURL(f);
  };

  const save = () => {
    if (!draft.name.trim()) return setError('Enter your account name');
    update((a) => ({ ...a, branding: { ...draft, name: draft.name.trim(), saved: true } }));
  };

  return (
    <Page
      title="Branding"
      lead="Your logo, name and colour, as citizens and staff see them across every service."
    >
      <div className="split">
        <form
          className="card form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          noValidate
        >
          <Field
            id={`${uid}-name`}
            label="Account name"
            hint="What citizens see. It can be different from your legal name."
            error={error && !draft.name.trim() ? error : undefined}
          >
            <input
              id={`${uid}-name`}
              value={draft.name}
              aria-describedby={describedBy(
                `${uid}-name`,
                'x',
                error && !draft.name.trim() ? error : '',
              )}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>

          <div className="fld">
            <span className="fld-label" id={`${uid}-logo-l`}>
              Logo
            </span>
            <p className="fld-hint">PNG or SVG, at least 128 pixels square.</p>
            {error && draft.name.trim() && <p className="fld-error">{error}</p>}
            <label
              className={`drop${dragging ? ' is-over' : ''}${draft.logo ? ' has-file' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pickFile(e.dataTransfer.files[0]);
              }}
            >
              <input
                type="file"
                accept="image/png,image/svg+xml"
                aria-labelledby={`${uid}-logo-l`}
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              {draft.logo ? (
                <>
                  <img src={draft.logo} alt="Your logo" className="drop-img" />
                  <span>
                    <strong>Logo added.</strong> Choose another to replace it.
                  </span>
                </>
              ) : (
                <>
                  <span className="drop-icon" aria-hidden="true">
                    <Icon name="CloudUpload" size={22} />
                  </span>
                  <span>
                    <strong>Choose a file</strong> or drag it here
                  </span>
                </>
              )}
            </label>
          </div>

          <fieldset className="fld">
            <legend className="fld-label">Main colour</legend>
            <p className="fld-hint">
              Used for buttons and headers. All of these are readable on white.
            </p>
            <div className="swatches">
              {BRAND_COLOURS.map((c) => (
                <label
                  key={c.value}
                  className={`swatch${draft.colour === c.value ? ' is-on' : ''}`}
                >
                  <input
                    type="radio"
                    name={`${uid}-colour`}
                    checked={draft.colour === c.value}
                    onChange={() => setDraft({ ...draft, colour: c.value })}
                  />
                  <i style={{ background: c.value }} aria-hidden="true" />
                  {c.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-foot">
            <Button variation="primary" label="Save Branding" submit onClick={() => {}} />
            {saved && (
              <p className="form-note" role="status">
                Saved.{missing.length > 0 && ` You can add ${missing.join(' and ')} any time.`}
              </p>
            )}
          </div>
        </form>

        <Preview name={draft.name} logo={draft.logo} colour={draft.colour} />
      </div>
    </Page>
  );
}

function Preview({ name, logo, colour }: { name: string; logo: string; colour: string }) {
  const c = colour || '#505A5F';
  return (
    <figure className="pv" aria-label="Live preview">
      <figcaption>Live preview</figcaption>
      <div className="pv-phone">
        <div className="pv-bar" style={{ background: c }}>
          {logo ? (
            <img src={logo} alt="" />
          ) : (
            <span className="pv-mark">{(name[0] ?? '?').toUpperCase()}</span>
          )}
          <span>{name || 'Your account'}</span>
        </div>
        <div className="pv-body">
          <p className="pv-title">Report a problem</p>
          <p className="pv-sub">Tell us what’s wrong and where.</p>
          <span className="pv-field" />
          <span className="pv-field is-short" />
          <span className="pv-btn" style={{ background: c }}>
            Continue
          </span>
        </div>
      </div>
      <p className="pv-cap">The citizen app</p>
    </figure>
  );
}
