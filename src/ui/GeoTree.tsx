import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { newId, type GeoRow } from '../lib/model';

/**
 * A geography's places as a tree or a table, read-only or editable.
 * Tree: the country at the top, each place a small card with its level, a
 * caret to open and close it, and (when editable) rename and remove. Under
 * each open place, "+ Add <next level>". Table: one row per place.
 */

const childrenOf = (rows: GeoRow[], parent: string) => rows.filter((r) => r.parent === parent);
const descendants = (rows: GeoRow[], key: string): string[] =>
  childrenOf(rows, key).flatMap((c) => [c.key, ...descendants(rows, c.key)]);

/** Remove a place and everything inside it. */
function removePlace(rows: GeoRow[], key: string) {
  const gone = new Set([key, ...descendants(rows, key)]);
  return rows.filter((r) => !gone.has(r.key));
}

export function PlacesTabs({
  root,
  levels,
  rows,
  onChange,
  aside,
}: {
  root: string;
  levels: string[];
  rows: GeoRow[];
  /** Absent: read-only. */
  onChange?: (rows: GeoRow[]) => void;
  /** Shown at the right of the tabs row. */
  aside?: ReactNode;
}) {
  const [view, setView] = useState<'table' | 'tree'>('tree');
  return (
    <div className="pt">
      <div className="pt-bar">
        <div className="pt-tabs" role="group" aria-label="View as">
          <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>
            <Icon name="TableView" size={18} />
            Table
          </button>
          <button type="button" aria-pressed={view === 'tree'} onClick={() => setView('tree')}>
            <Icon name="AccountTree" size={18} />
            Tree
          </button>
        </div>
        {aside}
      </div>
      <div className="pt-panel">
        {view === 'tree' ? (
          <GeoTree root={root} levels={levels} rows={rows} onChange={onChange} />
        ) : (
          <PlacesTable levels={levels} rows={rows} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

export function GeoTree({
  root,
  levels,
  rows,
  onChange,
}: {
  root: string;
  levels: string[];
  rows: GeoRow[];
  onChange?: (rows: GeoRow[]) => void;
}) {
  // Big trees open with only the top two levels showing.
  const [closed, setClosed] = useState<Set<string>>(() => new Set(rows.length > 20 ? rows.filter((r) => r.level >= 1).map((r) => r.key) : []));
  const toggle = (k: string) => {
    const n = new Set(closed);
    if (n.has(k)) n.delete(k);
    else n.add(k);
    setClosed(n);
  };
  const add = (parent: string, level: number, name: string) =>
    onChange?.([...rows, { key: newId(), name, level, parent }]);

  const branch = (parent: string, level: number): ReactNode => (
    <ul className="gt-list">
      {childrenOf(rows, parent)
        .filter((r) => r.level === level)
        .map((r) => {
        const kids = childrenOf(rows, r.key);
        const canOpen = kids.length > 0 || (!!onChange && r.level < levels.length - 1);
        const open = canOpen && !closed.has(r.key);
        return (
          <li key={r.key}>
            <PlaceCard
              name={r.name}
              level={levels[r.level]}
              open={canOpen ? open : undefined}
              onToggle={() => toggle(r.key)}
              onRename={onChange && ((name) => onChange(rows.map((x) => (x.key === r.key ? { ...x, name } : x))))}
              onRemove={
                onChange &&
                (() => {
                  const n = descendants(rows, r.key).length;
                  if (window.confirm(`Remove ${r.name}${n ? ` and the ${n} ${n === 1 ? 'place' : 'places'} inside it` : ''}?`))
                    onChange(removePlace(rows, r.key));
                })
              }
            />
            {open && branch(r.key, r.level + 1)}
          </li>
        );
      })}
      {onChange && level < levels.length && (
        <li className="gt-add-li">
          <AddPlace
            what={levels[level]}
            where={parent ? rows.find((x) => x.key === parent)?.name : root}
            onAdd={(name) => add(parent, level, name)}
          />
        </li>
      )}
    </ul>
  );

  return (
    <div className="gt">
      <div className="gt-card is-root">
        <span className="gt-name">{root}</span>
        <span className="geo-tag">Country</span>
      </div>
      {branch('', 0)}
    </div>
  );
}

function PlaceCard({
  name,
  level,
  open,
  onToggle,
  onRename,
  onRemove,
}: {
  name: string;
  level: string;
  open?: boolean;
  onToggle: () => void;
  onRename?: (name: string) => void;
  onRemove?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(name);
  const input = useRef<HTMLInputElement>(null);
  const editBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);
  const finish = (save: boolean) => {
    if (save && v.trim() && v.trim() !== name) onRename?.(v.trim());
    else setV(name);
    setEditing(false);
    requestAnimationFrame(() => editBtn.current?.focus());
  };
  return (
    <div className="gt-card">
      {open === undefined ? (
        <span className="gt-caret is-empty" aria-hidden="true" />
      ) : (
        <button type="button" className="gt-caret" aria-expanded={open} aria-label={`${open ? 'Close' : 'Open'} ${name}`} onClick={onToggle}>
          <Icon name={open ? 'ArrowDropDown' : 'ArrowRight'} size={20} />
        </button>
      )}
      {editing ? (
        <input
          ref={input}
          className="gt-input"
          value={v}
          aria-label={`New name for ${name}`}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => finish(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault(), finish(true);
            if (e.key === 'Escape') finish(false);
          }}
        />
      ) : (
        <span className="gt-name">{name}</span>
      )}
      <span className="geo-tag">{level}</span>
      {onRename && !editing && (
        <button ref={editBtn} type="button" className="gt-icon" aria-label={`Rename ${name}`} onClick={() => setEditing(true)}>
          <Icon name="Edit" size={18} />
        </button>
      )}
      {onRemove && !editing && (
        <button type="button" className="gt-icon" aria-label={`Remove ${name}`} onClick={onRemove}>
          <Icon name="Delete" size={18} />
        </button>
      )}
    </div>
  );
}

/** "+ Add District" that opens a one-line input in place. */
function AddPlace({ what, where, onAdd }: { what: string; where?: string; onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  const close = () => {
    setV('');
    setOpen(false);
    requestAnimationFrame(() => button.current?.focus());
  };
  if (!open)
    return (
      <button ref={button} type="button" className="gt-add" onClick={() => setOpen(true)}>
        <Icon name="AddBox" size={18} />
        Add {what}
        {where && <span className="ux-visually-hidden"> in {where}</span>}
      </button>
    );
  return (
    <span className="gt-add-line">
      <input
        ref={input}
        className="gt-input"
        value={v}
        aria-label={`${what} name${where ? `, in ${where}` : ''}`}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (v.trim()) onAdd(v.trim());
            setV('');
          }
          if (e.key === 'Escape') close();
        }}
      />
      <button
        type="button"
        className="gt-add"
        onClick={() => {
          if (v.trim()) onAdd(v.trim());
          close();
        }}
      >
        Add
      </button>
      <button type="button" className="gt-add is-quiet" onClick={close}>
        Cancel
      </button>
    </span>
  );
}

/** One row per place. Editable: rename in place, remove, and add a place with its level and parent. */
function PlacesTable({ levels, rows, onChange }: { levels: string[]; rows: GeoRow[]; onChange?: (rows: GeoRow[]) => void }) {
  const nameOf = new Map(rows.map((r) => [r.key, r.name]));
  const [f, setF] = useState({ name: '', level: '0', parent: '' });
  const [error, setError] = useState('');
  const level = Number(f.level);
  const parents = level ? rows.filter((r) => r.level === level - 1) : [];
  return (
    <div className="cg-grid-wrap">
      <table className={`cg-grid${onChange ? '' : ' is-read'}`}>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Level</th>
            <th scope="col">Sits inside</th>
            {onChange && (
              <th scope="col" className="cg-grid-x">
                <span className="ux-visually-hidden">Remove</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              {onChange ? (
                <td>
                  <input
                    defaultValue={r.name}
                    aria-label={`Name of ${levels[r.level]} ${r.name}`}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== r.name) onChange(rows.map((x) => (x.key === r.key ? { ...x, name: v } : x)));
                      else e.target.value = r.name;
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                  />
                </td>
              ) : (
                <th scope="row">{r.name}</th>
              )}
              <td className="pt-cell">{levels[r.level]}</td>
              <td className="pt-cell">{nameOf.get(r.parent) ?? '—'}</td>
              {onChange && (
                <td className="cg-grid-x">
                  <button
                    type="button"
                    className="gt-icon"
                    aria-label={`Remove ${r.name}`}
                    onClick={() => {
                      const n = descendants(rows, r.key).length;
                      if (window.confirm(`Remove ${r.name}${n ? ` and the ${n} ${n === 1 ? 'place' : 'places'} inside it` : ''}?`))
                        onChange(removePlace(rows, r.key));
                    }}
                  >
                    <Icon name="Delete" size={18} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {onChange && (
        <form
          className="pt-add"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!f.name.trim()) return setError('Enter the place’s name');
            if (level && !f.parent) return setError(`Choose the ${levels[level - 1]} it sits inside`);
            onChange([...rows, { key: newId(), name: f.name.trim(), level, parent: level ? f.parent : '' }]);
            setF({ ...f, name: '' });
            setError('');
          }}
        >
          <p className="pt-add-h">Add a place</p>
          {error && (
            <p className="fld-error" role="alert">
              {error}
            </p>
          )}
          <div className="pt-add-row">
            <label>
              <span>Name</span>
              <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </label>
            <label>
              <span>Level</span>
              <select value={f.level} onChange={(e) => setF({ ...f, level: e.target.value, parent: '' })}>
                {levels.map((l, i) => (
                  <option key={l} value={i}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            {level > 0 && (
              <label>
                <span>Sits inside</span>
                <select value={f.parent} onChange={(e) => setF({ ...f, parent: e.target.value })}>
                  <option value="">Choose</option>
                  {parents.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button type="submit" className="gt-add">
              <Icon name="AddBox" size={18} />
              Add
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
