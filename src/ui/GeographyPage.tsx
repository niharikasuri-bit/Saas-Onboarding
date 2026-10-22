import { useId, useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { Select } from '../components/Select';
import { useAccount } from '../lib/store';
import { didYouMean, findName } from '../lib/csv';
import { addArea } from '../lib/importers';
import { LEVELS, REFERENCE_AREAS } from '../lib/model';
import { Field, describedBy } from './StepFrame';
import { SearchTree } from './Tree';
import { EntryChoice, PendingFixes } from './Upload';
import { newId, type Area } from '../lib/model';

type Hit = { name: string; parent: string; level: number };

/** The areas DIGIT holds plus any they created, as one searchable pool. */
function usePool(): Hit[] {
  const { account } = useAccount();
  const own = account.geography.areas
    .filter((x) => !REFERENCE_AREAS.some((r) => r.name.toLowerCase() === x.name.toLowerCase()))
    .map((x) => ({
      name: x.name,
      parent: account.geography.areas.find((p) => p.id === x.parentId)?.name ?? '',
      level: x.level,
    }));
  return [...REFERENCE_AREAS, ...own];
}

/** One search, used both to add areas and to choose a parent. */
function AreaSearch({
  label,
  placeholder,
  action,
  onPick,
  isAdded,
  onEmpty,
}: {
  label: string;
  placeholder: string;
  action: (h: Hit) => string;
  onPick: (h: Hit) => void;
  isAdded?: (h: Hit) => boolean;
  onEmpty?: (q: string) => React.ReactNode;
}) {
  const uid = useId();
  const pool = usePool();
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const hits = term ? pool.filter((x) => x.name.toLowerCase().includes(term)).slice(0, 8) : [];

  return (
    <div className="as">
      <div className="search">
        <label htmlFor={`${uid}-q`} className="ux-visually-hidden">
          {label}
        </label>
        <Icon name="Search" size={20} />
        <input id={`${uid}-q`} type="search" placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p className="ux-visually-hidden" role="status">
        {term ? `${hits.length} areas found` : ''}
      </p>
      {term && (
        <ul className="ar-list">
          {hits.map((x) => (
            <li key={x.name + x.parent}>
              <span className="ar-text">
                <span className="ar-name">{x.name}</span>
                <span className="ar-meta">
                  {LEVELS[x.level]}
                  {x.parent ? ` in ${x.parent}` : ''}
                </span>
              </span>
              {isAdded?.(x) ? (
                <span className="tag is-completed">Added</span>
              ) : (
                <Button
                  variation="secondary"
                  size="small"
                  label={action(x)}
                  onClick={() => {
                    onPick(x);
                    if (!isAdded) setQ('');
                  }}
                />
              )}
            </li>
          ))}
          {!hits.length && <li className="countries-none">No area called “{q}”.{onEmpty?.(q)}</li>}
        </ul>
      )}
    </div>
  );
}

/**
 * Complaints selected: search DIGIT's predefined areas, and create your own
 * if one isn't there. Otherwise (create): add manually, upload a file, or
 * fetch from OpenStreetMap.
 */
export function GeographyBody({ create }: { create?: boolean }) {
  const { account, update } = useAccount();
  const [creating, setCreating] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const have = new Set(account.geography.areas.map((x) => x.name.toLowerCase()));
  const has = account.geography.areas.length > 0;

  if (create)
    return (
      <>
        <EntryChoice
          kind="areas"
          noun="areas"
          manual={<ManualArea />}
          extra={{ label: 'Fetch from OpenStreetMap', icon: 'Public', panel: <FromOsm /> }}
        />
        <PendingFixes kind="areas" />
        {has && <AreaTree />}
      </>
    );

  return (
    <>
      <section className="card" aria-labelledby="geo-find">
        <h3 id="geo-find" className="sm-h3">
          Search the predefined areas
        </h3>
        <p className="card-lead">
          DIGIT already holds Nairobi’s districts, zones and wards ({LEVELS.join(' › ')}). Adding one
          adds the areas above it too.
        </p>
        <AreaSearch
          label="Search areas"
          placeholder="Search areas, for example Parklands"
          action={(h) => `Add ${h.name}`}
          isAdded={(h) => have.has(h.name.toLowerCase())}
          onPick={(h) => {
            update((a) => addArea(a, h.name, h.parent));
            setMsg(`${h.name} added.`);
          }}
          onEmpty={(q) => (
            <>
              {' '}
              <button type="button" className="lnk" onClick={() => setCreating(q)}>
                Create “{q}”
              </button>
            </>
          )}
        />
        <p className="form-note" role="status">
          {msg}
        </p>
        <div className="own">
          <p>
            <strong>Not found?</strong> Create your own with a name and the area it sits inside.
          </p>
          {creating === null && <Button variation="link" label="Create an Area" onClick={() => setCreating('')} />}
        </div>
        {creating !== null && (
          <CreateArea initial={creating} onDone={() => setCreating(null)} onAdded={setMsg} />
        )}
      </section>

      {has && <AreaTree />}
    </>
  );
}

function AreaTree() {
  const { account } = useAccount();
  return (
    <section className="card" aria-labelledby="geo-tree-h">
      <h3 id="geo-tree-h" className="sm-h3">
        Your areas
      </h3>
      <p className="card-lead">{account.geography.areas.length} areas. Open one to see what’s inside it.</p>
      <SearchTree
        label="your areas"
        nodes={account.geography.areas}
        meta={(n) => LEVELS[(n as { level?: number }).level ?? 0] ?? ''}
      />
    </section>
  );
}

/** Create one area: name, level, and the area it sits inside. */
function ManualArea() {
  const { account, update } = useAccount();
  const uid = useId();
  const areas = account.geography.areas;
  const [f, setF] = useState({ name: '', level: areas.length ? '1' : '0', parentId: '' });
  const [error, setError] = useState('');
  const [similar, setSimilar] = useState('');
  const [added, setAdded] = useState('');
  const level = Number(f.level);
  const parents = areas.filter((x) => x.level < level);

  const save = (force = false) => {
    const n = f.name.trim();
    if (!n) return setError('Enter the area’s name');
    if (level > 0 && !f.parentId) return setError('Choose the area it sits inside');
    const names = areas.map((x) => x.name);
    const same = findName(n, names);
    if (same) return setError(`${same} is already there`);
    const near = didYouMean(n, names);
    if (near && !force) return setSimilar(near);
    update((a) => ({
      ...a,
      geography: { areas: [...a.geography.areas, { id: newId(), name: n, parentId: level ? f.parentId : null, level }] },
    }));
    setAdded(n);
    setSimilar('');
    setF({ ...f, name: '' });
  };

  return (
    <form
      className="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {error && (
        <p className="fld-error" role="alert">
          {error}
        </p>
      )}
      <div className="row">
        <Field id={`${uid}-n`} label="Area name">
          <input
            id={`${uid}-n`}
            value={f.name}
            placeholder="e.g. Westlands"
            onChange={(e) => {
              setF({ ...f, name: e.target.value });
              setError('');
              setSimilar('');
            }}
          />
        </Field>
        <Field id={`${uid}-l`} label="Level">
          <Select id={`${uid}-l`} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value, parentId: '' })}>
            {LEVELS.map((l, i) => (
              <option key={l} value={i} disabled={i > 0 && !areas.some((x) => x.level < i)}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {level > 0 && (
        <Field id={`${uid}-p`} label="Sits inside">
          <Select id={`${uid}-p`} value={f.parentId} onChange={(e) => setF({ ...f, parentId: e.target.value })}>
            <option value="">Choose</option>
            {parents.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} ({LEVELS[x.level]})
              </option>
            ))}
          </Select>
        </Field>
      )}
      {similar && (
        <div className="dym" role="alert">
          <p>
            <strong>Did you mean {similar}?</strong> It’s already there.
          </p>
          <div className="rd-actions">
            <Button variation="link" label={`No, Create ${f.name.trim()}`} onClick={() => save(true)} />
          </div>
        </div>
      )}
      <div className="form-foot">
        <Button variation="primary" label="Add Area" submit onClick={() => {}} />
        {added && (
          <p className="form-note" role="status">
            {added} added.
          </p>
        )}
      </div>
    </form>
  );
}

