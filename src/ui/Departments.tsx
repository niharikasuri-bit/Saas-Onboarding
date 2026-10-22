import { useId, useState } from 'react';
import { Select } from '../components/Select';
import { Button } from '@egovernments/digit-ui-components';
import { useAccount } from '../lib/store';
import { findName } from '../lib/csv';
import { activeService, newId, typeById, unmappedTypes, type Account } from '../lib/model';
import { Field, describedBy } from './StepFrame';
import { EntryChoice, PendingFixes } from './Upload';
import { SearchTree } from './Tree';

/** Departments: upload, add manually or download a sample; then map complaint types. */
export function DepartmentsBody() {
  const { account } = useAccount();
  const svc = activeService(account);
  const has = account.departments.length > 0;

  return (
    <>
      {svc && (
        <section className="ctx" aria-label="Complaint types in your service">
          <p className="ctx-h">{svc.name} takes these complaint types</p>
          <ul className="chips">
            {svc.types.map((t) => (
              <li key={t} className="chip">
                {typeById(t)?.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      <EntryChoice kind="departments" noun="departments" manual={<AddDept />} />
      <PendingFixes kind="departments" />

      {has && (
        <>
          <section className="card" aria-labelledby="dept-tree-h">
            <h3 id="dept-tree-h" className="sm-h3">
              Your departments
            </h3>
            <p className="card-lead">
              {account.departments.length} departments. Open one to see the teams inside it.
            </p>
            <SearchTree
              label="departments"
              nodes={account.departments}
              meta={(d) => {
                const n = Object.values(account.mapping).filter((x) => x === d.id).length;
                return n ? `${n} complaint type${n === 1 ? '' : 's'}` : '';
              }}
            />
          </section>
          {svc ? (
            <Mapping />
          ) : (
            <p className="tip">Once you choose a template, you’ll map its complaint types to these departments here.</p>
          )}
        </>
      )}
    </>
  );
}

function AddDept() {
  const { account, update } = useAccount();
  const uid = useId();
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const [error, setError] = useState('');
  const [added, setAdded] = useState('');

  const add = () => {
    const n = name.trim();
    if (!n) return setError('Enter the department’s name');
    if (findName(n, account.departments.map((d) => d.name))) return setError(`${n} is already there`);
    update((a) => ({
      ...a,
      departments: [...a.departments, { id: newId(), name: n, parentId: parent || null }],
    }));
    setAdded(n);
    setName('');
    setError('');
  };

  return (
    <form
      className="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        add();
      }}
    >
      <div className="row">
        <Field id={`${uid}-n`} label="Department name" error={error}>
          <input
            id={`${uid}-n`}
            value={name}
            placeholder="e.g. Roads"
            aria-describedby={describedBy(`${uid}-n`, undefined, error)}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
          />
        </Field>
        <Field id={`${uid}-p`} label="Sits under" optional>
          <Select id={`${uid}-p`} value={parent} onChange={(e) => setParent(e.target.value)}>
            <option value="">Nothing, it’s a top department</option>
            <DeptOptions account={account} />
          </Select>
        </Field>
      </div>
      <div className="form-foot">
        <Button variation="primary" label="Add Department" submit onClick={() => {}} />
        {added && (
          <p className="form-note" role="status">
            {added} added.
          </p>
        )}
      </div>
    </form>
  );
}

/** Which department handles each complaint type: a whole group at once, or one by one. */
function Mapping() {
  const { account, update } = useAccount();
  const uid = useId();
  const svc = activeService(account)!;
  const groups = [...new Set(svc.types.map((t) => typeById(t)?.group ?? ''))];
  const left = unmappedTypes(account);
  const [note, setNote] = useState('');

  const setMap = (patch: Record<string, string>) =>
    update((a) => ({ ...a, mapping: { ...a.mapping, ...patch } }));

  return (
    <section className="card" aria-labelledby={`${uid}-h`}>
      <div className="card-head">
        <div>
          <h3 id={`${uid}-h`} className="sm-h3">
            Map complaint types to departments
          </h3>
          <p className="card-lead">
            {left.length
              ? `${left.length} of ${svc.types.length} still need a department.`
              : `All ${svc.types.length} complaint types have a department.`}
          </p>
        </div>
        <span className={`tag ${left.length ? 'is-in-progress' : 'is-completed'}`}>
          {svc.types.length - left.length}/{svc.types.length}
        </span>
      </div>
      <p className="ux-visually-hidden" role="status">
        {note}
      </p>

      {groups.map((g) => {
        const types = svc.types.filter((t) => typeById(t)?.group === g);
        return (
          <fieldset key={g} className="map-group">
            <legend>{g}</legend>
            <label className="map-rule">
              <span>Send all {g.toLowerCase()} complaints to</span>
              <Select
                value=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  setMap(Object.fromEntries(types.map((t) => [t, e.target.value])));
                  setNote(`All ${g.toLowerCase()} complaints now go to ${deptName(account, e.target.value)}.`);
                }}
              >
                <option value="">Choose a department</option>
                <DeptOptions account={account} />
              </Select>
            </label>
            <ul className="map-list">
              {types.map((t) => (
                <li key={t}>
                  <label htmlFor={`${uid}-${t}`}>{typeById(t)?.label}</label>
                  <Select
                    id={`${uid}-${t}`}
                    value={account.mapping[t] ?? ''}
                    className={account.mapping[t] ? undefined : 'is-empty'}
                    onChange={(e) => setMap({ [t]: e.target.value })}
                  >
                    <option value="">No department yet</option>
                    <DeptOptions account={account} />
                  </Select>
                </li>
              ))}
            </ul>
          </fieldset>
        );
      })}
    </section>
  );
}

const deptName = (a: Account, id: string) => a.departments.find((d) => d.id === id)?.name ?? '';

/** Departments indented under their parents. */
function DeptOptions({ account }: { account: Account }) {
  const out: { id: string; label: string }[] = [];
  const walk = (pid: string | null, depth: number) => {
    for (const d of account.departments.filter((x) => x.parentId === pid)) {
      out.push({ id: d.id, label: `${'  '.repeat(depth)}${d.name}` });
      walk(d.id, depth + 1);
    }
  };
  walk(null, 0);
  for (const d of account.departments) if (!out.some((o) => o.id === d.id)) out.push({ id: d.id, label: d.name });
  return (
    <>
      {out.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </>
  );
}
