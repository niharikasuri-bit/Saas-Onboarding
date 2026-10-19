import { useEffect, useId, useRef, useState } from 'react';
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
  const [toast, setToast] = useState('');
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
            if (embedded) return onDone?.();
            setAdding(false);
            setToast(`${people.length} ${people.length === 1 ? 'invite' : 'invites'} sent`);
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

/** One person's fields, labels on top and errors under each field so the inputs line up. */
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
  const field = (k: 'name' | 'email', label: string, type = 'text') => (
    <div className={`tm-fld${err(k) ? ' has-error' : ''}`}>
      <label htmlFor={id(k)}>{label}</label>
      <input
        id={id(k)}
        type={type}
        value={p[k]}
        autoComplete="off"
        aria-invalid={!!err(k) || undefined}
        aria-describedby={err(k) ? `${id(k)}-err` : undefined}
        onChange={(e) => onChange({ ...p, [k]: e.target.value })}
      />
      {err(k) && (
        <p className="fld-error" id={`${id(k)}-err`}>
          <span className="ux-visually-hidden">Error: </span>
          {err(k)}
        </p>
      )}
    </div>
  );
  return (
    <>
      {field('name', 'Name')}
      {field('email', 'Work email', 'email')}
      <div className="tm-fld">
        <label htmlFor={id('role')}>Role</label>
        <select id={id('role')} value={p.role} onChange={(e) => onChange({ ...p, role: e.target.value })}>
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <fieldset className={`tm-fld tm-access${err('products') ? ' has-error' : ''}`} aria-describedby={err('products') ? `${id('products')}-err` : undefined}>
        <legend>Product access</legend>
        <div className="tm-checks">
          {products.map((pr) => (
            <label key={pr} className="tm-check">
              <input
                type="checkbox"
                id={pr === products[0] ? id('products') : undefined}
                checked={p.products.includes(pr)}
                onChange={() => onChange({ ...p, products: p.products.includes(pr) ? p.products.filter((x) => x !== pr) : [...p.products, pr] })}
              />
              {PRODUCTS[pr].name}
            </label>
          ))}
        </div>
        {err('products') && (
          <p className="fld-error" id={`${id('products')}-err`}>
            <span className="ux-visually-hidden">Error: </span>
            {err('products')}
          </p>
        )}
      </fieldset>
    </>
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
      const filled = people.filter((p) => p.name.trim() || p.email.trim());
      if (!filled.length) e[`${people[0].key}-name`] = 'Add at least one person';
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

  const title = step === 0 ? 'How would you like to add your team?' : method === 'upload' ? (uploaded ? 'Review team members' : 'Upload team data') : 'Add team members';

  return (
    <div className={`cg-page${step === 1 ? ' is-wide' : ''}`}>
      <Crumbs items={[...trail, { label: 'Add team members' }]} />
      <section className="cg" aria-labelledby={`${uid}-h`}>
        <h1 id={`${uid}-h`} ref={heading} tabIndex={-1}>
          {title}
        </h1>
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
              <div className="up-top">
                <Button variation="secondary" icon="FileDownload" label="Download template" onClick={downloadTemplate} />
              </div>
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

          {step === 1 && showRows && (
            <div className="tm-rows">
              <ol className="lv-list">
                {people.map((p, i) => (
                  <li key={p.key} className="tm-row">
                    <div className="tm-row-head">
                      <span className="lv-n">Member {i + 1}</span>
                      <button
                        type="button"
                        className="lv-remove"
                        aria-label={`Remove member ${i + 1}${p.name ? `, ${p.name}` : ''}`}
                        disabled={people.length === 1}
                        onClick={() => setPeople(people.filter((x) => x.key !== p.key))}
                      >
                        <Icon name="Close" size={18} />
                      </button>
                    </div>
                    <div className="tm-row-fields">
                      <PersonFields
                        uid={uid}
                        p={p}
                        products={products}
                        errors={errors}
                        onChange={(n) => setPeople(people.map((x) => (x.key === p.key ? n : x)))}
                      />
                    </div>
                  </li>
                ))}
              </ol>
              <div className="lv-add">
                <Button variation="secondary" icon="Add" label="Add member" onClick={() => setPeople([...people, blank()])} />
              </div>
            </div>
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
          <div className="tm-row is-edit">
            <div className="tm-row-fields">
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