/**
 * Fetch boundaries for a place from OpenStreetMap. Prototype: the result is
 * DIGIT's sample data for Nairobi, after a short wait.
 */
function FromOsm() {
  const { update } = useAccount();
  const uid = useId();
  const [q, setQ] = useState('Nairobi');
  const [state, setState] = useState<'idle' | 'loading' | 'found' | 'done'>('idle');
  const [levels, setLevels] = useState<Set<number>>(new Set([0, 1, 3]));
  // OpenStreetMap has no zones, so wards sit straight inside districts.
  const osm = REFERENCE_AREAS.filter((x) => x.level !== 2);
  const count = (l: number) => osm.filter((x) => x.level === l).length;

  const importAreas = () =>
    update((a) => {
      const areas: Area[] = [...a.geography.areas];
      const idOf = (name: string) => areas.find((x) => x.name === name)?.id ?? null;
      for (const r of osm) {
        if (!levels.has(r.level) || areas.some((x) => x.name === r.name)) continue;
        // Nearest ancestor that's imported.
        let parent = r.level === 3 ? REFERENCE_AREAS.find((x) => x.name === r.parent)?.parent ?? '' : r.parent;
        if (parent && !idOf(parent)) parent = REFERENCE_AREAS.find((x) => x.name === parent)?.parent ?? '';
        areas.push({ id: newId(), name: r.name, parentId: parent ? idOf(parent) : null, level: r.level });
      }
      return { ...a, geography: { areas } };
    });

  return (
    <div className="osm">
      <form
        className="osm-q"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!q.trim()) return;
          setState('loading');
          setTimeout(() => setState('found'), 900);
        }}
      >
        <Field id={`${uid}-q`} label="Place to fetch" hint="A city, county or district name.">
          <input id={`${uid}-q`} value={q} aria-describedby={`${uid}-q-hint`} onChange={(e) => setQ(e.target.value)} />
        </Field>
        <Button variation="secondary" label="Fetch Boundaries" submit onClick={() => {}} />
      </form>
      <p role="status" className={state === 'loading' ? 'form-note' : 'ux-visually-hidden'}>
        {state === 'loading' ? 'Fetching boundaries from OpenStreetMap…' : state === 'found' ? 'Boundaries found.' : ''}
      </p>
      {state === 'found' && (
        <fieldset className="fld osm-found">
          <legend className="fld-label">Found for {q.trim()}. Which levels do you want?</legend>
          {[0, 1, 3].map((i) => (
            <label key={i} className="ck-opt">
              <input
                type="checkbox"
                checked={levels.has(i)}
                disabled={i === 0}
                onChange={() => {
                  const n = new Set(levels);
                  if (n.has(i)) n.delete(i);
                  else n.add(i);
                  setLevels(n);
                }}
              />
              {LEVELS[i]}s <span className="ar-meta">({count(i)})</span>
            </label>
          ))}
          <div className="form-foot">
            <Button
              variation="primary"
              label="Import Areas"
              onClick={() => {
                importAreas();
                setState('done');
              }}
            />
          </div>
        </fieldset>
      )}
      {state === 'done' && (
        <p className="up-result" role="status">
          <span>
            <strong>Imported from OpenStreetMap.</strong> They’re in your areas below.
          </span>
        </p>
      )}
    </div>
  );
}


