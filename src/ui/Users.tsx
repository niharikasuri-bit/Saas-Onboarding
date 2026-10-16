import { useId, useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { useAccount } from '../lib/store';
import { newId } from '../lib/model';
import { Field, describedBy } from './StepFrame';
import { EntryChoice, PendingFixes } from './Upload';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Invite users: upload, add manually or download a sample. */
export function UsersBody() {
  const { account } = useAccount();
  return (
    <>
      <EntryChoice kind="users" noun="users" manual={<AddUser />} />
      <PendingFixes kind="users" />
      {account.users.length > 0 && <UserList />}
    </>
  );
}

function AddUser() {
  const { account, update } = useAccount();
  const uid = useId();
  const [f, setF] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [added, setAdded] = useState('');

  const add = () => {
    const e: Record<string, string> = {};
    const email = f.email.trim().toLowerCase();
    if (!f.name.trim()) e.name = 'Enter their name';
    if (!EMAIL.test(email)) e.email = 'Enter a work email, like name@example.gov';
    else if (email === account.admin.email.toLowerCase() || account.users.some((u) => u.email.toLowerCase() === email))
      e.email = 'Someone with this email is already here';
    setErrors(e);
    if (Object.keys(e).length) return;
    update((a) => ({ ...a, users: [...a.users, { id: newId(), name: f.name.trim(), email: f.email.trim() }] }));
    setAdded(f.name.trim());
    setF({ name: '', email: '' });
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
        <Field id={`${uid}-n`} label="Name" error={errors.name}>
          <input
            id={`${uid}-n`}
            value={f.name}
            aria-describedby={describedBy(`${uid}-n`, undefined, errors.name)}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
        </Field>
        <Field id={`${uid}-e`} label="Work email" error={errors.email}>
          <input
            id={`${uid}-e`}
            type="email"
            value={f.email}
            aria-describedby={describedBy(`${uid}-e`, undefined, errors.email)}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </Field>
      </div>
      <div className="form-foot">
        <Button variation="primary" label="Invite" submit onClick={() => {}} />
        {added && (
          <p className="form-note" role="status">
            {added} invited. They’ll get an email.
          </p>
        )}
      </div>
    </form>
  );
}

export function UserList() {
  const { account } = useAccount();
  const uid = useId();
  return (
    <section className="card" aria-labelledby={`${uid}-h`}>
      <h3 id={`${uid}-h`} className="sm-h3">
        Your team
      </h3>
      <p className="card-lead">
        {account.users.length + 1} people, including you.
      </p>
      <table className="tbl">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>{account.admin.name}</strong> (you)
            </td>
            <td>{account.admin.email}</td>
            <td>Admin</td>
          </tr>
          {account.users.slice(0, 50).map((u) => (
            <tr key={u.id}>
              <td>
                <strong>{u.name}</strong>
              </td>
              <td>{u.email}</td>
              <td>Invited</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
