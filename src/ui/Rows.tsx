import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { patchData, useAccount } from '../lib/store';
import { download, parseCsv, toCsv } from '../lib/csv';
import {
  APK_MODULES,
  FIELD_CHECKLISTS,
  LEVELS,
  LNP_FLOW,
  MESSAGES,
  METRICS,
  STRATEGIES,
  TEMPLATES,
  activeService,
  deptsNoOwner,
  hcmTemplate,
  lnpTemplate,
  senderReady,
  templateById,
  unmappedTypes,
  type Product,
} from '../lib/model';
import { Field } from './StepFrame';
import { DepartmentsBody } from './Departments';

/** The body of a checklist row's modal. Saving finishes the row. */
export function RowBody({ p, row }: { p: Product; row: string }) {
  const k = `${p}:${row}`;
  switch (k) {
    case 'cms:types':
      return <CmsTypes />;
    case 'cms:owners':
      return <CmsOwners />;
    case 'cms:flow':
      return <Flow p="cms" />;
    case 'cms:sla':
      return <Sla />;
    case 'cms:notify':
    case 'lnp:notify':
      return <Notify p={p as 'cms' | 'lnp'} />;
    case 'cms:perf':
    case 'lnp:perf':
    case 'hcm:monitor':
      return <Metrics p={p} row={row} />;
    case 'lnp:types':
      return <LnpTypes />;
    case 'lnp:fees':
      return <Fees />;
    case 'lnp:owners':
      return <LnpOwners />;
    case 'lnp:flow':
      return <Flow p="lnp" />;
    case 'hcm:basics':
      return <Basics />;
    case 'hcm:areas':
      return <CampaignAreas />;
    case 'hcm:strategy':
      return <Strategy />;
    case 'hcm:apk':
      return <Apk />;
    case 'hcm:plan':
      return <Plan />;
    case 'hcm:checklists':
      return <Checklists />;
  }
  return null;
}

function Save({ label, onClick, disabled, note }: { label: string; onClick: () => void; disabled?: boolean; note?: ReactNode }) {
  return (
    <div className="form-foot sm-save">
      <Button variation="primary" label={label} isDisabled={disabled} onClick={() => !disabled && onClick()} />
      {note && <p className="form-note">{note}</p>}
    </div>
  );
}

function Toggle({ label, on, onChange, disabled }: { label: string; on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <li>
      <label className="switch-row">
        <span>{label}</span>
        <span className="switch">
          <input type="checkbox" role="switch" checked={on} disabled={disabled} onChange={onChange} />
          <span aria-hidden="true" />
        </span>
      </label>
    </li>
  );
}

