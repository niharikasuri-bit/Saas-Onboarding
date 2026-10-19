import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { newId, type GeoRow } from '../lib/model';

/**
 * A geography's places as a tree or a table, read-only or editable.
 * Tree: the country at the top, each place a small card with its level, a
 * caret to open and close it, and (when editable) rename and remove. Under
 * each open place, "+ Add <next level>". Table: one column per level, one row per path.
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
  const [adding, setAdding] = useState<{ level: number; parent: string; parentName: string } | null>(null);

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
                  if (window.confirm(`Remove ${r.name}${n ? ` and the ${n} ${n === 1 ? 'geography' : 'geographies'} inside it` : ''}?`))
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
          <button
            type="button"
            className="gt-add"
            onClick={() => setAdding({ level, parent, parentName: parent ? rows.find((x) => x.key === parent)?.name ?? root : root })}
          >
            <Icon name="AddBox" size={18} />
            Add {levels[level]}
            <span className="ux-visually-hidden"> in {parent ? rows.find((x) => x.key === parent)?.name : root}</span>
          </button>
        </li>
      )}
    </ul>
  );

  return (
    <div className="gt">
      {adding && onChange && (
        <AddGeographyDialog levels={levels} rows={rows} fixed={adding} onAdd={(r) => onChange([...rows, r])} onClose={() => setAdding(null)} />
      )}
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

/** Every full path from the top level down, as the place keys at each level (one per row). */
function pathsOf(rows: GeoRow[], depth: number) {
  const out: (GeoRow | undefined)[][] = [];
  const walk = (parent: string, level: number, trail: GeoRow[]) => {
    const kids = childrenOf(rows, parent).filter((r) => r.level === level);
    if (!kids.length) {
      if (trail.length) out.push(Array.from({ length: depth }, (_, i) => trail[i]));
      return;
    }
    kids.forEach((k) => walk(k.key, level + 1, [...trail, k]));
  };
  walk('', 0, []);
  return out;
}

/**
 * One column per geography level and one row per path, like the upload sheet.
 * A name repeated from the row above is shown lighter, so each group reads at a
 * glance. Editable: rename any cell (the place changes everywhere), remove the
 * row's last place, and add a geography.
 */
