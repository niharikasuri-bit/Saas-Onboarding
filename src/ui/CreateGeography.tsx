import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, Toast } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { newId, type GeoRow, type GeoSet } from '../lib/model';
import { Field, describedBy } from './StepFrame';
import { AddGeographyDialog, GeoTree } from './GeoTree';
import { OsmMap, countryAt, type Pin } from './OsmMap';
import { InfoNote, SheetIntro, UploadSteps, colLetter } from './Sheet';
import { Crumbs } from './Crumbs';

/**
 * Create a geography, one step at a time:
 * 1. How: by hand, by uploading a file, or by fetching from OpenStreetMap.
 * 2. The country's name.
 * 3. Its levels, largest first.
 * Fetching from OpenStreetMap skips the levels: search a place, fetch, then check.
 * 4. The places, as a table (one column per level, like a spreadsheet) or a tree.
 *
 * Places are kept as rows of names, one cell per level: a row is one path from
 * the largest area down. The tree is built from the same rows.
 */

type Path = string[];
type Step = 'country' | 'levels' | 'method' | 'places';
type Method = 'upload' | 'osm';
const STEPS: Step[] = ['method', 'country', 'levels', 'places'];
/** OpenStreetMap: search and fetch, then check. No levels step. */
const OSM_STEPS: Step[] = ['method', 'country', 'places'];
/** Prototype: the levels and places OpenStreetMap "returns". */
const OSM_LEVELS = ['Region', 'District', 'Sub-district'];
const osmPaths = (): Path[] =>
  [1, 2, 3].flatMap((r) => [1, 2].flatMap((d) => [1, 2].map((x) => [`Region ${r}`, `District ${r}.${d}`, `Sub-district ${r}.${d}.${x}`])));

const blankRow = (n: number): Path => Array.from({ length: n }, () => '');
const fit = (p: Path, n: number): Path => (p.length >= n ? p.slice(0, n) : [...p, ...blankRow(n - p.length)]);

/** A row is fine if its cells are filled from the left with no gaps. Empty rows are ignored. */
function rowProblem(p: Path, levels: string[]): string {
  const last = p.map((c) => c.trim()).findLastIndex(Boolean);
  if (last < 0) return '';
  const gap = p.slice(0, last).findIndex((c) => !c.trim());
  return gap >= 0 ? `Fill in ${levels[gap]} before ${levels[last]}` : '';
}

/** Every distinct place in the rows, with its parent, largest first. */
function toGeoRows(paths: Path[]): GeoRow[] {
  const out: GeoRow[] = [];
  const seen = new Set<string>();
  for (const p of paths) {
    for (let i = 0; i < p.length && p[i].trim(); i++) {
      const key = p.slice(0, i + 1).map((c) => c.trim()).join(' › ');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ key, name: p[i].trim(), level: i, parent: i ? p.slice(0, i).map((c) => c.trim()).join(' › ') : '' });
    }
  }
  return out;
}

/** Back from places to rows of names: one row per place with nothing inside it. */
function toPaths(rows: GeoRow[], n: number): Path[] {
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const parents = new Set(rows.map((r) => r.parent));
  const out = rows
    .filter((r) => !parents.has(r.key))
    .map((r) => {
      const p: string[] = [];
      for (let x: GeoRow | undefined = r; x; x = byKey.get(x.parent)) p.unshift(x.name);
      return fit(p, n);
    });
  return out.length ? out : [blankRow(n)];
}

