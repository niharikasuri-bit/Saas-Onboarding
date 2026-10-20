import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { GEO_SETS, REFERENCE_AREAS, newId, type Account, type Area, type GeoRow, type GeoSet } from '../lib/model';
import { CreateGeography } from './CreateGeography';
import { AddGeographyDialog, PlacesTabs } from './GeoTree';
import { InfoNote, SheetIntro } from './Sheet';
import { Crumbs } from './Crumbs';
import { usePageToast } from './PageToast';

/**
 * The Geographies page, in two states, both centred at the top:
 * - Adding (first visit, or after "Add geographies"): "Add your geographies",
 *   then one search over everything DIGIT holds, as cards or a list. Each can
 *   be added or downloaded; when nothing matches, an empty state offers to
 *   create it. Adding one goes back to the account's geographies.
 * - Added: "Geographies" and what they are, an "Add geographies" button, and
 *   the account's own geographies.
 */

/** Every geography inside a set, largest first. Created ones keep their own; Nairobi is real; the rest are samples. */
function rowsOf(set: GeoSet): GeoRow[] {
  if (set.rows) return set.rows;
  // Keyed by level too: a ward can share its district's name.
  if (set.id === 'nairobi')
    return REFERENCE_AREAS.map((r) => ({ key: `${r.level}:${r.name}`, name: r.name, level: r.level, parent: r.parent ? `${r.level - 1}:${r.parent}` : '' }));
  const rows: GeoRow[] = [{ key: set.name, name: set.name, level: 0, parent: '' }];
  let above = [set.name];
  let left = set.count - 1;
  for (let l = 1; l < set.levels.length && left > 0; l++) {
    const last = l === set.levels.length - 1;
    const n = last ? left : Math.max(1, Math.min(left, Math.round(left * 0.2)));
    const names = Array.from({ length: n }, (_, i) => `${set.levels[l]} ${i + 1}`);
    names.forEach((name, i) => rows.push({ key: name, name, level: l, parent: above[i % above.length] }));
    above = names;
    left -= n;
  }
  return rows;
}

/** A set's places as the account has them: edited if they've changed them. */
const rowsFor = (a: Account, set: GeoSet) => a.geography.edited?.[set.id] ?? rowsOf(set);

function toAreas(rows: GeoRow[]): Area[] {
  const ids = new Map<string, string>();
  return rows.map((r) => {
    const id = newId();
    ids.set(r.key, id);
    return { id, name: r.name, level: r.level, parentId: r.parent ? ids.get(r.parent) ?? null : null };
  });
}

/** Add a set's geographies to the account, keeping the parent links. */
function addSet(a: Account, set: GeoSet): Account {
  const areas: Area[] = [...a.geography.areas, ...toAreas(rowsFor(a, set))];
  return { ...a, geography: { ...a.geography, areas, sets: [...(a.geography.sets ?? []), set.id] } };
}

/** Save edited places for a set, and rebuild the account's areas from every set it has. */
function editSet(a: Account, set: GeoSet, rows: GeoRow[]): Account {
  const edited = { ...a.geography.edited, [set.id]: rows };
  const next = { ...a, geography: { ...a.geography, edited } };
  const catalogue = [...GEO_SETS, ...(a.geography.custom ?? [])];
  const areas = (a.geography.sets ?? []).flatMap((id) => {
    const s = catalogue.find((x) => x.id === id);
    return s ? toAreas(rowsFor(next, s)) : [];
  });
  return { ...next, geography: { ...next.geography, areas } };
}