function Checks({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <fieldset className="card ck">
      <legend className="sm-h3">{legend}</legend>
      <ul className="ck-list">
        {options.map((o) => (
          <li key={o}>
            <label className="ck-opt">
              <input
                type="checkbox"
                checked={value.includes(o)}
                onChange={() => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])}
              />
              {o}
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/* ---------------------------------------------------------------- */
/* Complaints                                                        */
/* ---------------------------------------------------------------- */

function CmsTypes() {
  const { account, update, finishRow } = useAccount();
  const uid = useId();
  const svc = activeService(account)!;
  const t = templateById(svc.templateId)!;
  const [name, setName] = useState(svc.name);
  const [types, setTypes] = useState(svc.types);
  const groups = [...new Set(t.types.map((x) => x.group))];

  return (
    <>
      <section className="card form">
        <Field id={`${uid}-n`} label="Service name" hint="What citizens see.">
          <input id={`${uid}-n`} value={name} aria-describedby={`${uid}-n-hint`} onChange={(e) => setName(e.target.value)} />
        </Field>
      </section>
      <section className="card" aria-labelledby={`${uid}-t`}>
        <h3 id={`${uid}-t`} className="sm-h3">
          What people can report
        </h3>
        <p className="card-lead">All are on. Turn off anything you don’t handle.</p>
        {groups.map((g) => (
          <div key={g} className="ut-group">
            <p className="ut-g">{g}</p>
            <ul className="ut-types">
              {t.types
                .filter((x) => x.group === g)
                .map((x) => (
                  <Toggle
                    key={x.id}
                    label={x.label}
                    on={types.includes(x.id)}
                    disabled={types.length === 1 && types.includes(x.id)}
                    onChange={() => setTypes(t.types.map((y) => y.id).filter((y) => toggle(types, x.id).includes(y)))}
                  />
                ))}
            </ul>
          </div>
        ))}
      </section>
      <Save
        label="Save Complaint Types"
        disabled={!name.trim()}
        onClick={() => {
          update((a) => ({
            ...a,
            services: a.services.map((s) => (s.id === svc.id ? { ...s, name: name.trim(), types } : s)),
          }));
          finishRow('cms', 'types', `${types.length} complaint types on, in ${name.trim()}`);
        }}
      />
    </>
  );
}

function CmsOwners() {
  const { account, update, finishRow } = useAccount();
  const uid = useId();
  const owners = account.products.cms.data.owners;
  const used = account.departments.filter((d) => Object.values(account.mapping).includes(d.id));
  const left = unmappedTypes(account).length;
  const noOwner = deptsNoOwner(account).length;
  const svc = activeService(account)!;

  return (
    <>
      <DepartmentsBody />
      {used.length > 0 && (
        <section className="card" aria-labelledby={`${uid}-h`}>
          <h3 id={`${uid}-h`} className="sm-h3">
            Who owns each department’s complaints
          </h3>
          <p className="card-lead">They get the complaint first and can pass it on. Choose from the users you invited.</p>
          <ul className="map-list">
            {used.map((d) => (
              <li key={d.id}>
                <label htmlFor={`${uid}-${d.id}`}>{d.name}</label>
                <select
                  id={`${uid}-${d.id}`}
                  value={owners[d.id] ?? ''}
                  className={owners[d.id] ? undefined : 'is-empty'}
                  onChange={(e) => update(patchData('cms', { owners: { ...owners, [d.id]: e.target.value } }))}
                >
                  <option value="">No owner yet</option>
                  {account.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Save
        label="Save Owners"
        disabled={!used.length || left > 0 || noOwner > 0}
        note={
          left
            ? `${left} complaint types still need a department.`
            : noOwner
              ? `${noOwner} departments still need an owner.`
              : !used.length
                ? 'Add a department and send complaint types to it.'
                : undefined
        }
        onClick={() =>
          finishRow('cms', 'owners', `${svc.types.length} types go to ${used.length} ${used.length === 1 ? 'department' : 'departments'}, each with an owner`)
        }
      />
    </>
  );
}

function Flow({ p }: { p: 'cms' | 'lnp' }) {
  const { account, update, finishRow } = useAccount();
  const svc = activeService(account);
  const steps = p === 'cms' ? (svc && templateById(svc.templateId)?.workflow) ?? TEMPLATES[0].workflow : LNP_FLOW;
  const why: Record<string, string> =
    p === 'cms'
      ? {
          Submitted: 'The citizen gets a reference number.',
          Assigned: 'It goes to the owner of the department that handles that type.',
          'In progress': 'The owner updates it as they work.',
          Resolved: 'The citizen is told it’s fixed.',
          'Rated by citizen': 'The citizen rates how it went.',
        }
      : {
          Applied: 'The applicant gets a reference number.',
          'Fee paid': 'Payment is confirmed automatically.',
          'Documents checked': 'The owner for that licence type checks the documents.',
          Inspected: 'An inspection, if the licence type needs one.',
          Approved: 'The owner approves it, or sends it back with a reason.',
          'Licence issued': 'The applicant can download it.',
        };
  return (
    <>
      <section className="card">
        <ol className="wf">
          {steps.map((w, i) => (
            <li key={w}>
              <span className="wf-n" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <strong>{w}</strong>
                <span>{why[w]}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <Save
        label="Confirm Steps"
        onClick={() => {
          update(patchData(p, { flowConfirmed: true }));
          finishRow(p, 'flow', `${steps.length} steps, from ${steps[0]} to ${steps[steps.length - 1]}`);
        }}
      />
    </>
  );
}

const ALERTS = [
  { id: 'supervisor', label: 'The department owner’s supervisor' },
  { id: 'manager', label: 'The department manager' },
  { id: 'both', label: 'Both, one after the other' },
];

function Sla() {
  const { account, update, finishRow } = useAccount();
  const uid = useId();
  const [sla, setSla] = useState(account.products.cms.data.sla);
  return (
    <>
      <section className="card form">
        <Field id={`${uid}-d`} label="Days to resolve a complaint" hint="After this, it’s late.">
          <select
            id={`${uid}-d`}
            value={sla.days}
            aria-describedby={`${uid}-d-hint`}
            onChange={(e) => setSla({ ...sla, days: Number(e.target.value) })}
          >
            {[1, 2, 3, 5, 7, 10, 14].map((d) => (
              <option key={d} value={d}>
                {d} {d === 1 ? 'day' : 'days'}
              </option>
            ))}
          </select>
        </Field>
        <fieldset className="fld">
          <legend className="fld-label">When it’s late, alert</legend>
          {ALERTS.map((x) => (
            <label key={x.id} className="ck-opt">
              <input type="radio" name={`${uid}-a`} checked={sla.alert === x.id} onChange={() => setSla({ ...sla, alert: x.id })} />
              {x.label}
            </label>
          ))}
        </fieldset>
      </section>
      <Save
        label="Save Deadlines"
        onClick={() => {
          update(patchData('cms', { sla }));
          finishRow('cms', 'sla', `Resolve in ${sla.days} days; late ones go to ${ALERTS.find((x) => x.id === sla.alert)!.label.toLowerCase()}`);
        }}
      />
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Shared: messages and tracking                                     */
/* ---------------------------------------------------------------- */

/** Messages can be edited any time; turning them on needs sender details. */
function Notify({ p }: { p: 'cms' | 'lnp' }) {
  const { account, update, finishRow, go, closeModal } = useAccount();
  const uid = useId();
  const saved = account.products[p].data;
  const [text, setText] = useState<Record<string, string>>(() =>
    Object.fromEntries(MESSAGES[p].map((m) => [m.id, saved.messages[m.id] ?? m.text])),
  );
  const ready = senderReady(account);
  const [on, setOn] = useState(saved.messagesOn || ready);

  return (
    <>
      {!ready && (
        <div className="acct-note">
          <span className="tag acct">Account</span>
          <p>
            Turning messages on needs sender details. You can edit the messages now.
          </p>
          <button
            type="button"
            className="lnk"
            onClick={() => {
              update(patchData(p, { messages: text }));
              closeModal();
              go('home', { highlight: 'sender' });
            }}
          >
            Add Sender Details on Home
          </button>
        </div>
      )}
      <section className="card form" aria-labelledby={`${uid}-h`}>
        <h3 id={`${uid}-h`} className="sm-h3">
          Messages
        </h3>
        <p className="card-lead">Words in braces, like {'{ref}'}, are filled in for each person.</p>
        {MESSAGES[p].map((m) => (
          <Field key={m.id} id={`${uid}-${m.id}`} label={m.when}>
            <textarea
              id={`${uid}-${m.id}`}
              rows={2}
              value={text[m.id]}
              onChange={(e) => setText({ ...text, [m.id]: e.target.value })}
            />
          </Field>
        ))}
        <ul className="ut-types">
          <Toggle label="Send these messages" on={on && ready} disabled={!ready} onChange={() => setOn(!on)} />
        </ul>
        {!ready && (
          <p className="fld-hint">
            <Icon name="Lock" size={14} /> Locked until sender details are submitted on Home.
          </p>
        )}
      </section>
      <Save
        label={ready && on ? 'Save and Turn On' : 'Save Messages'}
        note={!ready ? 'Saved messages stay here. The row is done once they’re turned on.' : undefined}
        onClick={() => {
          update(patchData(p, { messages: text, messagesOn: ready && on }));
          if (ready && on) finishRow(p, 'notify', `${MESSAGES[p].length} messages on, sent by ${senderLabel(account)}`);
          else closeModal();
        }}
      />
    </>
  );
}

const senderLabel = (a: ReturnType<typeof useAccount>['account']) =>
  (['sms', 'email', 'whatsapp'] as const)
    .filter((c) => a.sender[c].state !== 'none')
    .map((c) => (c === 'sms' ? 'SMS' : c === 'email' ? 'email' : 'WhatsApp'))
    .join(' and ');

function Metrics({ p, row }: { p: Product; row: string }) {
  const { account, update, finishRow } = useAccount();
  const saved = account.products[p].data.metrics;
  const [v, setV] = useState(saved.length ? saved : METRICS[p].slice(0, 3));
  return (
    <>
      <Checks legend="Track these" options={METRICS[p]} value={v} onChange={setV} />
      <Save
        label="Save Tracking"
        disabled={!v.length}
        note={!v.length ? 'Choose at least one.' : undefined}
        onClick={() => {
          update(patchData(p, { metrics: v }));
          finishRow(p, row, `Tracking ${v.length}: ${v.slice(0, 2).join(', ').toLowerCase()}${v.length > 2 ? ' and more' : ''}`);
        }}
      />
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Licences and permits                                              */
/* ---------------------------------------------------------------- */

function LnpTypes() {
  const { account, update, finishRow } = useAccount();
  const t = lnpTemplate(account)!;
  const [types, setTypes] = useState(account.products.lnp.data.types);
  return (
    <>
      <section className="card">
        <h3 className="sm-h3">What people can apply for</h3>
        <p className="card-lead">All are on. Turn off anything you don’t issue.</p>
        <ul className="ut-types">
          {t.types.map((x) => (
            <Toggle
              key={x.id}
              label={x.label}
              on={types.includes(x.id)}
              disabled={types.length === 1 && types.includes(x.id)}
              onChange={() => setTypes(toggle(types, x.id))}
            />
          ))}
        </ul>
      </section>
      <Save
        label="Save Licence Types"
        onClick={() => {
          update(patchData('lnp', { types }));
          finishRow('lnp', 'types', `${types.length} licence types on`);
        }}
      />
    </>
  );
}

const PAYMENTS = ['Mobile money', 'Card', 'Bank transfer', 'At the counter'];

function Fees() {
  const { account, update, finishRow } = useAccount();
  const uid = useId();
  const t = lnpTemplate(account)!;
  const d = account.products.lnp.data;
  const [fees, setFees] = useState<Record<string, string>>(() =>
    Object.fromEntries(d.types.map((id) => [id, String(d.fees[id] ?? t.types.find((x) => x.id === id)?.fee ?? '')])),
  );
  const [pay, setPay] = useState(d.payments.length ? d.payments : ['Mobile money', 'Card']);
  const bad = d.types.filter((id) => !/^\d+$/.test(fees[id] ?? ''));

  return (
    <>
      <section className="card form" aria-labelledby={`${uid}-h`}>
        <h3 id={`${uid}-h`} className="sm-h3">
          Fees, in Kenyan shillings
        </h3>
        <div className="row">
          {d.types.map((id) => (
            <Field key={id} id={`${uid}-${id}`} label={t.types.find((x) => x.id === id)?.label ?? id}>
              <input
                id={`${uid}-${id}`}
                inputMode="numeric"
                value={fees[id] ?? ''}
                onChange={(e) => setFees({ ...fees, [id]: e.target.value.replace(/[^\d]/g, '') })}
              />
            </Field>
          ))}
        </div>
      </section>
      <Checks legend="How people can pay" options={PAYMENTS} value={pay} onChange={setPay} />
      <Save
        label="Save Fees"
        disabled={bad.length > 0 || !pay.length}
        note={bad.length ? 'Enter a fee for every licence type. Use 0 if it’s free.' : !pay.length ? 'Choose at least one way to pay.' : undefined}
        onClick={() => {
          update(patchData('lnp', { fees: Object.fromEntries(d.types.map((id) => [id, Number(fees[id])])), payments: pay }));
          finishRow('lnp', 'fees', `${d.types.length} fees set; pay by ${pay.join(', ').toLowerCase()}`);
        }}
      />
    </>
  );
}

function LnpOwners() {
  const { account, update, finishRow } = useAccount();
  const uid = useId();
  const t = lnpTemplate(account)!;
  const d = account.products.lnp.data;
  const left = d.types.filter((id) => !account.users.some((u) => u.id === d.owners[id])).length;
  return (
    <>
      <section className="card" aria-labelledby={`${uid}-h`}>
        <h3 id={`${uid}-h`} className="sm-h3">
          Who reviews each kind of application
        </h3>
        <p className="card-lead">Choose from the users you invited.</p>
        <ul className="map-list">
          {d.types.map((id) => (
            <li key={id}>
              <label htmlFor={`${uid}-${id}`}>{t.types.find((x) => x.id === id)?.label}</label>
              <select
                id={`${uid}-${id}`}
                value={d.owners[id] ?? ''}
                className={d.owners[id] ? undefined : 'is-empty'}
                onChange={(e) => update(patchData('lnp', { owners: { ...d.owners, [id]: e.target.value } }))}
              >
                <option value="">No owner yet</option>
                {account.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </section>
      <Save
        label="Save Owners"
        disabled={left > 0}
        note={left ? `${left} still need an owner.` : undefined}
        onClick={() => finishRow('lnp', 'owners', `All ${d.types.length} licence types have an owner`)}
      />
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Health campaigns                                                  */
/* ---------------------------------------------------------------- */

function Basics() {
  const { account, update, finishRow } = useAccount();
  const uid = useId();
  const t = hcmTemplate(account);
  const saved = account.products.hcm.data.basics;
  const [b, setB] = useState(
    saved.name ? saved : { name: t ? `${t.name} 2027` : '', start: '', end: '', target: t?.target ?? '' },
  );
  const [error, setError] = useState('');

  const save = () => {
    if (!b.name.trim()) return setError('Give the campaign a name');
    if (!b.start || !b.end) return setError('Choose a start and end date');
    if (b.end < b.start) return setError('The end date is before the start date');
    if (!b.target.trim()) return setError('Say who you’re reaching');
    update(patchData('hcm', { basics: b }));
    finishRow('hcm', 'basics', `${b.name.trim()}, ${fmt(b.start)} to ${fmt(b.end)}`);
  };

  return (
    <>
      <section className="card form">
        {error && (
          <p className="fld-error" role="alert">
            {error}
          </p>
        )}
        <Field id={`${uid}-n`} label="Campaign name">
          <input id={`${uid}-n`} value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} />
        </Field>
        <div className="row">
          <Field id={`${uid}-s`} label="Starts">
            <input id={`${uid}-s`} type="date" value={b.start} onChange={(e) => setB({ ...b, start: e.target.value })} />
          </Field>
          <Field id={`${uid}-e`} label="Ends">
            <input id={`${uid}-e`} type="date" value={b.end} onChange={(e) => setB({ ...b, end: e.target.value })} />
          </Field>
        </div>
        <Field id={`${uid}-t`} label="Who you’re reaching" hint="For example: households, or children under 5.">
          <input
            id={`${uid}-t`}
            value={b.target}
            aria-describedby={`${uid}-t-hint`}
            onChange={(e) => setB({ ...b, target: e.target.value })}
          />
        </Field>
      </section>
      <Save label="Save Basics" onClick={save} />
    </>
  );
}

const fmt = (d: string) =>
  d ? new Date(`${d}T00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

function CampaignAreas() {
  const { account, update, finishRow } = useAccount();
  const uid = useId();
  const areas = account.geography.areas;
  const deepest = Math.max(...areas.map((x) => x.level));
  const [level, setLevel] = useState(deepest);
  const [ids, setIds] = useState(account.products.hcm.data.areaIds);
  const atLevel = areas.filter((x) => x.level === level);
  const parent = (pid: string | null) => areas.find((x) => x.id === pid)?.name ?? '';

  return (
    <>
      <section className="card" aria-labelledby={`${uid}-h`}>
        <div className="card-head">
          <div>
            <h3 id={`${uid}-h`} className="sm-h3">
              Where the campaign runs
            </h3>
            <p className="card-lead">
              {ids.length} of {atLevel.length} chosen.
            </p>
          </div>
          <label className="lvl-inline">
            Level{' '}
            <select
              value={level}
              onChange={(e) => {
                setLevel(Number(e.target.value));
                setIds([]);
              }}
            >
              {[...new Set(areas.map((x) => x.level))]
                .sort()
                .map((l) => (
                  <option key={l} value={l}>
                    {LEVELS[l]}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <div className="rd-actions">
          <Button variation="link" label="Choose All" onClick={() => setIds(atLevel.map((x) => x.id))} />
          {ids.length > 0 && <Button variation="link" label="Clear" onClick={() => setIds([])} />}
        </div>
        <ul className="ck-list is-cols">
          {atLevel.map((x) => (
            <li key={x.id}>
              <label className="ck-opt">
                <input type="checkbox" checked={ids.includes(x.id)} onChange={() => setIds(toggle(ids, x.id))} />
                {x.name}
                {x.parentId && <span className="ar-meta"> in {parent(x.parentId)}</span>}
              </label>
            </li>
          ))}
        </ul>
      </section>
      <Save
        label="Save Areas"
        disabled={!ids.length}
        note={!ids.length ? 'Choose at least one area.' : undefined}
        onClick={() => {
          update(patchData('hcm', { areaIds: ids, plan: { file: '', rows: 0 } }));
          finishRow('hcm', 'areas', `${ids.length} ${LEVELS[level].toLowerCase()}s`);
        }}
      />
    </>
  );
}

function Strategy() {
  const { account, update, finishRow } = useAccount();
  const uid = useId();
  const saved = account.products.hcm.data.strategy;
  const [s, setS] = useState(saved.mode ? saved : { mode: hcmTemplate(account)?.strategy ?? 'door', rounds: 1 });
  return (
    <>
      <fieldset className="rd-opts">
        <legend className="ux-visually-hidden">How you reach people</legend>
        {STRATEGIES.map((x) => (
          <label key={x.id} className={`rd-opt${s.mode === x.id ? ' is-on' : ''}`}>
            <input type="radio" name={`${uid}-m`} checked={s.mode === x.id} onChange={() => setS({ ...s, mode: x.id })} />
            <span className="rd-text">
              <span className="rd-label">{x.label}</span>
              <span className="rd-hint">{x.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <section className="card form">
        <Field id={`${uid}-r`} label="Rounds" hint="How many times you go back to the same people.">
          <select
            id={`${uid}-r`}
            value={s.rounds}
            aria-describedby={`${uid}-r-hint`}
            onChange={(e) => setS({ ...s, rounds: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      </section>
      <Save
        label="Save Strategy"
        onClick={() => {
          update(patchData('hcm', { strategy: s }));
          finishRow('hcm', 'strategy', `${STRATEGIES.find((x) => x.id === s.mode)!.label}, ${s.rounds} ${s.rounds === 1 ? 'round' : 'rounds'}`);
        }}
      />
    </>
  );
}

function Apk() {
  const { account, update, finishRow } = useAccount();
  const uid = useId();
  const saved = account.products.hcm.data.apk;
  const [appName, setAppName] = useState(saved.appName || `${account.branding.name} Field App`);
  const [mods, setMods] = useState(saved.modules.length ? saved.modules : APK_MODULES.filter((m) => m !== 'Referrals'));
  return (
    <>
      <section className="card form">
        <Field id={`${uid}-n`} label="App name" hint="What field workers see on their phones.">
          <input id={`${uid}-n`} value={appName} aria-describedby={`${uid}-n-hint`} onChange={(e) => setAppName(e.target.value)} />
        </Field>
      </section>
      <Checks legend="What’s in the app" options={APK_MODULES} value={mods} onChange={setMods} />
      <Save
        label="Save App"
        disabled={!appName.trim() || !mods.length}
        onClick={() => {
          update(patchData('hcm', { apk: { appName: appName.trim(), modules: mods } }));
          finishRow('hcm', 'apk', `${appName.trim()}, with ${mods.length} sections`);
        }}
      />
    </>
  );
}

/** The plan is a file per area: upload it, or download one with your areas filled in. */
function Plan() {
  const { account, update, finishRow } = useAccount();
  const uid = useId();
  const d = account.products.hcm.data;
  const chosen = account.geography.areas.filter((x) => d.areaIds.includes(x.id));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const cols = ['area', 'target', 'field workers', 'stock'];

  const read = (f?: File) => {
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) return setMsg({ ok: false, text: 'Choose a CSV file. Excel can save as CSV.' });
    f.text().then((t) => {
      const rows = parseCsv(t);
      const names = new Set(chosen.map((x) => x.name.toLowerCase()));
      const unknown = rows.filter((r) => !names.has((r.area ?? '').toLowerCase()));
      const covered = new Set(rows.map((r) => (r.area ?? '').toLowerCase()));
      const missing = chosen.filter((x) => !covered.has(x.name.toLowerCase()));
      if (unknown.length || missing.length)
        return setMsg({
          ok: false,
          text: [
            unknown.length ? `${unknown.length} rows name an area that isn’t a campaign area (${unknown[0].area}).` : '',
            missing.length ? `${missing.length} campaign areas have no row (${missing[0].name}).` : '',
          ]
            .filter(Boolean)
            .join(' '),
        });
      update(patchData('hcm', { plan: { file: f.name, rows: rows.length } }));
      setMsg({ ok: true, text: `${rows.length} areas planned from ${f.name}.` });
    });
  };

  return (
    <>
      <section className="card" aria-labelledby={`${uid}-h`}>
        <h3 id={`${uid}-h`} className="sm-h3">
          One row for each of your {chosen.length} campaign areas
        </h3>
        <p className="card-lead">Columns: {cols.join(', ')}.</p>
        <div className="ec-bar">
          <label className="ec-btn">
            <input
              type="file"
              accept=".csv,text/csv"
              className="ux-visually-hidden"
              onChange={(e) => {
                read(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <Icon name="CloudUpload" size={20} />
            Upload file
          </label>
          <button
            type="button"
            className="ec-btn"
            onClick={() =>
              download(
                'campaign-plan-sample.csv',
                toCsv(cols, chosen.map((x) => ({ area: x.name, target: '', 'field workers': '', stock: '' }))),
              )
            }
          >
            <Icon name="FileDownload" size={20} />
            Download sample file
          </button>
        </div>
        {msg && (
          <p className={`up-result${msg.ok ? '' : ' has-bad'}`} role={msg.ok ? 'status' : 'alert'}>
            <Icon name={msg.ok ? 'CheckCircle' : 'Info'} size={18} />
            <span>{msg.text}</span>
          </p>
        )}
        {d.plan.file && !msg && (
          <p className="up-result" role="status">
            <Icon name="CheckCircle" size={18} />
            <span>
              {d.plan.rows} areas planned from {d.plan.file}.
            </span>
          </p>
        )}
      </section>
      <Save
        label="Save Plan"
        disabled={!d.plan.file}
        note={!d.plan.file ? 'Upload a plan that covers every campaign area.' : undefined}
        onClick={() => finishRow('hcm', 'plan', `${d.plan.rows} areas planned`)}
      />
    </>
  );
}

function Checklists() {
  const { account, update, finishRow } = useAccount();
  const saved = account.products.hcm.data.checklists;
  const [v, setV] = useState(saved.length ? saved : hcmTemplate(account)?.checklists ?? FIELD_CHECKLISTS.slice(0, 2));
  return (
    <>
      <Checks legend="Checklists field workers fill in" options={FIELD_CHECKLISTS} value={v} onChange={setV} />
      <Save
        label="Save Checklists"
        disabled={!v.length}
        onClick={() => {
          update(patchData('hcm', { checklists: v }));
          finishRow('hcm', 'checklists', `${v.length} checklists`);
        }}
      />
    </>
  );
}

