import { useId, useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { GEO_SETS, REFERENCE_AREAS, newId, type Account, type Area, type GeoSet } from '../lib/model';
import { Field, describedBy } from './StepFrame';

/**
 * The Geographies page: what geographies are, one search (by name, country,
 * level or status), and the results as cards or a list, like a file browser.
 * Each geography can be added to the account or downloaded. When nothing
 * matches, an empty state offers to create it.
 */

type Row = { name: string; level: number; parent: string };

/** Every geography inside a set, largest first. Nairobi is real; the rest are sample rows. */
function rowsOf(set: GeoSet): Row[] {
  if (set.id === 'nairobi') return REFERENCE_AREAS.map((r) => ({ name: r.name, level: r.level, parent: r.parent }));
  const rows: Row[] = [{ name: set.name, level: 0, parent: '' }];
  let above = [set.name];
  let left = set.count - 1;
  for (let l = 1; l < set.levels.length && left > 0; l++) {
    const last = l === set.levels.length - 1;
    const n = last ? left : Math.max(1, Math.min(left, Math.round(left * 0.2)));
    const names = Array.from({ length: n }, (_, i) => `${set.levels[l]} ${i + 1}`);
    names.forEach((name, i) => rows.push({ name, level: l, parent: above[i % above.length] }));
    above = names;
    left -= n;
  }
  return rows;
}

/** Add a set's geographies to the account, keeping the parent links. */
function addSet(a: Account, set: GeoSet): Account {
  const areas: Area[] = [...a.geography.areas];
  const ids = new Map<string, string>();
  for (const r of rowsOf(set)) {
    const id = newId();
    ids.set(r.name, id);
    areas.push({ id, name: r.name, level: r.level, parentId: r.parent ? ids.get(r.parent) ?? null : null });
  }
  return { ...a, geography: { ...a.geography, areas, sets: [...(a.geography.sets ?? []), set.id] } };
}

function download(set: GeoSet) {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = ['Name,Level,Sits inside', ...rowsOf(set).map((r) => [r.name, set.levels[r.level] ?? '', r.parent].map(esc).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${set.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-geographies.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const COUNTRIES = [...new Set(GEO_SETS.map((s) => s.country))].sort();
const TOP_LEVELS = ['Country', 'State', 'Region', 'County', 'City', 'District', 'Municipality'];

export function Geographies() {
  const { account, update } = useAccount();
  const uid = useId();
  const [q, setQ] = useState('');
  const [view, setView] = useState<'cards' | 'list'>('cards');
  const [creating, setCreating] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const added = new Set(account.geography.sets ?? []);
  const all = [...GEO_SETS, ...(account.geography.custom ?? [])];
  const status = (s: GeoSet) => (added.has(s.id) ? 'Active' : 'Inactive');
  const term = q.trim().toLowerCase();
  const hits = all.filter(
    (s) =>
      !term ||
      [s.name, s.country, ...s.levels].some((x) => x.toLowerCase().includes(term)) ||
      status(s).toLowerCase().startsWith(term),
  );

  const add = (s: GeoSet) => {
    update((a) => addSet(a, s));
    setMsg(`${s.name} added to your account.`);
  };

  return (
    <div className="geo">
      <header className="geo-head">
        <h1 tabIndex={-1}>Geographies</h1>
        <p className="geo-lead">
          Geographies are the places your organisation serves, from the largest area down to the smallest. Every
          product uses them to know where things happen, so work reaches the right place.
        </p>
      </header>

      <div className="geo-bar">
        <div className="geo-search">
          <label htmlFor={`${uid}-q`} className="ux-visually-hidden">
            Search geographies
          </label>
          <Icon name="Search" size={20} />
          <input
            id={`${uid}-q`}
            type="search"
            placeholder="Search by name, country, level or status"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCreating(null);
              setMsg('');
            }}
          />
        </div>
        <div className="geo-view" role="group" aria-label="View as">
          <button type="button" aria-pressed={view === 'cards'} onClick={() => setView('cards')}>
            <Icon name="GridView" size={18} />
            Cards
          </button>
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
            <Icon name="List" size={18} />
            List
          </button>
        </div>
      </div>

      <p className="geo-count" role="status">
        {msg || (term ? `${hits.length} ${hits.length === 1 ? 'geography' : 'geographies'} found` : `${all.length} geographies`)}
      </p>

      {creating !== null ? (
        <CreateGeography
          initial={creating}
          taken={all}
          onCancel={() => setCreating(null)}
          onCreate={(s) => {
            update((a) => addSet({ ...a, geography: { ...a.geography, custom: [...(a.geography.custom ?? []), s] } }, s));
            setCreating(null);
            setQ(s.name);
            setMsg(`${s.name} created and added to your account.`);
          }}
        />
      ) : !hits.length ? (
        <div className="geo-empty">
          <EmptyGlobe />
          <h2>No geographies found</h2>
          <p>
            Nothing matches “{q.trim()}”. Try another search, or create this geography yourself.
          </p>
          <Button variation="primary" icon="Add" label={`Create “${q.trim()}”`} onClick={() => setCreating(q.trim())} />
        </div>
      ) : view === 'cards' ? (
        <ul className="geo-cards">
          {hits.map((s) => (
            <li key={s.id} className="geo-card">
              <div className="geo-card-top">
                <span className="geo-icon" aria-hidden="true">
                  <Icon name="Public" size={20} />
                </span>
                <Status active={added.has(s.id)} />
              </div>
              <h2>{s.name}</h2>
              <p className="geo-stats">
                <span>
                  <strong>{s.levels.length}</strong> {s.levels.length === 1 ? 'level' : 'levels'}
                </span>
                <span>
                  <strong>{s.count.toLocaleString('en')}</strong> {s.count === 1 ? 'geography' : 'geographies'}
                </span>
              </p>
              <p className="geo-levels">
                <span className="geo-tag">{s.levels.join(' › ')}</span>
              </p>
              <div className="geo-actions">
                {added.has(s.id) ? (
                  <p className="geo-added">
                    <Icon name="CheckCircle" size={18} />
                    Added to your account
                  </p>
                ) : (
                  <Button variation="primary" icon="Add" label="Add geographies to account" onClick={() => add(s)} />
                )}
                <Button variation="secondary" icon="FileDownload" label="Download geography data" onClick={() => download(s)} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="geo-table-wrap">
          <table className="geo-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Country</th>
                <th scope="col">Levels</th>
                <th scope="col">Level names</th>
                <th scope="col">Geographies</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hits.map((s) => (
                <tr key={s.id}>
                  <th scope="row">{s.name}</th>
                  <td>{s.country}</td>
                  <td>{s.levels.length}</td>
                  <td>
                    <span className="geo-tag">{s.levels.join(' › ')}</span>
                  </td>
                  <td>{s.count.toLocaleString('en')}</td>
                  <td>
                    <Status active={added.has(s.id)} />
                  </td>
                  <td>
                    <div className="geo-row-actions">
                      {added.has(s.id) ? (
                        <p className="geo-added">Added</p>
                      ) : (
                        <Button variation="primary" size="small" label="Add to account" title={`Add ${s.name} to your account`} onClick={() => add(s)} />
                      )}
                      <Button variation="secondary" size="small" label="Download" title={`Download ${s.name} data`} onClick={() => download(s)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Status({ active }: { active: boolean }) {
  return <span className={`geo-status${active ? ' is-active' : ''}`}>{active ? 'Active' : 'Inactive'}</span>;
}

/** Create a geography that isn't in the catalogue: its name, country and largest level. */
function CreateGeography({
  initial,
  taken,
  onCancel,
  onCreate,
}: {
  initial: string;
  taken: GeoSet[];
  onCancel: () => void;
  onCreate: (s: GeoSet) => void;
}) {
  const uid = useId();
  const [f, setF] = useState({ name: initial, country: '', level: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = () => {
    const name = f.name.trim();
    const e: Record<string, string> = {};
    if (!name) e.name = 'Enter the geography’s name';
    else if (taken.some((s) => s.name.toLowerCase() === name.toLowerCase() && (!f.country || s.country === f.country)))
      e.name = `${name} is already here. Search for it instead.`;
    if (!f.country) e.country = 'Choose the country';
    if (!f.level) e.level = 'Choose its level';
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`${uid}-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    onCreate({ id: newId(), name, country: f.country, levels: [f.level], count: 1, custom: true });
  };

  return (
    <section className="geo-create" aria-labelledby={`${uid}-h`}>
      <h2 id={`${uid}-h`}>Create a geography</h2>
      <p className="geo-create-lead">You can add the areas inside it afterwards.</p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field id={`${uid}-name`} label="Geography name" error={errors.name}>
          <input
            id={`${uid}-name`}
            value={f.name}
            aria-invalid={!!errors.name || undefined}
            aria-describedby={describedBy(`${uid}-name`, undefined, errors.name)}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
        </Field>
        <div className="row">
          <Field id={`${uid}-country`} label="Country" error={errors.country}>
            <select
              id={`${uid}-country`}
              value={f.country}
              aria-invalid={!!errors.country || undefined}
              aria-describedby={describedBy(`${uid}-country`, undefined, errors.country)}
              onChange={(e) => setF({ ...f, country: e.target.value })}
            >
              <option value="">Choose</option>
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field id={`${uid}-level`} label="Level" error={errors.level}>
            <select
              id={`${uid}-level`}
              value={f.level}
              aria-invalid={!!errors.level || undefined}
              aria-describedby={describedBy(`${uid}-level`, undefined, errors.level)}
              onChange={(e) => setF({ ...f, level: e.target.value })}
            >
              <option value="">Choose</option>
              {TOP_LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="form-foot">
          <Button variation="primary" label="Create geography" submit onClick={() => {}} />
          <Button variation="link" label="Cancel" onClick={onCancel} />
        </div>
      </form>
    </section>
  );
}

/** A globe with a plus: nothing found, but you can make it. */
function EmptyGlobe() {
  return (
    <svg className="geo-empty-art" width="120" height="104" viewBox="0 0 120 104" aria-hidden="true" focusable="false">
      <circle cx="56" cy="52" r="44" fill="#EEF3F5" stroke="#0B4B66" strokeOpacity="0.35" strokeWidth="2" />
      <ellipse cx="56" cy="52" rx="18" ry="44" fill="none" stroke="#0B4B66" strokeOpacity="0.35" strokeWidth="2" />
      <path d="M12 52h88M18 30h76M18 74h76" fill="none" stroke="#0B4B66" strokeOpacity="0.35" strokeWidth="2" />
      <circle cx="82" cy="28" r="5" fill="#C84C0E" />
      <circle cx="34" cy="62" r="4" fill="#0B4B66" fillOpacity="0.6" />
      <circle cx="62" cy="78" r="3" fill="#0B4B66" fillOpacity="0.45" />
      <circle cx="98" cy="88" r="13" fill="#fff" stroke="#0B4B66" strokeOpacity="0.5" strokeWidth="2" />
      <path d="M98 82v12M92 88h12" stroke="#0B4B66" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