/** A small CSV reader: commas, quoted cells, and doubled quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') row.push(cell), (cell = '');
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim()));
}

function downloadTemplate(country: string, levels: string[]) {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const url = URL.createObjectURL(new Blob([levels.map(esc).join(',') + '\n'], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(country || 'geography').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function CreateGeography({
  trail,
  initial,
  taken,
  onCancel,
  onCreate,
  verb = 'create',
}: {
  /** Breadcrumbs before "Create a geography". */
  trail: { label: string; onClick?: () => void }[];
  /** How they got here: Create new geography ("create") or Add geographies without the list ("add"). */
  verb?: 'create' | 'add';
  initial: string;
  taken: GeoSet[];
  onCancel: () => void;
  onCreate: (s: GeoSet) => void;
}) {
  const uid = useId();
  const [step, setStep] = useState<Step>('method');
  const [country, setCountry] = useState(initial);
  const [levels, setLevels] = useState<string[]>(['', '']);
  const [method, setMethod] = useState<Method | ''>('');
  const [view, setView] = useState<'table' | 'tree'>('tree');
  const [addingPlace, setAddingPlace] = useState(false);
  // OpenStreetMap: where they pinned their location.
  const [pin, setPin] = useState<Pin | null>(null);
  const osmApi = useRef<{ locate: () => void } | null>(null);
  const [rows, setRows] = useState<Path[]>([blankRow(2), blankRow(2)]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploaded, setUploaded] = useState('');
  // Edit data, from the upload popup: the uploaded rows open on their own edit page
  const [editingFile, setEditingFile] = useState(false);
  // Landing on the uploader, before a file is in: a popup offers the template first
  const [askTemplate, setAskTemplate] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (step === 'places' && method === 'upload' && !uploaded) setAskTemplate(true);
    // Only on arriving at the step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step, editingFile]);

  const steps = method === 'osm' ? OSM_STEPS : STEPS;
  const n = steps.indexOf(step) + 1;
  const go = (s: Step) => {
    setErrors({});
    setStep(s);
  };
  const back = () => {
    // From the edit page, Back returns to the upload step with the file still there
    if (editingFile) {
      setEditingFile(false);
      setErrors({});
      return;
    }
    if (n === 1) onCancel();
    else go(steps[n - 2]);
  };

  const cleanLevels = levels.map((l) => l.trim());
  const filled = rows.filter((r) => r.some((c) => c.trim()));
  const problems = rows.map((r) => rowProblem(r, cleanLevels));
  const places = toGeoRows(filled);

  const next = () => {
    const e: Record<string, string> = {};
    if (step === 'country') {
      let name = country.trim();
      // A pin alone is enough: name it after the country it falls in, or as the pinned location.
      if (!name && method === 'osm' && pin) {
        name = countryAt(pin) ?? 'Pinned location';
        setCountry(name);
      }
      if (!name) e.country = method === 'osm' ? 'Search for your country, or move the map to put the pin on your location' : 'Enter the country’s name';
      else if (taken.some((s) => s.name.toLowerCase() === name.toLowerCase()))
        e.country = `${name} is already here. Search for it instead.`;
    }
    if (step === 'levels') {
      cleanLevels.forEach((l, i) => {
        if (!l) e[`level-${i}`] = 'Enter a name for this level, or remove it';
        else if (cleanLevels.findIndex((x) => x.toLowerCase() === l.toLowerCase()) !== i) e[`level-${i}`] = `${l} is already a level`;
      });
    }
    if (step === 'method' && !method) e.method = `Choose how you’d like to ${verb} your geographies`;
    if (step === 'places') {
      if (method === 'upload' && !uploaded) e.places = 'Upload your filled-in template';
      else if (!places.length) e.places = `Add at least one ${cleanLevels[0] || 'geography'}`;
      else if (problems.some(Boolean)) e.places = 'Some rows have gaps. Fix the highlighted rows.';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      const firstKey = Object.keys(e)[0];
      document.getElementById(`${uid}-${firstKey}`)?.focus();
      return;
    }
    // Fetch straight away: the levels and geographies come back with the search.
    if (step === 'country' && method === 'osm') {
      setLevels(OSM_LEVELS);
      setRows(osmPaths());
    }
    if (step === 'levels') setRows((r) => r.map((p) => fit(p, cleanLevels.length)));
    if (step === 'places') {
      const name = country.trim();
      onCreate({ id: newId(), name, country: name, levels: cleanLevels, count: places.length, custom: true, rows: places });
      return;
    }
    go(steps[n]);
  };

  const TITLES: Record<Step, string> = {
    country: method === 'osm' ? 'Find your location on the map' : 'What is the name of your country?',
    levels: `How is ${country.trim() || 'it'} divided?`,
    method: `How would you like to ${verb} your geographies?`,
    places:
      method === 'upload'
        ? editingFile
          ? 'Edit geography data'
          : 'Upload geography data'
        : method === 'osm'
          ? 'View and edit fetched geography data'
          : 'Add geography data',
  };

  const LEADS: Record<Step, string> = {
    method:
      'Choose how to set up your geography data. Upload a file using the template for bulk setup, or open the map to select them visually.',
    country:
      method === 'osm'
        ? 'Search for your country or use your location, then move the map so the pin sits where you work. We’ll fetch the geographies for that area from OpenStreetMap.'
        : 'Your geography starts here. Everything you add sits inside it.',
    levels: 'List the geography levels from largest to smallest, for example Country, Region, District. This will help us customize your template for bulk upload.',
    places:
      method === 'osm'
        ? 'Review the fetched geographies and edit any row before you create them.'
        : editingFile
          ? 'Edit any row from your file before you upload it.'
          : '',
  };

  // Reviewing fetched geographies, or editing an uploaded file: no white card, the table takes the page.
  // (An uploaded file is first shown in a popup over the upload step.)
  const reviewing = step === 'places' && (method === 'osm' || (method === 'upload' && editingFile));

  return (
    <div className={`cg-page${step === 'places' || (step === 'country' && method === 'osm') ? ' is-wide' : ''}`}>
      <Crumbs items={[...trail, { label: verb === 'add' ? 'Add geographies' : 'Create a geography' }]} />
    <section className={`cg${reviewing ? ' is-bare' : ''}`} aria-labelledby={`${uid}-h`}>
      {reviewing ? (
        <header className="rv-head">
          <div>
            <h1 id={`${uid}-h`} ref={heading} tabIndex={-1}>
              {TITLES[step]}
            </h1>
            <p>{LEADS[step]}</p>
          </div>
          <Button variation="secondary" icon="Add" label="Add geography" onClick={() => setAddingPlace(true)} />
        </header>
      ) : (
      <div className="cg-title-row">
        <h1 id={`${uid}-h`} ref={heading} tabIndex={-1}>
          {TITLES[step]}
        </h1>
        {step === 'places' && method === 'upload' && !editingFile && (
          <div className="cg-title-acts">
            {uploaded && (
              <Button variation="secondary" icon="FileUpload" label="Re-upload" onClick={() => document.getElementById(`${uid}-file`)?.click()} />
            )}
            <Button variation="secondary" icon="FileDownload" label="Download template" onClick={() => downloadTemplate(country.trim(), cleanLevels)} />
          </div>
        )}
      </div>
      )}
      {reviewing ? null : LEADS[step] ? (
        <div className="cg-sub">
          {LEADS[step].split('\n').map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : (
        <div className="cg-gap" />
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        {step === 'country' && method === 'osm' && (
          // OpenStreetMap: search for the country or pin a location; either is enough.
          <OsmMap
            id={`${uid}-pin`}
            apiRef={osmApi}
            query={country}
            pin={pin}
            onPin={(p) => {
              setPin(p);
              // Pinning without searching fills in the country the pin falls in.
              if (p && !country.trim()) {
                const c = countryAt(p);
                if (c) setCountry(c);
              }
              if (p && errors.country) setErrors(({ country: _gone, ...rest }) => rest);
            }}
            search={
              <div className={`fld osm-fld${errors.country ? ' has-error' : ''}`}>
                <label htmlFor={`${uid}-country`} className="osm-label">
                  Search by country
                </label>
                <div className="geo-search">
                  <Icon name="Search" size={20} />
                  <input
                    id={`${uid}-country`}
                    type="search"
                    value={country}
                    placeholder="For example Kenya"
                    autoComplete="country-name"
                    aria-invalid={!!errors.country || undefined}
                    aria-describedby={errors.country ? `${uid}-country-err` : undefined}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
                {errors.country && (
                  <p className="fld-error" id={`${uid}-country-err`}>
                    <span className="ux-visually-hidden">Error: </span>
                    {errors.country}
                  </p>
                )}
              </div>
            }
          />
        )}
        {step === 'country' && method !== 'osm' && (
          <div className="cg-split">
          <Field id={`${uid}-country`} label="Country name" error={errors.country}>
            <input
              id={`${uid}-country`}
              type="text"
              value={country}
              autoComplete="country-name"
              aria-invalid={!!errors.country || undefined}
              aria-describedby={describedBy(`${uid}-country`, undefined, errors.country)}
              onChange={(e) => setCountry(e.target.value)}
            />
          </Field>
          </div>
        )}

        {step === 'levels' && <LevelsEditor uid={uid} levels={levels} errors={errors} onChange={setLevels} />}

        {step === 'method' && (
          <fieldset className={`qz-tiles cg-tiles${errors.method ? ' has-error' : ''}`} aria-describedby={errors.method ? `${uid}-method-error` : undefined}>
            <legend className="ux-visually-hidden">How would you like to {verb} your geographies?</legend>
            {errors.method && (
              <p id={`${uid}-method-error`} className="fld-error">
                <span className="ux-visually-hidden">Error: </span>
                {errors.method}
              </p>
            )}
            <div className="qz-tile-row">
              {(
                [
                  ['upload', 'FileUpload', 'Bulk Upload Geography Data'],
                  ['osm', 'Public', 'Fetch from OpenStreetMap'],
                ] as const
              ).map(([value, icon, title], i) => (
                <label key={value} className={`qz-tile${method === value ? ' is-on' : ''}`}>
                  <input
                    type="radio"
                    name={`${uid}-method`}
                    id={i === 0 ? `${uid}-method` : undefined}
                    value={value}
                    checked={method === value}
                    onChange={() => setMethod(value)}
                  />
                  <span className="cg-tile-icon" aria-hidden="true">
                    <Icon name={icon} size={28} />
                  </span>
                  <span className="qz-tile-label">{title}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {step === 'places' && (
          <div className="cg-places">
            {method === 'upload' && !editingFile && (
              <Upload
                uid={uid}
                levels={cleanLevels}
                uploaded={uploaded}
                rows={rows}
                problems={problems}
                count={places.length}
                error={errors.places}
                onRows={(r, file) => {
                  setRows(r.length ? r.map((p) => fit(p, cleanLevels.length)) : [blankRow(cleanLevels.length)]);
                  setUploaded(file);
                  setErrors({});
                }}
                onRemove={() => {
                  setUploaded('');
                  setRows([blankRow(cleanLevels.length)]);
                  setToast('File removed');
                }}
                onCreate={next}
                onEdit={() => setEditingFile(true)}
              />
            )}
            {(method === 'osm' || editingFile) && (
              <>
                <div className="cg-places-bar">
                  <div className="pt-tabs" role="group" aria-label="View as">
                    <button type="button" aria-pressed={view === 'tree'} onClick={() => setView('tree')}>
                      <Icon name="AccountTree" size={18} />
                      Tree
                    </button>
                    <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>
                      <Icon name="TableView" size={18} />
                      Table
                    </button>
                  </div>
                </div>
                {addingPlace && (
                  <AddGeographyDialog
                    levels={cleanLevels}
                    rows={places}
                    onAdd={(r) => setRows([...toPaths([...places, r], cleanLevels.length), ...rows.filter((_, i) => problems[i])])}
                    onClose={() => setAddingPlace(false)}
                  />
                )}
                {errors.places && (
                  <p id={`${uid}-places`} className="fld-error" tabIndex={-1}>
                    <span className="ux-visually-hidden">Error: </span>
                    {errors.places}
                  </p>
                )}
                <div className="pt-panel">
                <SheetIntro action={editingFile ? 'Upload data' : 'Create geographies'} tree={view === 'tree'} />
                {view === 'table' ? (
                  <Grid
                    levels={cleanLevels}
                    rows={rows}
                    problems={problems}
                    onChange={setRows}
                  />
                ) : (
                  <GeoTree
                    root={country.trim()}
                    levels={cleanLevels}
                    rows={places}
                    // Rows with gaps can't sit in the tree; keep them for the table.
                    onChange={(r) => setRows([...toPaths(r, cleanLevels.length), ...rows.filter((_, i) => problems[i])])}
                  />
                )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Enter in a field moves on; the visible buttons are in the footer */}
        <button type="submit" className="ux-visually-hidden" tabIndex={-1} aria-hidden="true" />
      </form>
    </section>
      {askTemplate && (
      <TemplateDialog
        onDownload={() => downloadTemplate(country.trim(), cleanLevels)}
        onClose={() => setAskTemplate(false)}
      />
    )}
      <div className="cg-toast" role="status" aria-live="polite">
        {toast && <Toast type="success" label={toast} onClose={() => setToast('')} />}
      </div>
      <footer className="cg-bar">
        <Button
          variation="secondary"
          icon="ArrowBack"
          label="Back"
          title={n === 1 ? 'Back to add your geographies' : 'Back to the previous step'}
          onClick={back}
        />
        <Button
          variation="primary"
          label={step === 'places' ? (editingFile ? 'Upload data' : 'Create geographies') : 'Next'}
          icon={step === 'places' ? undefined : 'ArrowForward'}
          isSuffix
          onClick={next}
        />
      </footer>
    </div>
  );
}

/** Spreadsheet-style table: one row per path, one editable cell per level. */
function Grid({
  levels,
  rows,
  problems,
  onChange,
}: {
  levels: string[];
  rows: Path[];
  problems: string[];
  onChange: (r: Path[]) => void;
}) {
  const set = (i: number, j: number, v: string) => onChange(rows.map((r, a) => (a === i ? r.map((c, b) => (b === j ? v : c)) : r)));
  return (
    <div className="cg-grid-wrap">
      <table className="cg-grid is-sheet">
        <thead>
          <tr className="sheet-letters" aria-hidden="true">
            <td className="cg-grid-n" />
            {levels.map((l, j) => (
              <td key={l}>{colLetter(j)}</td>
            ))}
            <td className="cg-grid-x" />
          </tr>
          <tr>
            <th scope="col" className="cg-grid-n">
              <span className="ux-visually-hidden">Row</span>
            </th>
            {levels.map((l, j) => (
              <th key={l} scope="col" className={j === 0 ? 'is-req' : 'is-opt'}>
                {l}
                <span className="ux-visually-hidden">{j === 0 ? ' (required)' : ' (optional)'}</span>
              </th>
            ))}
            <th scope="col" className="cg-grid-x">
              <span className="ux-visually-hidden">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={problems[i] ? 'has-error' : undefined}>
              <td className="cg-grid-n">{i + 1}</td>
              {r.map((c, j) => (
                <td key={j}>
                  <input
                    value={c}
                    aria-label={`${levels[j]}, row ${i + 1}`}
                    aria-invalid={(!!problems[i] && !c.trim() && j < r.map((x) => x.trim()).findLastIndex(Boolean)) || undefined}
                    onChange={(e) => set(i, j, e.target.value)}
                    onKeyDown={(e) => {
                      // Enter moves down a row, adding one at the end, like a spreadsheet.
                      if (e.key !== 'Enter') return;
                      e.preventDefault();
                      const body = e.currentTarget.closest('tbody');
                      // The next row starts with this row's places above the current column.
                      const below = fit(r.slice(0, j), r.length);
                      if (i === rows.length - 1) onChange([...rows, below]);
                      else if (rows[i + 1].every((x) => !x.trim())) onChange(rows.map((x, a) => (a === i + 1 ? below : x)));
                      requestAnimationFrame(() => (body?.rows[i + 1]?.cells[j + 1]?.querySelector('input') as HTMLInputElement | null)?.focus());
                    }}
                  />
                </td>
              ))}
              <td className="cg-grid-x">
                <button
                  type="button"
                  className="cg-icon-btn"
                  aria-label={`Remove row ${i + 1}`}
                  onClick={() => onChange(rows.length > 1 ? rows.filter((_, a) => a !== i) : [blankRow(levels.length)])}
                >
                  <Icon name="Delete" size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="sh-add-row">
        <Button
          variation="secondary"
          icon="Add"
          label="Add row"
          onClick={() => {
            onChange([...rows, blankRow(levels.length)]);
            requestAnimationFrame(() => (document.querySelector('.cg-grid.is-sheet tbody tr:last-child input') as HTMLInputElement | null)?.focus());
          }}
        />
      </div>
      {problems.some(Boolean) && (
        <ul className="cg-grid-problems">
          {problems.map((p, i) => (p ? <li key={i}>Row {i + 1}: {p}</li> : null))}
        </ul>
      )}
    </div>
  );
}

/**
 * Boundary levels, largest first. Each row: a handle to reorder (drag it, or
 * focus it and use the up and down arrow keys), the level number, its name,
 * and remove.
 */
function LevelsEditor({
  uid,
  levels,
  errors,
  onChange,
}: {
  uid: string;
  levels: string[];
  errors: Record<string, string>;
  onChange: (l: string[]) => void;
}) {
  const [armed, setArmed] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [moved, setMoved] = useState('');
  const move = (from: number, to: number) => {
    if (to < 0 || to >= levels.length || from === to) return;
    const next = [...levels];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
    setMoved(`${x || 'Level'} moved to level ${to + 1} of ${levels.length}`);
    requestAnimationFrame(() => document.getElementById(`${uid}-handle-${to}`)?.focus());
  };
  return (
    <div className="lv">
      <p className="lv-h" id={`${uid}-lv-h`}>
        Geography levels
      </p>
      <ol className="lv-list" aria-labelledby={`${uid}-lv-h`}>
        {levels.map((l, i) => {
          const err = errors[`level-${i}`];
          return (
            <li
              key={i}
              className={`lv-row${err ? ' has-error' : ''}${dragging === i ? ' is-dragging' : ''}`}
              draggable={armed === i}
              onDragStart={(e) => {
                setDragging(i);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => {
                setDragging(null);
                setArmed(null);
              }}
              onDragOver={(e) => dragging !== null && e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragging !== null) move(dragging, i);
                setDragging(null);
                setArmed(null);
              }}
            >
              <button
                type="button"
                id={`${uid}-handle-${i}`}
                className="lv-handle"
                aria-label={`Reorder level ${i + 1}${l ? `, ${l}` : ''}. Use the up and down arrow keys.`}
                onMouseDown={() => setArmed(i)}
                onMouseUp={() => setArmed(null)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') e.preventDefault(), move(i, i - 1);
                  if (e.key === 'ArrowDown') e.preventDefault(), move(i, i + 1);
                }}
              >
                <Icon name="DragIndicator" size={20} />
              </button>
              <label htmlFor={`${uid}-level-${i}`} className="lv-n">
                Level {i + 1}
              </label>
              <div className="lv-field">
                <input
                  id={`${uid}-level-${i}`}
                  value={l}
                  placeholder={['e.g. State', 'e.g. District', 'e.g. Ward'][i] ?? 'Level name'}
                  aria-invalid={!!err || undefined}
                  aria-describedby={err ? `${uid}-level-${i}-error` : undefined}
                  onChange={(e) => onChange(levels.map((x, j) => (j === i ? e.target.value : x)))}
                />
                {err && (
                  <p id={`${uid}-level-${i}-error`} className="fld-error">
                    <span className="ux-visually-hidden">Error: </span>
                    {err}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="lv-remove"
                aria-label={`Remove level ${i + 1}${l ? `, ${l}` : ''}`}
                disabled={levels.length === 1}
                onClick={() => onChange(levels.filter((_, j) => j !== i))}
              >
                <Icon name="Delete" size={18} />
              </button>
            </li>
          );
        })}
      </ol>
      <p className="ux-visually-hidden" role="status">
        {moved}
      </p>
      <div className="lv-add">
        <Button variation="secondary" icon="Add" label="Add level" onClick={() => onChange([...levels, ''])} />
      </div>
    </div>
  );
}

/**
 * Bulk upload: a drop area, or once a file is in, the file (View data, Re-upload, remove).
 * Uploading opens a popup with the data about to be created, so they never leave this step.
 */
function Upload({
  uid,
  levels,
  uploaded,
  rows,
  problems,
  count,
  error: stepError,
  onRows,
  onRemove,
  onCreate,
  onEdit,
}: {
  uid: string;
  levels: string[];
  uploaded: string;
  rows: Path[];
  problems: string[];
  count: number;
  error?: string;
  onRows: (rows: Path[], file: string) => void;
  onRemove: () => void;
  onCreate: () => void;
  onEdit: () => void;
}) {
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const [showing, setShowing] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const take = async (f: File | undefined) => {
    if (!f) return;
    const data = parseCsv(await f.text());
    const head = (data[0] ?? []).map((c) => c.trim().toLowerCase());
    if (head.join(',') !== levels.map((l) => l.toLowerCase()).join(',')) {
      setError(`The columns should be ${levels.join(', ')}, in that order. Download the template and try again.`);
      return;
    }
    setError('');
    onRows(data.slice(1), f.name);
    setShowing(true);
  };
  const browse = () => input.current?.click();
  const remove = () => {
    setShowing(false);
    setError('');
    onRemove();
    requestAnimationFrame(() => document.getElementById(`${uid}-browse`)?.focus());
  };
  const file = (inDialog: boolean) => (
    <div className={`up-file${inDialog ? ' is-dialog' : ''}`}>
      <span className="up-file-badge" aria-hidden="true">
        {fileExt(uploaded)}
      </span>
      <span className="up-file-name">{uploaded}</span>
      <span className="up-file-tags">
        <span className="geo-tag">
          {count.toLocaleString('en')} {count === 1 ? 'geography' : 'geographies'}
        </span>
        <span className="geo-tag">
          {levels.length} {levels.length === 1 ? 'level' : 'levels'}
        </span>
      </span>
      <span className="up-file-acts">
        {!inDialog && (
          <button type="button" id={`${uid}-view`} className="up-file-btn" onClick={() => setShowing(true)}>
            <Icon name="Visibility" size={18} />
            View data
          </button>
        )}
        <button type="button" className="ag-x is-sm up-file-x" aria-label={`Remove ${uploaded}`} onClick={remove}>
          <Icon name={inDialog ? 'Delete' : 'Close'} size={20} />
        </button>
      </span>
    </div>
  );
  return (
    <>
    {!uploaded && <UploadSteps thing="geography" preview />}
    <div className="up" role="group" aria-label="Upload a file">
      <input
        ref={input}
        id={`${uid}-file`}
        className="ux-visually-hidden"
        type="file"
        accept=".csv,text/csv"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {uploaded ? (
        file(false)
      ) : (
        <div
          className={`up-drop${over ? ' is-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            take(e.dataTransfer.files?.[0]);
          }}
        >
          <Icon name="FileUpload" size={40} />
          <p>
            Drag and drop your file or{' '}
            <button type="button" id={`${uid}-browse`} className="up-browse" onClick={browse}>
              Browse in my files
            </button>
          </p>
        </div>
      )}
      {(error || stepError) && !showing && (
        <p id={`${uid}-places`} className="fld-error" role="alert" tabIndex={-1}>
          {error || stepError}
        </p>
      )}
    </div>
    {showing && uploaded && (
      <UploadPreview
        levels={levels}
        rows={rows}
        problems={problems}
        file={file(true)}
        error={error || stepError}
        onClose={() => {
          setShowing(false);
          requestAnimationFrame(() => document.getElementById(`${uid}-view`)?.focus());
        }}
        onCreate={onCreate}
        onEdit={onEdit}
      />
    )}
    </>
  );
}

/** On landing at the uploader: download the template first, then fill it in and upload it here. */
function TemplateDialog({ onDownload, onClose }: { onDownload: () => void; onClose: () => void }) {
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    requestAnimationFrame(() => head.current?.focus());
  }, []);
  const close = () => {
    ref.current?.close();
    onClose();
  };
  return createPortal(
    <dialog
      ref={ref}
      className="ag tpl"
      aria-labelledby={`${uid}-h`}
      aria-describedby={`${uid}-d`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="tpl-top">
        <h2 id={`${uid}-h`} ref={head} tabIndex={-1}>
          <Icon name="ErrorOutline" size={28} />
          Download geography template
        </h2>
        <button type="button" className="ag-x" aria-label="Close" onClick={close}>
          <Icon name="Close" size={22} />
        </button>
      </div>
      <div id={`${uid}-d`} className="tpl-body">
        <p>To add your geography data, download the Excel template below.</p>
        <p>Fill in the required information and upload the completed file on this page.</p>
      </div>
      <div className="tpl-foot">
        <Button variation="secondary" label="Cancel" onClick={close} />
        <Button
          variation="primary"
          icon="FileDownload"
          label="Download template"
          onClick={() => {
            onDownload();
            close();
          }}
        />
      </div>
    </dialog>,
    document.body,
  );
}

const fileExt = (name: string) => '.' + (name.split('.').pop() || 'csv').toLowerCase();

/** The popup after uploading: the file, then its rows as a read-only sheet, then Create geographies. */
function UploadPreview({
  levels,
  rows,
  problems,
  file,
  error,
  onClose,
  onCreate,
  onEdit,
}: {
  levels: string[];
  rows: Path[];
  problems: string[];
  file: ReactNode;
  error?: string;
  onClose: () => void;
  onCreate: () => void;
  onEdit: () => void;
}) {
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    requestAnimationFrame(() => head.current?.focus());
  }, []);
  const close = () => {
    ref.current?.close();
    onClose();
  };
  const shown = rows.filter((r) => r.some((c) => c.trim()));
  const bad = problems.map((_, i) => (problems[i] ? i : -1)).filter((i) => i >= 0);
  // Numbered as on the edit page, so a row is the same number in both
  const rowNo = (r: Path) => rows.indexOf(r) + 1;
  return createPortal(
    <dialog
      ref={ref}
      className="ag upv"
      aria-labelledby={`${uid}-h`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="upv-top">
        <div className="upv-title">
          <h2 id={`${uid}-h`} ref={head} tabIndex={-1}>
            Review uploaded geography data
          </h2>
          {file}
        </div>
        <button type="button" className="ag-x" aria-label="Close" onClick={close}>
          <Icon name="Close" size={22} />
        </button>
      </div>
      <div className="upv-body">
        <InfoNote icon="Info" title="Need to make changes?">
          Select Edit data to change any row before you upload it.
        </InfoNote>
        {(error || bad.length > 0) && (
          <p className="fld-error" role="alert">
            <span className="ux-visually-hidden">Error: </span>
            {bad.length
              ? `${bad.length === 1 ? 'Row' : 'Rows'} ${bad.map((i) => i + 1).join(', ')} ${bad.length === 1 ? 'has' : 'have'} gaps. Select Edit data to fix ${bad.length === 1 ? 'it' : 'them'}.`
              : error}
          </p>
        )}
        <div className="upv-sheet" tabIndex={0} role="region" aria-label="Data in your file">
          <table className="cg-grid is-sheet is-read">
            <thead>
              <tr className="sheet-letters" aria-hidden="true">
                <td className="cg-grid-n" />
                {levels.map((l, j) => (
                  <td key={l}>{colLetter(j)}</td>
                ))}
              </tr>
              <tr>
                <th scope="col" className="cg-grid-n">
                  <span className="ux-visually-hidden">Row</span>
                </th>
                {levels.map((l) => (
                  <th key={l} scope="col">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={rowNo(r)} className={problems[rows.indexOf(r)] ? 'has-error' : undefined}>
                  <td className="cg-grid-n">{rowNo(r)}</td>
                  {r.map((c, j) => (
                    <td key={j}>{c || (problems[rows.indexOf(r)] && j < r.map((x) => x.trim()).findLastIndex(Boolean) ? <span className="upv-gap">Missing</span> : '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="ag-foot">
        <Button
          variation="secondary"
          icon="Edit"
          label="Edit data"
          onClick={() => {
            ref.current?.close();
            onEdit();
          }}
        />
        <Button variation="primary" icon="FileUpload" label="Upload data" onClick={onCreate} />
      </div>
    </dialog>,
    document.body,
  );
}