function PlacesTable({ levels, rows, onChange }: { levels: string[]; rows: GeoRow[]; onChange?: (rows: GeoRow[]) => void }) {
  const paths = pathsOf(rows, levels.length);
  const [adding, setAdding] = useState(false);
  return (
    <div className="cg-grid-wrap">
      <table className={`cg-grid pt-levels${onChange ? '' : ' is-read'}`}>
        <thead>
          <tr>
            {levels.map((l) => (
              <th key={l} scope="col">
                {l}
              </th>
            ))}
            {onChange && (
              <th scope="col" className="cg-grid-x">
                <span className="ux-visually-hidden">Remove</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {paths.map((path, i) => {
            const last = [...path].reverse().find(Boolean)!;
            return (
              <tr key={last.key}>
                {path.map((r, j) => {
                  const same = !!r && paths[i - 1]?.[j]?.key === r.key;
                  if (!r)
                    return (
                      <td key={j} className="pt-cell is-empty">
                        <span aria-hidden="true">—</span>
                        <span className="ux-visually-hidden">None</span>
                      </td>
                    );
                  return onChange ? (
                    <td key={j} className={same ? 'is-same' : undefined}>
                      <input
                        key={`${r.key}:${r.name}`}
                        defaultValue={r.name}
                        aria-label={`${levels[j]}, row ${i + 1}`}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== r.name) onChange(rows.map((x) => (x.key === r.key ? { ...x, name: v } : x)));
                          else e.target.value = r.name;
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                      />
                    </td>
                  ) : (
                    <td key={j} className={`pt-cell${same ? ' is-same' : ''}`}>
                      {r.name}
                    </td>
                  );
                })}
                {onChange && (
                  <td className="cg-grid-x">
                    <button
                      type="button"
                      className="gt-icon"
                      aria-label={`Remove ${last.name}`}
                      onClick={() => window.confirm(`Remove ${last.name}?`) && onChange(removePlace(rows, last.key))}
                    >
                      <Icon name="Delete" size={18} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {onChange && (
        <div className="pt-add-btn">
          <Button variation="secondary" icon="Add" label="Add geography" onClick={() => setAdding(true)} />
        </div>
      )}
      {adding && onChange && (
        <AddGeographyDialog levels={levels} rows={rows} onAdd={(r) => onChange([...rows, r])} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}

/**
 * Add a geography, in a pop-up: its level, name, where it sits (when that
 * isn't already known), and optional lat / long, code and shape file.
 */
export function AddGeographyDialog({
  levels,
  rows,
  fixed,
  onAdd,
  onClose,
}: {
  levels: string[];
  rows: GeoRow[];
  /** Set when adding from the tree: the level and parent are known. */
  fixed?: { level: number; parent: string; parentName: string };
  onAdd: (row: GeoRow) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const shapeInput = useRef<HTMLInputElement>(null);
  const uid = useId();
  const [f, setF] = useState({ level: fixed ? String(fixed.level) : '', name: '', parent: fixed?.parent ?? '', latlong: '', code: '' });
  const [shape, setShape] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    opener.current = document.activeElement as HTMLElement;
    ref.current?.showModal();
    requestAnimationFrame(() => head.current?.focus());
  }, []);
  const close = () => {
    ref.current?.close();
    onClose();
    requestAnimationFrame(() => opener.current?.isConnected && opener.current.focus());
  };
  const level = f.level === '' ? -1 : Number(f.level);
  const parents = level > 0 ? rows.filter((r) => r.level === level - 1) : [];
  const needsParent = !fixed && level > 0;

  const save = () => {
    const e: Record<string, string> = {};
    if (level < 0) e.level = 'Select the geography level';
    if (!f.name.trim()) e.name = 'Enter the name of the geography';
    if (needsParent && !f.parent) e.parent = `Choose the ${levels[level - 1]} it sits inside`;
    if (f.latlong.trim() && !/^\s*-?\d{1,2}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?\s*$/.test(f.latlong))
      e.latlong = 'Enter latitude and longitude separated by a comma, for example 12.9716, 77.5946';
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`${uid}-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    onAdd({
      key: newId(),
      name: f.name.trim(),
      level,
      parent: fixed ? fixed.parent : level > 0 ? f.parent : '',
      latlong: f.latlong.trim() || undefined,
      code: f.code.trim() || undefined,
      shape: shape || undefined,
    });
    close();
  };

  const field = (key: string, label: string, required: boolean, control: ReactNode, hint?: string) => (
    <div className={`ag-fld${errors[key] ? ' has-error' : ''}`}>
      <label htmlFor={`${uid}-${key}`}>
        {label}
        {required ? (
          <span className="ag-req" aria-hidden="true">
            {' '}
            *
          </span>
        ) : (
          <span className="ag-opt"> (Optional)</span>
        )}
      </label>
      {hint && (
        <p className="ag-hint" id={`${uid}-${key}-hint`}>
          {hint}
        </p>
      )}
      {errors[key] && (
        <p className="fld-error" id={`${uid}-${key}-err`}>
          <span className="ux-visually-hidden">Error: </span>
          {errors[key]}
        </p>
      )}
      {control}
    </div>
  );
  const described = (key: string, hint?: boolean) =>
    [errors[key] ? `${uid}-${key}-err` : '', hint ? `${uid}-${key}-hint` : ''].filter(Boolean).join(' ') || undefined;

  // Rendered on <body>: this can open inside another form (the create steps).
  return createPortal(
    <dialog
      ref={ref}
      className="ag"
      aria-labelledby={`${uid}-h`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          // React events still bubble to the form it was opened from; stop them here.
          e.stopPropagation();
          save();
        }}
      >
        <div className="ag-top">
          <h2 id={`${uid}-h`} ref={head} tabIndex={-1}>
            Add a geography
          </h2>
          <button type="button" className="ag-x" aria-label="Close" onClick={close}>
            <Icon name="Close" size={22} />
          </button>
        </div>
        <div className="ag-body">
          {field(
            'level',
            'Select geography level',
            true,
            <select
              id={`${uid}-level`}
              value={f.level}
              disabled={!!fixed}
              aria-required="true"
              aria-invalid={!!errors.level || undefined}
              aria-describedby={described('level')}
              onChange={(e) => setF({ ...f, level: e.target.value, parent: '' })}
            >
              <option value="">Select</option>
              {levels.map((l, i) => (
                <option key={l} value={i}>
                  {l}
                </option>
              ))}
            </select>,
          )}
          {needsParent &&
            field(
              'parent',
              `Sits inside (${levels[level - 1]})`,
              true,
              <select
                id={`${uid}-parent`}
                value={f.parent}
                aria-required="true"
                aria-invalid={!!errors.parent || undefined}
                aria-describedby={described('parent')}
                onChange={(e) => setF({ ...f, parent: e.target.value })}
              >
                <option value="">Select</option>
                {parents.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name}
                  </option>
                ))}
              </select>,
            )}
          <div className="ag-box">
          {field(
            'name',
            'Name of the geography',
            true,
            <input
              id={`${uid}-name`}
              value={f.name}
              aria-required="true"
              aria-invalid={!!errors.name || undefined}
              aria-describedby={described('name')}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />,
          )}
          {field(
            'latlong',
            'Lat / Long',
            false,
            <input
              id={`${uid}-latlong`}
              value={f.latlong}
              placeholder="12.9716, 77.5946"
              inputMode="decimal"
              aria-invalid={!!errors.latlong || undefined}
              aria-describedby={described('latlong')}
              onChange={(e) => setF({ ...f, latlong: e.target.value })}
            />,
          )}
          {field(
            'code',
            'Geography code',
            false,
            <input
              id={`${uid}-code`}
              value={f.code}
              placeholder="GEO123456"
              aria-describedby={described('code')}
              onChange={(e) => setF({ ...f, code: e.target.value })}
            />,
          )}
          <div className="ag-fld">
            <p className="ag-label" id={`${uid}-shape-l`}>
              Upload shape file <span className="ag-opt">(Optional)</span>
            </p>
            <p className="ag-hint" id={`${uid}-shape-hint`}>
              A .zip, .shp or .geojson file with this geography’s outline.
            </p>
            <input
              ref={shapeInput}
              className="ux-visually-hidden"
              type="file"
              accept=".zip,.shp,.geojson,.json"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                setShape(e.target.files?.[0]?.name ?? shape);
                e.target.value = '';
              }}
            />
            <div className="ag-shape">
              <span className="ag-shape-count">{shape ? '1 uploaded' : 'No file uploaded'}</span>
              <Button
                variation="secondary"
                icon="FileUpload"
                label="Upload"
                title="Upload shape file"
                onClick={() => shapeInput.current?.click()}
              />
            </div>
            {shape && (
              <p className="ag-shape-file">
                <Icon name="Description" size={18} />
                <span>{shape}</span>
                <button type="button" className="ag-x is-sm" aria-label={`Remove ${shape}`} onClick={() => setShape('')}>
                  <Icon name="Close" size={16} />
                </button>
              </p>
            )}
          </div>
          </div>
        </div>
        <div className="ag-foot">
          <Button variation="secondary" label="Cancel" onClick={close} />
          <Button variation="primary" label="Add geography" submit onClick={() => {}} />
        </div>
      </form>
    </dialog>,
    document.body,
  );
}