function download(set: GeoSet, rows: GeoRow[]) {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const nameOf = new Map(rows.map((r) => [r.key, r.name]));
  const csv = ['Name,Level,Sits inside', ...rows.map((r) => [r.name, set.levels[r.level] ?? '', nameOf.get(r.parent) ?? ''].map(esc).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${set.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-geographies.csv`;
  link.click();
  URL.revokeObjectURL(url);
}


/** embedded: shown inside Home's account setup; always adding, and onDone goes back. */
export function Geographies({ embedded, onDone }: { embedded?: boolean; onDone?: (message?: string) => void } = {}) {
  const { account, update, go } = useAccount();
  const uid = useId();
  const [q, setQ] = useState('');
  const [view, setView] = useState<'cards' | 'list'>('cards');
  const [creating, setCreating] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [toastEl, showToast] = usePageToast();
  const [viewingId, setViewing] = useState<string | null>(null);
  // View is read-only; Edit lets them rename, remove and add places.
  const [editing, setEditing] = useState(false);
  // Edits go into a draft: Save writes it to the account, Back throws it away.
  const [draft, setDraft] = useState<GeoRow[] | null>(null);
  const [dirty, setDirty] = useState(false);
  const change = (r: GeoRow[]) => {
    setDraft(r);
    setDirty(true);
  };
  const [addingPlace, setAddingPlace] = useState(false);
  // Where Edit was opened from: straight from the list, Back and Save return to the list.
  const [editFromList, setEditFromList] = useState(false);
  const open = (id: string, edit: boolean) => {
    const set = [...GEO_SETS, ...(account.geography.custom ?? [])].find((s) => s.id === id);
    setDraft(edit && set ? rowsFor(account, set) : null);
    setDirty(false);
    setEditFromList(edit);
    setEditing(edit);
    setViewing(id);
  };
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
  }, [adding, viewingId, editing, creating === null]);

  const catalogue = [...GEO_SETS, ...(account.geography.custom ?? [])];
  const countOf = (s: GeoSet) => rowsFor(account, s).length;
  const viewing = catalogue.find((s) => s.id === viewingId) ?? null;
  // Breadcrumbs: Home, then Geographies once they have some, then Add geographies while adding.
  const homeCrumb = { label: 'Home', onClick: embedded ? () => onDone?.() : () => go('home') };
  const geoCrumb = !embedded && added.size ? [{ label: 'Geographies', onClick: () => done('') }] : [];
  // The list of DIGIT's geographies is only for Complaints; otherwise adding goes straight to creating one.
  const canPick = account.products.cms.enabled;
  const addTrail = canPick ? [homeCrumb, ...geoCrumb, { label: 'Add geographies', onClick: () => setCreating(null) }] : [homeCrumb, ...geoCrumb];
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
    if (embedded) return onDone?.(m);
    setAdding(false);
    setQ('');
    setCreating(null);
    setMsg('');
    if (m) showToast(m);
  };
  const add = (s: GeoSet) => {
    update((a) => addSet(a, s));
    done(`${s.name} added to your account`);
  };
  // Picking from DIGIT's list: one geography at a time, then add it.
  const [picked, setPicked] = useState<string[]>([]);
  // A checkbox, one at a time: ticking another moves the tick; ticking the same one again clears it
  const togglePick = (id: string) => setPicked((x) => (x.includes(id) ? [] : [id]));
  const addPicked = () => {
    const sets = catalogue.filter((x) => picked.includes(x.id) && !added.has(x.id));
    update((a) => sets.reduce((acc, x) => addSet(acc, x), a));
    setPicked([]);
    done(sets.length === 1 ? `${sets[0].name} added to your account` : `${sets.length} geographies added to your account`);
  };

  if (viewing) {
    const isAdded = added.has(viewing.id);
    const editable = isAdded && editing;
    const saved = rowsFor(account, viewing);
    const rows = editable && draft ? draft : saved;
    const startEdit = () => {
      setDraft(saved);
      setDirty(false);
      setEditFromList(false);
      setEditing(true);
    };
    const stopEdit = () => {
      setDraft(null);
      setDirty(false);
      setEditing(false);
      if (editFromList) setViewing(null);
      setEditFromList(false);
    };
    const leaveEdit = () => {
      if (dirty && !window.confirm('Leave without saving? Your edits will be lost.')) return;
      stopEdit();
    };
    const save = () => {
      if (draft) update((a) => editSet(a, viewing, draft));
      stopEdit();
      showToast(`Changes to ${viewing.name} saved`);
    };
    const hasBar = editable || !isAdded;
    return (
      <div className={`geo is-detail${hasBar ? ' has-bar' : ''}`}>
        <Crumbs
          items={[
            homeCrumb,
            ...(isAdded ? [{ label: 'Geographies', onClick: () => setViewing(null) }] : [...geoCrumb, { label: 'Add geographies', onClick: () => setViewing(null) }]),
            { label: viewing.name },
          ]}
        />
        <header className="geo-detail-head">
          <div>
            <h1 ref={heading} tabIndex={-1}>
              {editable ? `Edit ${viewing.name}` : viewing.name}
            </h1>
            <p className="geo-stats">
              <span>
                <strong>{viewing.levels.length}</strong> {viewing.levels.length === 1 ? 'level' : 'levels'}
              </span>
              <span>
                <strong>{rows.length.toLocaleString('en')}</strong> {rows.length === 1 ? 'geography' : 'geographies'}
              </span>
              <Status value={status(viewing)} />
            </p>
            <p className="geo-levels">
              <span className="geo-tag">{viewing.levels.join(' › ')}</span>
            </p>
          </div>
          {editable ? (
            <div className="geo-detail-actions">
              <Button variation="secondary" icon="Add" label="Add geography" onClick={() => setAddingPlace(true)} />
            </div>
          ) : isAdded ? (
            <div className="geo-detail-actions">
              <Button variation="secondary" icon="FileDownload" label="Download geography data" onClick={() => download(viewing, rows)} />
              <Button variation="primary" icon="Edit" label="Edit" title={`Edit ${viewing.name}`} onClick={startEdit} />
            </div>
          ) : null}
        </header>
        {toastEl}
        <PlacesTabs
          root={viewing.country}
          levels={viewing.levels}
          rows={rows}
          onChange={editable ? change : undefined}
          map={{ id: viewing.id, name: viewing.name, country: viewing.country }}
          note={(v) =>
            v === 'map' ? null : editable ? (
              <SheetIntro action="Save" tree={v === 'tree'} />
            ) : !isAdded ? (
              <InfoNote title="Can’t find a boundary?" grey>
                Add the geography to your account, then edit it manually to include any missing boundaries.
              </InfoNote>
            ) : null
          }
        />
        {addingPlace && editable && (
          <AddGeographyDialog levels={viewing.levels} rows={rows} onAdd={(r) => change([...rows, r])} onClose={() => setAddingPlace(false)} />
        )}
        {editable ? (
          <footer className="cg-bar">
            <Button
              variation="secondary"
              icon="ArrowBack"
              label="Back"
              title={editFromList ? 'Back to your geographies without saving' : `Back to ${viewing.name} without saving`}
              onClick={leaveEdit}
            />
            <Button variation="primary" label="Save" title={`Save changes to ${viewing.name}`} onClick={save} />
          </footer>
        ) : !isAdded ? (
          <footer className="cg-bar">
            <Button variation="secondary" icon="ArrowBack" label="Back" title="Back to add geographies" onClick={() => setViewing(null)} />
            <Button
              variation="primary"
              icon="Add"
              label="Add geographies to account"
              onClick={() => {
                setViewing(null);
                add(viewing);
              }}
            />
          </footer>
        ) : null}
      </div>
    );
  }

  const countLine = (
    // While adding, the count is shown at the foot of the list instead; this stays for screen readers.
    <p className={creating === null && term && !adding ? 'geo-count' : 'ux-visually-hidden'} role="status">
      {msg ||
        (term
          ? `${hits.length} ${hits.length === 1 ? 'geography' : 'geographies'} found`
          : adding
            ? `${all.length} ${all.length === 1 ? 'geography' : 'geographies'} you can add`
            : `${all.length} ${all.length === 1 ? 'geography' : 'geographies'} in your account`)}
    </p>
  );

  const createVal = adding && !canPick ? (creating ?? '') : creating;

  return (
    <div className={`geo${adding ? '' : ' is-overview'}${createVal !== null ? ' is-creating' : ''}`}>
      {toastEl}
      {createVal === null && adding && <Crumbs items={[homeCrumb, ...geoCrumb, { label: 'Add geographies' }]} />}
      {createVal !== null ? null : adding ? (
        <header className="geo-head">
          <h1 ref={heading} tabIndex={-1}>
            Select your geographies
          </h1>
          <p className="geo-lead">
            Choose the geographies you serve from DIGIT’s ready-made list. Open one to check its levels and places before
            you add it. If yours isn’t here, create your own.
          </p>
        </header>
      ) : (
        <header className="geo-head geo-band">
          <div className="geo-band-text">
            <h1 ref={heading} tabIndex={-1}>
              Geographies
            </h1>
            <p className="geo-lead">
              Geographies are the areas your organisation serves, from the largest area down to the smallest. Every
              product uses them to know where things happen, so work reaches the right place. A geography becomes
              active once a product starts using it.
            </p>
          </div>
          <Button variation="primary" icon="Add" label="Add your geographies" onClick={startAdding} />
        </header>
      )}

      {createVal === null && (
      <div className="geo-bar">
        {/* Adding: search on the left, Cards / List on the right, the count underneath. */}
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
      )}

      {countLine}



      {createVal !== null ? (
        <CreateGeography
          trail={addTrail}
          initial={createVal ?? ''}
          // Opened by Add geographies (no list to pick from) rather than by Create new geography
          verb={creating === null ? 'add' : 'create'}
          taken={catalogue}
          onCancel={() => {
            setCreating(null);
            // Without the list there is nothing to go back to inside Add geographies: leave it.
            if (!canPick) {
              if (embedded) onDone?.();
              else if (added.size) setAdding(false);
              else go('home');
            }
          }}
          onCreate={(s) => {
            update((a) => addSet({ ...a, geography: { ...a.geography, custom: [...(a.geography.custom ?? []), s] } }, s));
            done(`${s.name} created and added to your account`);
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
            adding ? (
            <li
              key={s.id}
              className={`geo-card is-pick${picked.includes(s.id) ? ' is-picked' : ''}${added.has(s.id) ? ' is-added' : ''}`}
              onClick={(e) => {
                // The whole card is the selection tile (mouse); the checkbox is the keyboard and screen-reader control
                if (added.has(s.id) || (e.target as HTMLElement).closest('button, input, label')) return;
                togglePick(s.id);
              }}
            >
              <div className="geo-pick-top">
                {added.has(s.id) ? (
                  <span className="geo-status is-active">Added</span>
                ) : (
                  <label className="geo-pick">
                    <input type="checkbox" checked={picked.includes(s.id)} onChange={() => togglePick(s.id)} />
                    <span className="ux-visually-hidden">Select {s.name}</span>
                  </label>
                )}
                <CardHeading level={2}>{s.name}</CardHeading>
                <button type="button" className="geo-preview" aria-label={`View ${s.name}`} onClick={() => open(s.id, false)}>
                  <Icon name="Visibility" size={18} />
                  View
                </button>
              </div>
              <p className="geo-stats">
                <span>
                  <strong>{s.levels.length}</strong> {s.levels.length === 1 ? 'level' : 'levels'}
                </span>
                <span>
                  <strong>{countOf(s).toLocaleString('en')}</strong> {countOf(s) === 1 ? 'geography' : 'geographies'}
                </span>
              </p>
              <p className="geo-levels">
                <span className="geo-tag">{s.levels.join(' › ')}</span>
              </p>
            </li>
            ) : (
            // Their own geography, laid out like a channel card: icon and status, the name (it opens the
            // data), its details as label / value rows, then Edit Geography Data
            <li key={s.id} className="geo-card">
              <div className="geo-card-top">
                <span className="geo-icon" aria-hidden="true">
                  <Icon name="Public" size={20} />
                </span>
                <Status value={status(s)} />
              </div>
              <CardHeading level={3}>
                <button type="button" className="geo-name-link" onClick={() => open(s.id, false)}>
                  {s.name}
                </button>
              </CardHeading>
              {/* Details as label / value rows, like the channel cards */}
              <dl className="ch-fields is-geo">
                <div>
                  <dt>Levels</dt>
                  <dd>{s.levels.length}</dd>
                </div>
                <div>
                  <dt>Geographies</dt>
                  <dd>{countOf(s).toLocaleString('en')}</dd>
                </div>
                <div>
                  <dt>Level names</dt>
                  <dd>{s.levels.join(' › ')}</dd>
                </div>
              </dl>
              <div className="geo-actions is-edit">
                <Button variation="secondary" icon="Edit" label="Edit Geography Data" title={`Edit ${s.name} geography data`} onClick={() => open(s.id, true)} />
              </div>
            </li>
            )
          ))}
        </ul>
      ) : (
        <div className="geo-table-wrap">
          <table className="geo-table">
            <thead>
              <tr>
                {adding && (
                  <th scope="col" className="geo-pick-col">
                    <span className="ux-visually-hidden">Select</span>
                  </th>
                )}
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
                <tr key={s.id} className={adding && picked.includes(s.id) ? 'is-picked' : undefined}>
                  {adding && (
                    <td className="geo-pick-col">
                      {added.has(s.id) ? (
                        <span className="geo-status is-active">Added</span>
                      ) : (
                        <input type="checkbox" aria-label={`Select ${s.name}`} checked={picked.includes(s.id)} onChange={() => togglePick(s.id)} />
                      )}
                    </td>
                  )}
                  <th scope="row">{s.name}</th>
                  <td>{s.country}</td>
                  <td>{s.levels.length}</td>
                  <td>
                    <span className="geo-tag">{s.levels.join(' › ')}</span>
                  </td>
                  <td>{countOf(s).toLocaleString('en')}</td>
                  <td>
                    <Status value={status(s)} />
                  </td>
                  <td>
                    <div className="geo-row-actions">
                      <Button
                        variation="secondary"
                        size="small"
                        icon="Visibility"
                        label={adding ? 'View geography data' : 'View'}
                        title={`View ${s.name}${adding ? ' geography data' : ''}`}
                        onClick={() => open(s.id, false)}
                      />
                      {!adding && (
                        <Button variation="primary" size="small" icon="Edit" label="Edit" title={`Edit ${s.name}`} onClick={() => open(s.id, true)} />
                      )}
                      {adding && added.has(s.id) && (
                        <p className="geo-added">
                          <Icon name="CheckCircle" size={16} />
                          Added
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* While geographies are ticked, the footer adds them; the Didn't find bar steps aside */}
      {createVal === null && adding && picked.length > 0 && (
        <footer className="cg-bar geo-pick-bar">
          <p className="ux-visually-hidden" role="status">
            {catalogue.find((x) => x.id === picked[0])?.name} selected
          </p>
          <Button variation="primary" icon="Add" label="Add geography to account" onClick={addPicked} />
        </footer>
      )}
      {createVal === null && adding && hits.length > 0 && picked.length === 0 && (
        <p className="geo-foot">
          <span>Didn’t find your geography?</span>
          <button type="button" className="geo-foot-cta" onClick={() => setCreating(q.trim())}>
            <Icon name="Add" size={18} />
            Create new geography
          </button>
        </p>
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
