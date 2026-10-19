import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { GEO_SETS, REFERENCE_AREAS, newId, type Account, type Area, type GeoSet } from '../lib/model';
import { Field, describedBy } from './StepFrame';

/**
 * The Geographies page, in two states, both centred at the top:
 * - Adding (first visit, or after "Add geographies"): "Add your geographies",
 *   then one search over everything DIGIT holds, as cards or a list. Each can
 *   be added or downloaded; when nothing matches, an empty state offers to
 *   create it. Adding one goes back to the account's geographies.
 * - Added: "Geographies" and what they are, an "Add geographies" button, and
 *   the account's own geographies.
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

/** embedded: shown inside Home's account setup; always adding, and onDone goes back. */
export function Geographies({ embedded, onDone }: { embedded?: boolean; onDone?: () => void } = {}) {
  const { account, update } = useAccount();
  const uid = useId();
  const [q, setQ] = useState('');
  const [view, setView] = useState<'cards' | 'list'>('cards');
  const [creating, setCreating] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const added = new Set(account.geography.sets ?? []);
  const [addingChosen, setAdding] = useState(!added.size);
  const adding = embedded || addingChosen || !added.size;
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (embedded) heading.current?.focus();
    } else heading.current?.focus();
  }, [adding]);

  const catalogue = [...GEO_SETS, ...(account.geography.custom ?? [])];
  // Adding shows only what isn't in the account yet; the overview shows only what is.
  const all = catalogue.filter((s) => (adding ? !added.has(s.id) : added.has(s.id)));
  // A geography in the account turns active once a product using it is live.
  const anyLive = (['hcm', 'cms', 'lnp'] as const).some((k) => account.products[k].enabled && account.products[k].live);
  const status = (s: GeoSet) => (added.has(s.id) ? (anyLive ? 'Active' : 'Inactive') : '');
  const term = q.trim().toLowerCase();
  const startAdding = () => {
    setQ('');
    setMsg('');
    setAdding(true);
  };
  const hits = all.filter(
    (s) =>
      !term ||
      [s.name, s.country, ...s.levels].some((x) => x.toLowerCase().includes(term)) ||
      (!!status(s) && status(s).toLowerCase().startsWith(term)),
  );

  /** After adding, go back to the account's geographies. */
  const done = (m: string) => {
    if (embedded) return onDone?.();
    setAdding(false);
    setQ('');
    setCreating(null);
    setMsg(m);
  };
  const add = (s: GeoSet) => {
    update((a) => addSet(a, s));
    done(`${s.name} added to your account.`);
  };

  return (
    <div className={`geo${adding ? '' : ' is-overview'}`}>
      {adding && (embedded || !!added.size) && (
        <button type="button" className="geo-back" onClick={() => (embedded ? onDone?.() : done(''))}>
          <Icon name="ArrowBack" size={20} />
          Back
          <span className="ux-visually-hidden">{embedded ? ' to account setup' : ' to your geographies'}</span>
        </button>
      )}
      {adding ? (
        <header className="geo-head">
          <h1 ref={heading} tabIndex={-1}>
            Add your geographies
          </h1>
          <p className="geo-lead">
            Add the places you’ll serve, wherever your team sits. Every product uses your geographies to know where
            things happen, so work reaches the right place.
          </p>
        </header>
      ) : (
        <header className="geo-head geo-band">
          <div className="geo-band-text">
            <h1 ref={heading} tabIndex={-1}>
              Geographies
            </h1>
            <p className="geo-lead">
              Geographies are the places your organisation serves, from the largest area down to the smallest. Every
              product uses them to know where things happen, so work reaches the right place. A geography becomes
              active once a product starts using it.
            </p>
          </div>
          <Button variation="primary" icon="Add" label="Add your geographies" onClick={startAdding} />
        </header>
      )}

      <div className="geo-bar">
        {!adding && (
          <h2 className="geo-section-h">
            Your geographies <span className="geo-section-n">{all.length}</span>
          </h2>
        )}
        <div className="geo-tools">
          <div className="geo-search">
            <label htmlFor={`${uid}-q`} className="ux-visually-hidden">
              Search geographies
            </label>
            <Icon name="Search" size={20} />
            <input
              id={`${uid}-q`}
              type="search"
              placeholder={adding ? 'Search by name, country, level or status' : 'Search by country'}
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
      </div>

      <p className={adding || term ? 'geo-count' : 'ux-visually-hidden'} role="status">
        {msg ||
          (term
            ? `${hits.length} ${hits.length === 1 ? 'geography' : 'geographies'} found`
            : adding
              ? `${all.length} ${all.length === 1 ? 'geography' : 'geographies'} you can add`
              : `${all.length} ${all.length === 1 ? 'geography' : 'geographies'} in your account`)}
      </p>

      {creating !== null ? (
        <CreateGeography
          initial={creating}
          taken={catalogue}
          onCancel={() => setCreating(null)}
          onCreate={(s) => {
            update((a) => addSet({ ...a, geography: { ...a.geography, custom: [...(a.geography.custom ?? []), s] } }, s));
            done(`${s.name} created and added to your account.`);
          }}
        />
      ) : !hits.length ? (
        <div className="geo-empty">
          <EmptyGlobe />
          <h2>{term ? 'No geographies found' : 'Nothing left to add'}</h2>
          {adding && !term ? (
            <>
              <p>Every geography DIGIT holds is already in your account. Create your own if one is missing.</p>
              <Button variation="primary" icon="Add" label="Create a geography" onClick={() => setCreating('')} />
            </>
          ) : adding ? (
            <>
              <p>Nothing matches “{q.trim()}”. Try another search, or create this geography yourself.</p>
              <Button variation="primary" icon="Add" label={`Create “${q.trim()}”`} onClick={() => setCreating(q.trim())} />
            </>
          ) : (
            <>
              <p>None of your geographies match “{q.trim()}”. Try another search, or add more geographies.</p>
              <Button variation="primary" icon="Add" label="Add your geographies" onClick={startAdding} />
            </>
          )}
        </div>
      ) : view === 'cards' ? (
        <ul className="geo-cards">
          {hits.map((s) => (
            <li key={s.id} className="geo-card">
              <div className="geo-card-top">
                <span className="geo-icon" aria-hidden="true">
                  <Icon name="Public" size={20} />
                </span>
                <Status value={status(s)} />
              </div>
              <CardHeading level={adding ? 2 : 3}>{s.name}</CardHeading>
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
                {!adding ? null : added.has(s.id) ? (
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
                    <Status value={status(s)} />
                  </td>
                  <td>
                    <div className="geo-row-actions">
                      <Button
                        variation="secondary"
                        size="small"
                        icon="FileDownload"
                        label="Download"
                        title={`Download ${s.name} data`}
                        onClick={() => download(s)}
                      />
                      {!adding ? null : added.has(s.id) ? (
                        <p className="geo-added">
                          <Icon name="CheckCircle" size={16} />
                          Added
                        </p>
                      ) : (
                        <Button
                          variation="primary"
                          size="small"
                          icon="Add"
                          label="Add to account"
                          title={`Add ${s.name} to your account`}
                          onClick={() => add(s)}
                        />
                      )}
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

/** Card titles sit under "Your geographies" (h2) once added, so they drop a level. */
function CardHeading({ level, children }: { level: 2 | 3; children: React.ReactNode }) {
  return level === 2 ? <h2 className="geo-card-h">{children}</h2> : <h3 className="geo-card-h">{children}</h3>;
}

/** Active / Inactive for the account's geographies; nothing for ones not added. */
function Status({ value }: { value: string }) {
  if (!value) return null;
  return <span className={`geo-status${value === 'Active' ? ' is-active' : ''}`}>{value}</span>;
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
