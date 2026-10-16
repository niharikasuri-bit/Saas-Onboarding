import { useId, useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { CHANNELS, type Channel } from '../lib/model';
import { Field, describedBy } from './StepFrame';

/**
 * Sender details: who messages come from. Approvals take days, so this is
 * worth submitting early. Going live needs “submitted”, not “approved”.
 */
export function SenderBody() {
  return (
    <>
      <p className="tip">
        <Icon name="Schedule" size={18} />
        You don’t need to wait for approval to go live. Messages start the day it comes through.
      </p>
      <ul className="channels">
        {CHANNELS.map((c) => (
          <ChannelCard key={c.id} id={c.id} />
        ))}
      </ul>
    </>
  );
}

function ChannelCard({ id }: { id: Channel }) {
  const { account, update } = useAccount();
  const uid = useId();
  const spec = CHANNELS.find((c) => c.id === id)!;
  const ch = account.sender[id];
  const [fields, setFields] = useState<Record<string, string>>(ch.fields);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  const submit = () => {
    const e: Record<string, string> = {};
    for (const f of spec.fields) if (!(fields[f.key] ?? '').trim()) e[f.key] = `Enter the ${f.label.toLowerCase()}`;
    setErrors(e);
    if (Object.keys(e).length) return;
    update((a) => ({ ...a, sender: { ...a.sender, [id]: { state: 'submitted', fields } } }));
    setOpen(false);
  };

  return (
    <li className="channel is-on">
      <div className="channel-head">
        <span className="channel-name" id={`${uid}-n`}>
          {spec.label}
        </span>
        <span className={`tag ${ch.state === 'none' ? 'is-not-started' : ch.state === 'submitted' ? 'is-waiting' : 'is-completed'}`}>
          {ch.state === 'none' ? 'Not submitted' : ch.state === 'submitted' ? 'Submitted, awaiting approval' : 'Approved'}
        </span>
      </div>
      <p className="channel-note">{spec.note}</p>
      {ch.state === 'none' && !open && (
        <Button variation="secondary" label={`Fill In ${spec.label}`} onClick={() => setOpen(true)} />
      )}
      {open && (
        <form
          className="channel-body"
          noValidate
          aria-labelledby={`${uid}-n`}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {spec.fields.map((f) => (
            <Field key={f.key} id={`${uid}-${f.key}`} label={f.label} hint={f.hint} error={errors[f.key]}>
              <input
                id={`${uid}-${f.key}`}
                value={fields[f.key] ?? ''}
                aria-describedby={describedBy(`${uid}-${f.key}`, f.hint, errors[f.key])}
                onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
              />
            </Field>
          ))}
          <div className="form-foot">
            <Button variation="primary" label="Submit for Approval" submit onClick={() => {}} />
            <Button variation="link" label="Cancel" onClick={() => setOpen(false)} />
          </div>
        </form>
      )}
      {ch.state === 'submitted' && (
        <p className="channel-sub">
          Submitted {Object.values(ch.fields).filter(Boolean)[0]}. We’ll email you when it’s approved.
        </p>
      )}
    </li>
  );
}
