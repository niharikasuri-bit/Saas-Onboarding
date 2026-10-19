import { useEffect, useId, useRef, useState } from 'react';
import { Button, Toast } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { newId, type User } from '../lib/model';
import { Field, describedBy } from './StepFrame';
import { Crumbs } from './Crumbs';

/**
 * Team, set up the same way as geographies and notification channels:
 * choose how (by hand or by uploading a file), add the people, send the
 * invites. The page lists everyone, as cards or a list, and each member can
 * be edited or removed.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Person = { key: string; name: string; email: string };
const blank = (): Person => ({ key: newId(), name: '', email: '' });

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
  const url = URL.createObjectURL(new Blob(['Name,Work email\n'], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'team-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function Team({ embedded, onDone }: { embedded?: boolean; onDone?: () => void } = {}) {
  const { account, update, go } = useAccount();
  const uid = useId();
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
          taken={taken}
          onCancel={embedded ? () => onDone?.() : () => setAdding(false)}
          onSent={(people) => {
            update((a) => ({ ...a, users: [...a.users, ...people.map((p) => ({ id: newId(), name: p.name.trim(), email: p.email.trim() }))] }));
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

  const everyone: (User & { admin?: boolean })[] = [{ id: 'admin', name: account.admin.name, email: account.admin.email, admin: true }, ...account.users];
  const term = q.trim().toLowerCase();
  const hits = everyone.filter((u) => !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));

  return (
    <div className="geo is-overview">
      <header className="geo-head geo-band">
        <div className="geo-band-text">
          <h1 ref={heading} tabIndex={-1}>
            Team
          </h1>
          <p className="geo-lead">The team is the set of members who have access to the account. Add members and choose what each person can do.</p>
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
            <input id={`${uid}-q`} type="search" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
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
            <li key={u.id} className="geo-card">
              <div className="geo-card-top">
                <span className={`geo-status${u.admin ? ' is-active' : ''}`}>{u.admin ? 'Admin' : 'Invited'}</span>
              </div>
              <h3 className="geo-card-h">
                {u.name}
                {u.admin && ' (you)'}
              </h3>
              <p className="ch-note tm-email">{u.email}</p>
              {!u.admin && (
                <div className="geo-actions">
                  <Button variation="secondary" icon="Edit" label="Edit member details" title={`Edit ${u.name}’s details`} onClick={() => setEditing(u.id)} />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="geo-table-wrap">
          <table className="geo-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Work email</th>
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

/** Step 1: how. Step 2: the people, typed in or from the uploaded file. */
function AddTeam({
  trail,
  taken,
  onCancel,
  onSent,
}: {
  trail: { label: string; onClick?: () => void }[];
  taken: (email: string) => boolean;
  onCancel: () => void;
  onSent: (people: Person[]) => void;
}) {
  const uid = useId();
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<'manual' | 'upload' | ''>('');
  const [people, setPeople] = useState<Person[]>([blank()]);
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
      setFileError('The columns should be Name, then Work email. Download the template and try again.');
      return;
    }
    setFileError('');
    const rows = data.slice(1).map((r) => ({ key: newId(), name: (r[0] ?? '').trim(), email: (r[1] ?? '').trim() }));
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
      for (const p of filled) {
        const email = p.email.trim().toLowerCase();
        if (!p.name.trim()) e[`${p.key}-name`] = 'Enter their name';
        if (!EMAIL.test(email)) e[`${p.key}-email`] = 'Enter a work email, like name@example.gov';
        else if (taken(email) || seen.has(email)) e[`${p.key}-email`] = 'Someone with this email is already here';
        seen.add(email);
      }
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
  const lead =
    step === 0
      ? 'Upload a file using the template to add many people at once, or add them one at a time. Everyone you add gets an email invite.'
      : '';

  return (
    <div className={`cg-page${step === 1 ? ' is-wide' : ''}`}>
      <Crumbs items={[...trail, { label: 'Add team members' }]} />
      <section className="cg" aria-labelledby={`${uid}-h`}>
        <h1 id={`${uid}-h`} ref={heading} tabIndex={-1}>
          {title}
        </h1>
        {lead ? (
          <div className="cg-sub">
            <p>{lead}</p>
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
            <div className="up" role="group" aria-label="Upload a file">
              <div className="up-head">
                <Button variation="secondary" icon="FileDownload" label="Download template" onClick={downloadTemplate} />
              </div>
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
          )}

          {step === 1 && showRows && (
            <div className="tm-rows">
              <ol className="lv-list">
                {people.map((p, i) => (
                  <li key={p.key} className="tm-row">
                    <span className="lv-n">Member {i + 1}</span>
                    <Field id={`${uid}-${p.key}-name`} label="Name" error={errors[`${p.key}-name`]}>
                      <input
                        id={`${uid}-${p.key}-name`}
                        value={p.name}
                        autoComplete="off"
                        aria-invalid={!!errors[`${p.key}-name`] || undefined}
                        aria-describedby={describedBy(`${uid}-${p.key}-name`, undefined, errors[`${p.key}-name`])}
                        onChange={(e) => setPeople(people.map((x) => (x.key === p.key ? { ...x, name: e.target.value } : x)))}
                      />
                    </Field>
                    <Field id={`${uid}-${p.key}-email`} label="Work email" error={errors[`${p.key}-email`]}>
                      <input
                        id={`${uid}-${p.key}-email`}
                        type="email"
                        value={p.email}
                        autoComplete="off"
                        aria-invalid={!!errors[`${p.key}-email`] || undefined}
                        aria-describedby={describedBy(`${uid}-${p.key}-email`, undefined, errors[`${p.key}-email`])}
                        onChange={(e) => setPeople(people.map((x) => (x.key === p.key ? { ...x, email: e.target.value } : x)))}
                      />
                    </Field>
                    <button
                      type="button"
                      className="lv-remove"
                      aria-label={`Remove member ${i + 1}${p.name ? `, ${p.name}` : ''}`}
                      disabled={people.length === 1}
                      onClick={() => setPeople(people.filter((x) => x.key !== p.key))}
                    >
                      <Icon name="Close" size={18} />
                    </button>
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
  taken,
  onCancel,
  onSave,
  onRemove,
}: {
  trail: { label: string; onClick?: () => void }[];
  member: User;
  taken: (email: string) => boolean;
  onCancel: () => void;
  onSave: (u: User) => void;
  onRemove: () => void;
}) {
  const uid = useId();
  const [f, setF] = useState({ name: member.name, email: member.email });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const save = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Enter their name';
    if (!EMAIL.test(f.email.trim())) e.email = 'Enter a work email, like name@example.gov';
    else if (taken(f.email.trim())) e.email = 'Someone with this email is already here';
    setErrors(e);
    if (Object.keys(e).length) return document.getElementById(`${uid}-${Object.keys(e)[0]}`)?.focus();
    onSave({ ...member, name: f.name.trim(), email: f.email.trim() });
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
          className="ch-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="cg-split">
            <Field id={`${uid}-name`} label="Name" error={errors.name}>
              <input
                id={`${uid}-name`}
                value={f.name}
                aria-invalid={!!errors.name || undefined}
                aria-describedby={describedBy(`${uid}-name`, undefined, errors.name)}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
            </Field>
          </div>
          <div className="cg-split">
            <Field id={`${uid}-email`} label="Work email" error={errors.email}>
              <input
                id={`${uid}-email`}
                type="email"
                value={f.email}
                aria-invalid={!!errors.email || undefined}
                aria-describedby={describedBy(`${uid}-email`, undefined, errors.email)}
                onChange={(e) => setF({ ...f, email: e.target.value })}
              />
            </Field>
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