/** Create a missing area: name, parent via the same search, duplicate check. */
function CreateArea({ initial, onDone, onAdded }: { initial: string; onDone: () => void; onAdded: (m: string) => void }) {
  const { update } = useAccount();
  const uid = useId();
  const pool = usePool();
  const [name, setName] = useState(initial);
  const [parent, setParent] = useState<Hit | null>(null);
  const [error, setError] = useState('');
  const [similar, setSimilar] = useState('');
  const names = pool.map((x) => x.name);

  const save = (force = false) => {
    const n = name.trim();
    if (!n) return setError('Enter the area’s name');
    if (!parent) return setError('Choose the area it sits inside');
    if (parent.level >= LEVELS.length - 1) return setError(`A ${LEVELS[parent.level].toLowerCase()} is the smallest area. Choose a bigger one.`);
    const same = findName(n, names);
    if (same && !force) return setError(`${same} already exists. Search for it above and add it.`);
    const near = didYouMean(n, names);
    if (near && !force) return setSimilar(near);
    update((a) => addArea(addArea(a, parent.name, parent.parent), n, parent.name));
    onAdded(`${n} created, inside ${parent.name}.`);
    onDone();
  };

  return (
    <form
      className="ar-add"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Field id={`${uid}-n`} label="Area name" error={error}>
        <input
          id={`${uid}-n`}
          value={name}
          aria-describedby={describedBy(`${uid}-n`, undefined, error)}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
            setSimilar('');
          }}
        />
      </Field>
      <div className="fld">
        <span className="fld-label">Sits inside</span>
        {parent ? (
          <p className="ar-parent">
            <strong>{parent.name}</strong> ({LEVELS[parent.level]}){' '}
            <button type="button" className="lnk" onClick={() => setParent(null)}>
              Change
            </button>
          </p>
        ) : (
          <AreaSearch
            label="Search for the parent area"
            placeholder="Search for the area it sits inside"
            action={() => 'Choose'}
            onPick={(h) => {
              setParent(h);
              setError('');
            }}
          />
        )}
      </div>
      {similar && (
        <div className="dym" role="alert">
          <p>
            <strong>Did you mean {similar}?</strong> It already exists.
          </p>
          <div className="rd-actions">
            <Button
              variation="secondary"
              size="small"
              label={`Use ${similar}`}
              onClick={() => {
                const h = pool.find((x) => x.name === similar)!;
                update((a) => addArea(a, h.name, h.parent));
                onAdded(`${similar} added.`);
                onDone();
              }}
            />
            <Button variation="link" label={`No, Create ${name.trim()}`} onClick={() => save(true)} />
          </div>
        </div>
      )}
      <div className="form-foot">
        <Button variation="primary" label="Create Area" submit onClick={() => {}} />
        <Button variation="link" label="Cancel" onClick={onDone} />
      </div>
    </form>
  );
}
