import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button, Toast } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { PRODUCTS, PRODUCT_ORDER, ROLES, newId, type Product, type User } from '../lib/model';
import { Crumbs } from './Crumbs';

/**
 * Team, set up the same way as geographies and notification channels:
 * choose how (by hand or by uploading a file), add the people with their
 * role and the products they can use, send the invites. The page lists
 * everyone, as cards or a list, and each member can be edited or removed.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** A toast to show when the Team page opens, after adding from somewhere else (Home). */
let flash = '';
type Person = { key: string; name: string; email: string; role: string; products: Product[] };

/** A small CSV reader: commas, quoted cells, doubled quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') row.push(cell), (cell = '');
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell), rows.push(row), (row = []), (cell = '');
    } else cell += c;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim()));
}

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob(['Name,Work email,Role,Product access\n'], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'team-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** What a member can see: their role and products, defaulting to Staff on every product that's on. */
const roleOf = (u: User) => u.role ?? 'Staff';
const productsOf = (u: User, on: Product[]) => u.products ?? on;
const productNames = (ps: Product[]) => (ps.length ? ps.map((p) => PRODUCTS[p].name).join(', ') : 'None');

export function Team({ embedded, onDone }: { embedded?: boolean; onDone?: () => void } = {}) {
  const { account, update, go } = useAccount();
  const uid = useId();
  const on = PRODUCT_ORDER.filter((p) => account.products[p].enabled);
  const [adding, setAdding] = useState(!!embedded);
  const [editing, setEditing] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'list'>('cards');
  const [q, setQ] = useState('');
  const [toast, setToast] = useState(() => {
    const t = flash;
    flash = '';
    return t;
  });
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) first.current = false;
    else if (!adding && !editing) heading.current?.focus();
  }, [adding, editing]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const home = { label: 'Home', onClick: embedded ? () => onDone?.() : () => go('home') };
  const toastEl = (
    <div className="cg-toast" role="status" aria-live="polite">
      {toast && <Toast type="success" label={toast} onClose={() => setToast('')} />}
    </div>
  );
  const taken = (email: string, except?: string) =>
    email.toLowerCase() === account.admin.email.toLowerCase() ||
    account.users.some((u) => u.id !== except && u.email.toLowerCase() === email.toLowerCase());

  if (adding)
    return (
      <div className="geo is-creating">
        <AddTeam
          trail={[home, ...(!embedded ? [{ label: 'Team', onClick: () => setAdding(false) }] : [])]}
          products={on}
          taken={taken}
          onCancel={embedded ? () => onDone?.() : () => setAdding(false)}
          onSent={(people) => {
            update((a) => ({
              ...a,
              users: [...a.users, ...people.map((p) => ({ id: newId(), name: p.name.trim(), email: p.email.trim(), role: p.role, products: p.products }))],
            }));
            const msg = `${people.length} ${people.length === 1 ? 'member' : 'members'} added. Invites sent.`;
            // After adding, go to Your team, from Home too.
            if (embedded) {
              flash = msg;
              return go('team');
            }
            setAdding(false);
            setToast(msg);
          }}
        />
      </div>
    );

  const member = account.users.find((u) => u.id === editing);
  if (member)
    return (
      <div className="geo is-creating">
        <EditMember
          trail={[home, { label: 'Team', onClick: () => setEditing(null) }]}
          member={member}
          products={on}
          taken={(e) => taken(e, member.id)}
          onCancel={() => setEditing(null)}
          onSave={(u) => {
            update((a) => ({ ...a, users: a.users.map((x) => (x.id === u.id ? u : x)) }));
            setEditing(null);
            setToast(`${u.name}’s details saved`);
          }}
          onRemove={() => {
            update((a) => ({ ...a, users: a.users.filter((x) => x.id !== member.id) }));
            setEditing(null);
            setToast(`${member.name} removed from the team`);
          }}
        />
        {toastEl}
      </div>
    );

  const everyone: (User & { admin?: boolean })[] = [
    { id: 'admin', name: account.admin.name, email: account.admin.email, role: 'Admin', products: on, admin: true },
    ...account.users,
  ];
  const term = q.trim().toLowerCase();
  const hits = everyone.filter((u) => !term || [u.name, u.email, roleOf(u)].some((x) => x.toLowerCase().includes(term)));

  return (
    <div className="geo is-overview">
      <header className="geo-head geo-band">
        <div className="geo-band-text">
          <h1 ref={heading} tabIndex={-1}>
            Team
          </h1>
          <p className="geo-lead">
            The team is the set of members who have access to the account. Add members and choose what each person can do.
          </p>
        </div>
        <Button variation="primary" icon="Add" label="Add team members" onClick={() => setAdding(true)} />
      </header>
      <div className="geo-bar">
        <h2 className="geo-section-h">
          Your team <span className="geo-section-n">{everyone.length}</span>
        </h2>
        <div className="geo-tools">
          <div className="geo-search">
            <label htmlFor={`${uid}-q`} className="ux-visually-hidden">
              Search the team
            </label>
            <Icon name="Search" size={20} />
            <input id={`${uid}-q`} type="search" placeholder="Search by name, email or role" value={q} onChange={(e) => setQ(e.target.value)} />
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
      <p className={term ? 'geo-count' : 'ux-visually-hidden'} role="status">
        {term ? `${hits.length} ${hits.length === 1 ? 'person' : 'people'} found` : ''}
      </p>
      {!hits.length ? (
        <div className="geo-empty">
          <h2>No one found</h2>
          <p>No one in your team matches “{q.trim()}”.</p>
        </div>
      ) : view === 'cards' ? (
        <ul className="geo-cards">
          {hits.map((u) => (
            <li key={u.id} className="geo-card tm-card">
              <div className="tm-card-top">
                <h3 className="geo-card-h">
                  {u.name}
                  {u.admin && ' (you)'}
                </h3>
                <span className={`geo-status${u.admin ? ' is-active' : ''}`}>{u.admin ? 'Admin' : 'Invited'}</span>
              </div>
              <dl className="tm-fields">
                <div>
                  <dt>Email</dt>
                  <dd>{u.email}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{roleOf(u)}</dd>
                </div>
                <div>
                  <dt>Product access</dt>
                  <dd>{productNames(productsOf(u, on))}</dd>
                </div>
              </dl>
              <div className="geo-actions">
                {u.admin ? (
                  <p className="tm-you">
                    <Icon name="Info" size={18} />
                    Your access cannot be changed.
                  </p>
                ) : (
                  <Button variation="secondary" icon="Edit" label="Edit member details" title={`Edit ${u.name}’s details`} onClick={() => setEditing(u.id)} />
                )}
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
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Product access</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hits.map((u) => (
                <tr key={u.id}>
                  <th scope="row">
                    {u.name}
                    {u.admin && ' (you)'}
                  </th>
                  <td>{u.email}</td>
                  <td>{roleOf(u)}</td>
                  <td>{productNames(productsOf(u, on))}</td>
                  <td>
                    <span className={`geo-status${u.admin ? ' is-active' : ''}`}>{u.admin ? 'Admin' : 'Invited'}</span>
                  </td>
                  <td>
                    {!u.admin && (
                      <div className="geo-row-actions">
                        <Button variation="secondary" size="small" icon="Edit" label="Edit" title={`Edit ${u.name}’s details`} onClick={() => setEditing(u.id)} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toastEl}
    </div>
  );
}

/**
 * One person's fields as a form list, like the sender details: each field on
 * its own row, label on the left, control on the right, error under it.
 */
function PersonFields({
  uid,
  p,
  products,
  errors,
  onChange,
}: {
  uid: string;
  p: Person;
  products: Product[];
  errors: Record<string, string>;
  onChange: (p: Person) => void;
}) {
  const id = (k: string) => `${uid}-${p.key}-${k}`;
  const err = (k: string) => errors[`${p.key}-${k}`];
  const row = (k: string, label: string, control: ReactNode) => (
    <div className={`tm-line${err(k) ? ' has-error' : ''}`}>
      <label htmlFor={id(k)}>{label}</label>
      <div className="tm-line-ctl">
        {control}
        {err(k) && (
          <p className="fld-error" id={`${id(k)}-err`}>
            <span className="ux-visually-hidden">Error: </span>
            {err(k)}
          </p>
        )}
      </div>
    </div>
  );
  const text = (k: 'name' | 'email', type = 'text') => (
    <input
      id={id(k)}
      type={type}
      value={p[k]}
      autoComplete="off"
      aria-invalid={!!err(k) || undefined}
      aria-describedby={err(k) ? `${id(k)}-err` : undefined}
      onChange={(e) => onChange({ ...p, [k]: e.target.value })}
    />
  );
  return (
    <div className="tm-lines">
      {row('name', 'Name', text('name'))}
      {row('email', 'Work email', text('email', 'email'))}
      {row(
        'role',
        'Role',
        <select id={id('role')} value={p.role} onChange={(e) => onChange({ ...p, role: e.target.value })}>
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>,
      )}
      {row(
        'products',
        'Product access',
        <MultiSelect
          id={id('products')}
          options={products.map((pr) => ({ value: pr, label: PRODUCTS[pr].name }))}
          value={p.products}
          invalid={!!err('products')}
          describedBy={err('products') ? `${id('products')}-err` : undefined}
          onChange={(v) => onChange({ ...p, products: v as Product[] })}
        />,
      )}
    </div>
  );
}

/**
 * A dropdown that holds checkboxes: the button shows what's chosen and
 * opens the list; Escape or clicking outside closes it.
 */
function MultiSelect({
  id,
  label,
  options,
  value,
  invalid,
  describedBy,
  onChange,
}: {
  id: string;
  /** Name for the button when there's no <label> pointing at it. */
  label?: string;
  options: { value: string; label: string }[];
  value: string[];
  invalid?: boolean;
  describedBy?: string;
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', away);
    requestAnimationFrame(() => wrap.current?.querySelector<HTMLInputElement>('.msel-panel input')?.focus());
    return () => document.removeEventListener('mousedown', away);
  }, [open]);
  const chosen = options.filter((o) => value.includes(o.value)).map((o) => o.label);
  return (
    <div
      ref={wrap}
      className={`msel${invalid ? ' has-error' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
          button.current?.focus();
        }
      }}
    >
      <button
        ref={button}
        id={id}
        type="button"
        className="msel-btn"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        aria-label={label ? `${label}: ${chosen.length ? chosen.join(', ') : 'none chosen'}` : undefined}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen(!open)}
      >
        <span className={chosen.length ? '' : 'msel-placeholder'}>{chosen.length ? chosen.join(', ') : 'Choose products'}</span>
        <Icon name={open ? 'ArrowDropUp' : 'ArrowDropDown'} size={22} />
      </button>
      {open && (
        <div className="msel-panel" id={`${id}-panel`} role="group" aria-label="Products">
          {options.map((o) => (
            <label key={o.value} className="msel-opt">
              <input
                type="checkbox"
                checked={value.includes(o.value)}
                onChange={() => onChange(value.includes(o.value) ? value.filter((x) => x !== o.value) : [...value, o.value])}
              />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/** The uploaded people as an editable table: one row each, every cell editable, errors in the cell. */
function PeopleTable({
  uid,
  people,
  products,
  errors,
  onChange,
  onAdd,
}: {
  uid: string;
  people: Person[];
  products: Product[];
  errors: Record<string, string>;
  onChange: (p: Person[]) => void;
  onAdd: () => void;
}) {
  const set = (key: string, n: Partial<Person>) => onChange(people.map((x) => (x.key === key ? { ...x, ...n } : x)));
  const cellErr = (p: Person, k: string) =>
    errors[`${p.key}-${k}`] && (
      <p className="fld-error tm-cell-err" id={`${uid}-${p.key}-${k}-err`}>
        <span className="ux-visually-hidden">Error: </span>
        {errors[`${p.key}-${k}`]}
      </p>
    );
  const desc = (p: Person, k: string) => (errors[`${p.key}-${k}`] ? `${uid}-${p.key}-${k}-err` : undefined);
  return (
    <div className="cg-grid-wrap">
      <table className="cg-grid tm-grid">
        <thead>
          <tr>
            <th scope="col" className="cg-grid-n">
              <span className="ux-visually-hidden">Row</span>
            </th>
            <th scope="col">Name</th>
            <th scope="col">Work email</th>
            <th scope="col">Role</th>
            <th scope="col">Product access</th>
            <th scope="col" className="cg-grid-x">
              <span className="ux-visually-hidden">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {people.map((p, i) => (
            <tr key={p.key} className={['name', 'email', 'products'].some((k) => errors[`${p.key}-${k}`]) ? 'has-error' : undefined}>
              <td className="cg-grid-n">{i + 1}</td>
              <td>
                <input
                  id={`${uid}-${p.key}-name`}
                  value={p.name}
                  aria-label={`Name, row ${i + 1}`}
                  aria-invalid={!!errors[`${p.key}-name`] || undefined}
                  aria-describedby={desc(p, 'name')}
                  onChange={(e) => set(p.key, { name: e.target.value })}
                />
                {cellErr(p, 'name')}
              </td>
              <td>
                <input
                  id={`${uid}-${p.key}-email`}
                  type="email"
                  value={p.email}
                  aria-label={`Work email, row ${i + 1}`}
                  aria-invalid={!!errors[`${p.key}-email`] || undefined}
                  aria-describedby={desc(p, 'email')}
                  onChange={(e) => set(p.key, { email: e.target.value })}
                />
                {cellErr(p, 'email')}
              </td>
              <td>
                <select aria-label={`Role, row ${i + 1}`} value={p.role} onChange={(e) => set(p.key, { role: e.target.value })}>
                  {ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </td>
              <td>
                <MultiSelect
                  id={`${uid}-${p.key}-products`}
                  label={`Product access, row ${i + 1}`}
                  options={products.map((pr) => ({ value: pr, label: PRODUCTS[pr].name }))}
                  value={p.products}
                  invalid={!!errors[`${p.key}-products`]}
                  describedBy={desc(p, 'products')}
                  onChange={(v) => set(p.key, { products: v as Product[] })}
                />
                {cellErr(p, 'products')}
              </td>
              <td className="cg-grid-x">
                <button
                  type="button"
                  className="cg-icon-btn"
                  aria-label={`Remove row ${i + 1}${p.name ? `, ${p.name}` : ''}`}
                  disabled={people.length === 1}
                  onClick={() => onChange(people.filter((x) => x.key !== p.key))}
                >
                  <Icon name="Close" size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="lv-add">
        <Button variation="secondary" icon="Add" label="Add a row" onClick={onAdd} />
      </div>
    </div>
  );
}

function checkPerson(p: Person, taken: (e: string) => boolean, seen: Set<string>, e: Record<string, string>) {
  const email = p.email.trim().toLowerCase();
  if (!p.name.trim()) e[`${p.key}-name`] = 'Enter their name';
  if (!EMAIL.test(email)) e[`${p.key}-email`] = 'Enter a work email, like name@example.gov';
  else if (taken(email) || seen.has(email)) e[`${p.key}-email`] = 'Someone with this email is already here';
  if (!p.products.length) e[`${p.key}-products`] = 'Choose at least one product';
  seen.add(email);
}

/** Step 1: how. Step 2: the people, typed in or from the uploaded file. */
function AddTeam({
  trail,
  products,
  taken,
  onCancel,
  onSent,
}: {
  trail: { label: string; onClick?: () => void }[];
  products: Product[];
  taken: (email: string) => boolean;
  onCancel: () => void;
  onSent: (people: Person[]) => void;
}) {
  const uid = useId();
  const blank = (): Person => ({ key: newId(), name: '', email: '', role: 'Staff', products: [...products] });
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<'manual' | 'upload' | ''>('');
  const [people, setPeople] = useState<Person[]>(() => [blank()]);
  const [uploaded, setUploaded] = useState('');
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const showRows = method === 'manual' || !!uploaded;
  const take = async (f: File | undefined) => {
    if (!f) return;
    const data = parseCsv(await f.text());
    const head = (data[0] ?? []).map((c) => c.trim().toLowerCase());
    if (head[0] !== 'name' || !head[1]?.includes('email')) {
      setFileError('The columns should be Name, Work email, Role and Product access. Download the template and try again.');
      return;
    }
    setFileError('');
    const byName = (s: string) => PRODUCT_ORDER.find((p) => PRODUCTS[p].name.toLowerCase() === s.trim().toLowerCase());
    const rows = data.slice(1).map((r) => {
      const listed = (r[3] ?? '')
        .split(/[;|]/)
        .map(byName)
        .filter((p): p is Product => !!p && products.includes(p));
      const role = ROLES.find((x) => x.toLowerCase() === (r[2] ?? '').trim().toLowerCase()) ?? 'Staff';
      return { key: newId(), name: (r[0] ?? '').trim(), email: (r[1] ?? '').trim(), role, products: listed.length ? listed : [...products] };
    });
    setPeople(rows.length ? rows : [blank()]);
    setUploaded(f.name);
    setToast(`${f.name} uploaded`);
  };

  const back = () => {
    setErrors({});
    if (step === 0) return onCancel();
    if (uploaded) {
      setUploaded('');
      setPeople([blank()]);
    }
    setStep(0);
  };
  const next = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!method) e.method = 'Choose how you’d like to add your team';
    } else if (showRows) {
      // Adding by hand is one person: check every field. Uploaded rows skip blank lines.
      const filled = method === 'manual' ? people : people.filter((p) => p.name.trim() || p.email.trim());
      if (!filled.length) e[`${people[0].key}-name`] = 'Enter their name';
      const seen = new Set<string>();
      for (const p of filled) checkPerson(p, taken, seen, e);
    } else e.file = 'Upload the filled-in template first';
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`${uid}-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    if (step === 0) return setStep(1);
    onSent(people.filter((p) => p.name.trim() || p.email.trim()));
  };

  const title = step === 0 ? 'How would you like to add your team?' : method === 'upload' ? (uploaded ? 'Review team members' : 'Upload team data') : 'Add a team member';

  return (
    <div className={`cg-page${step === 1 ? ' is-wide' : ''}`}>
      <Crumbs items={[...trail, { label: 'Add team members' }]} />
      <section className="cg" aria-labelledby={`${uid}-h`}>
        <div className="cg-title-row">
          <h1 id={`${uid}-h`} ref={heading} tabIndex={-1}>
            {title}
          </h1>
          {step === 1 && method === 'upload' && !uploaded && (
            <Button variation="secondary" icon="FileDownload" label="Download template" onClick={downloadTemplate} />
          )}
        </div>
        {step === 0 ? (
          <div className="cg-sub">
            <p>Upload a file using the template to add many people at once, or add them one at a time. Everyone you add gets an email invite.</p>
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
          {step === 0 && (
            <fieldset className={`qz-tiles cg-tiles${errors.method ? ' has-error' : ''}`} aria-describedby={errors.method ? `${uid}-method-error` : undefined}>
              <legend className="ux-visually-hidden">How would you like to add your team?</legend>
              {errors.method && (
                <p id={`${uid}-method-error`} className="fld-error">
                  <span className="ux-visually-hidden">Error: </span>
                  {errors.method}
                </p>
              )}
              <div className="qz-tile-row">
                {(
                  [
                    ['manual', 'AddCircle', 'Add Team Members Manually'],
                    ['upload', 'FileUpload', 'Bulk Upload Team Data'],
                  ] as const
                ).map(([value, icon, label], i) => (
                  <label key={value} className={`qz-tile${method === value ? ' is-on' : ''}`}>
                    <input
                      type="radio"
                      name={`${uid}-method`}
                      id={i === 0 ? `${uid}-method` : undefined}
                      checked={method === value}
                      onChange={() => {
                        setMethod(value);
                        setErrors({});
                      }}
                    />
                    <span className="cg-tile-icon" aria-hidden="true">
                      <Icon name={icon} size={28} />
                    </span>
                    <span className="qz-tile-label">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 1 && method === 'upload' && !uploaded && (
            <>
              <div className="up" role="group" aria-label="Upload a file">
                <input
                  ref={input}
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
                <div
                  className="up-drop"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    take(e.dataTransfer.files?.[0]);
                  }}
                >
                  <Icon name="FileUpload" size={40} />
                  <p>
                    Drag and drop your file or{' '}
                    <button type="button" id={`${uid}-file`} className="up-browse" onClick={() => input.current?.click()}>
                      Browse in my files
                    </button>
                  </p>
                </div>
                {(fileError || errors.file) && (
                  <p className="fld-error" role="alert">
                    {fileError || errors.file}
                  </p>
                )}
              </div>
            </>
          )}

          {step === 1 && method === 'manual' && (
            <div className="tm-row ch-sec">
              <PersonFields
                uid={uid}
                p={people[0]}
                products={products}
                errors={errors}
                onChange={(n) => setPeople([n])}
              />
            </div>
          )}

          {step === 1 && method === 'upload' && !!uploaded && (
            <PeopleTable
              uid={uid}
              people={people}
              products={products}
              errors={errors}
              onChange={setPeople}
              onAdd={() => setPeople([...people, blank()])}
            />
          )}
          <button type="submit" className="ux-visually-hidden" tabIndex={-1} aria-hidden="true" />
        </form>
      </section>
      <div className="cg-toast" role="status" aria-live="polite">
        {toast && <Toast type="success" label={toast} onClose={() => setToast('')} />}
      </div>
      <footer className="cg-bar">
        <Button variation="secondary" icon="ArrowBack" label="Back" onClick={back} />
        <Button
          variation="primary"
          label={step === 1 ? 'Send invites' : 'Next'}
          icon={step === 1 ? undefined : 'ArrowForward'}
          isSuffix
          onClick={next}
        />
      </footer>
    </div>
  );
}

function EditMember({
  trail,
  member,
  products,
  taken,
  onCancel,
  onSave,
  onRemove,
}: {
  trail: { label: string; onClick?: () => void }[];
  member: User;
  products: Product[];
  taken: (email: string) => boolean;
  onCancel: () => void;
  onSave: (u: User) => void;
  onRemove: () => void;
}) {
  const uid = useId();
  const [p, setP] = useState<Person>({
    key: member.id,
    name: member.name,
    email: member.email,
    role: roleOf(member),
    products: productsOf(member, products),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const save = () => {
    const e: Record<string, string> = {};
    checkPerson(p, taken, new Set(), e);
    setErrors(e);
    if (Object.keys(e).length) return document.getElementById(`${uid}-${Object.keys(e)[0]}`)?.focus();
    onSave({ ...member, name: p.name.trim(), email: p.email.trim(), role: p.role, products: p.products });
  };
  return (
    <div className="cg-page">
      <Crumbs items={[...trail, { label: `Edit ${member.name}` }]} />
      <section className="cg" aria-labelledby={`${uid}-h`}>
        <h1 id={`${uid}-h`} ref={heading} tabIndex={-1}>
          Edit {member.name}’s details
        </h1>
        <div className="cg-gap" />
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="tm-row ch-sec is-edit">
            <div>
              <PersonFields uid={uid} p={p} products={products} errors={errors} onChange={setP} />
            </div>
          </div>
          <button type="submit" className="ux-visually-hidden" tabIndex={-1} aria-hidden="true" />
        </form>
      </section>
      <footer className="cg-bar">
        <Button variation="secondary" icon="ArrowBack" label="Back" onClick={onCancel} />
        <div className="cg-bar-end">
          <Button
            variation="secondary"
            icon="Delete"
            label="Remove from team"
            onClick={() => window.confirm(`Remove ${member.name} from the team? They won’t be able to sign in.`) && onRemove()}
          />
          <Button variation="primary" label="Save changes" onClick={save} />
        </div>
      </footer>
    </div>
  );
}
