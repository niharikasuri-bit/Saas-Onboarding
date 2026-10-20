import { useEffect, useId, useRef, useState } from 'react';
import { Button, Toast } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { CHANNELS, type Channel } from '../lib/model';
import { Field, describedBy } from './StepFrame';
import { Crumbs } from './Crumbs';

/**
 * Notification channels, set up the same way as geographies: pick the
 * channels (any of the three), then add the sender details for each on one
 * page, then connect them. Once one is connected the page lists each channel
 * and its state, with "Set up channels" for the rest.
 */

const ICON: Record<Channel, string> = { sms: 'Message', email: 'Email', whatsapp: 'WhatsAppFilled' };
const TILE: Record<Channel, string> = { sms: 'SMS', email: 'Email', whatsapp: 'WhatsApp' };

function check(id: Channel, key: string, v: string): string {
  const t = v.trim();
  if (!t) return '';
  if (id === 'email' && key === 'from' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Enter an email address, for example complaints@county.go.ke';
  if (id === 'sms' && key === 'senderId' && !/^[A-Za-z0-9]{1,11}$/.test(t)) return 'Use up to 11 letters or numbers, with no spaces';
  if (id === 'whatsapp' && key === 'number' && !/^\+?[0-9 ]{8,16}$/.test(t)) return 'Enter the number with its country code, for example +254 700 000000';
  if (id === 'whatsapp' && key === 'accountId' && !/^[0-9]+$/.test(t)) return 'Use numbers only';
  return '';
}

export function Channels({ embedded, onDone }: { embedded?: boolean; onDone?: (message?: string) => void } = {}) {
  const { account, update, go } = useAccount();
  const setUp = CHANNELS.filter((c) => account.sender[c.id].state !== 'none');
  const left = CHANNELS.filter((c) => account.sender[c.id].state === 'none');
  const [chosen, setChosen] = useState(!setUp.length);
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState<Channel | null>(null);
  const setting = embedded || (chosen && left.length > 0) || !setUp.length;
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) first.current = false;
    else if (!setting && !editing) heading.current?.focus();
  }, [setting, editing]);
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

  if (editing && !embedded) {
    const spec = CHANNELS.find((c) => c.id === editing)!;
    return (
      <div className="geo is-creating">
        <ChannelFlow
          trail={[home, { label: 'Notification channels', onClick: () => setEditing(null) }]}
          channels={[spec]}
          edit={account.sender[editing].fields}
          onCancel={() => setEditing(null)}
          onSubmitted={() => {
            setEditing(null);
            setToast(`${spec.label} details saved`);
          }}
          onDeactivate={() => {
            update((a) => ({ ...a, sender: { ...a.sender, [spec.id]: { ...a.sender[spec.id], state: 'none' } } }));
            setEditing(null);
            setToast(`${spec.label} deactivated`);
          }}
        />
        {toastEl}
      </div>
    );
  }

  if (setting)
    return (
      <div className="geo is-creating">
        <ChannelFlow
          trail={[home, ...(!embedded && setUp.length ? [{ label: 'Notification channels', onClick: () => setChosen(false) }] : [])]}
          channels={left}
          onCancel={embedded ? () => onDone?.() : setUp.length ? () => setChosen(false) : () => go('home')}
          onSubmitted={(n) => {
            const m = `${n === 1 ? 'Channel' : `${n} channels`} connected`;
            if (embedded) return onDone?.(m);
            setChosen(false);
            setToast(m);
          }}
        />
        {toastEl}
      </div>
    );

  return (
    <div className="geo is-overview">
      <header className="geo-head geo-band">
        <div className="geo-band-text">
          <h1 ref={heading} tabIndex={-1}>
            Notification channels
          </h1>
          <p className="geo-lead">
            A notification channel is the sender your messages come from, such as an email address or phone number. Each
            channel needs approval, which can take a few days, so submit early. You can turn on messages once a channel is
            submitted.
          </p>
        </div>
        {left.length > 0 && <Button variation="primary" icon="Add" label={left.length === 1 ? 'Add notification channel' : 'Add notification channels'} onClick={() => setChosen(true)} />}
      </header>
      <div className="geo-bar">
        <h2 className="geo-section-h">
          Your channels <span className="geo-section-n">{setUp.length}</span>
        </h2>
      </div>
      <ul className="geo-cards">
        {/* Connected first, then the ones not set up yet */}
        {[...setUp, ...left].map((c) => {
          const st = account.sender[c.id];
          return (
            <li key={c.id} className={`geo-card${st.state === 'none' ? ' is-off' : ''}`}>
              <div className="geo-card-top">
                <span className="geo-icon" aria-hidden="true">
                  <Icon name={ICON[c.id]} size={20} />
                </span>
                <span className={`geo-status${st.state !== 'none' ? ' is-active' : ''}`}>
                  {st.state === 'none' ? 'Not connected' : 'Connected'}
                </span>
              </div>
              <h3 className="geo-card-h">{c.label}</h3>
              <p className="ch-note">{c.note}</p>
              {st.state !== 'none' && (
                <dl className="ch-fields">
                  {c.fields.map((f) => (
                    <div key={f.key}>
                      <dt>{f.label}</dt>
                      <dd>{f.secret ? '••••••••' : st.fields[f.key] || '—'}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {st.state !== 'none' && (
                <div className="geo-actions is-edit">
                  <Button
                    variation="secondary"
                    icon="Edit"
                    label="Edit channel details"
                    title={`Edit ${c.label} details`}
                    onClick={() => setEditing(c.id)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {toastEl}
    </div>
  );
}

function ChannelFlow({
  trail,
  channels,
  onCancel,
  onSubmitted,
  edit,
  onDeactivate,
}: {
  trail: { label: string; onClick?: () => void }[];
  channels: typeof CHANNELS;
  onCancel: () => void;
  onSubmitted: (n: number) => void;
  /** Editing one connected channel: start at its details, with what it has. */
  edit?: Record<string, string>;
  onDeactivate?: () => void;
}) {
  const { account: acct, update } = useAccount();
  const saved = Object.fromEntries(Object.entries(acct.sender).map(([k, v]) => [k, v.fields])) as Record<string, Record<string, string>>;
  const uid = useId();
  const [picked, setPicked] = useState<Channel[]>(edit ? channels.map((c) => c.id) : []);
  const [step, setStep] = useState(edit ? 1 : 0); // 0 = pick the channels, 1 = add sender details
  // Prototype: filled in with the example details, so the flow can be clicked straight through.
  const [values, setValues] = useState<Record<string, Record<string, string>>>(() =>
    edit ? { [channels[0].id]: { ...edit } } : Object.fromEntries(
      channels.map((c) => [
        c.id,
        Object.keys(saved?.[c.id] ?? {}).length
          ? { ...saved![c.id] }
          : Object.fromEntries(c.fields.map((f) => [f.key, f.options ? f.options[0] : f.secret ? 'example-secret' : f.placeholder ?? ''])),
      ]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  const order = channels.filter((c) => picked.includes(c.id));
  const last = step === 1;

  const back = () => {
    setErrors({});
    if (step === 0 || edit) onCancel();
    else setStep(step - 1);
  };
  const next = () => {
    const e: Record<string, string> = {};
    if (step === 0 && !picked.length) e.pick = 'Choose at least one channel';
    if (step === 1)
      for (const c of order)
        for (const f of c.fields) {
          const v = values[c.id]?.[f.key] ?? '';
          const k = `${c.id}-${f.key}`;
          if (!v.trim()) e[k] = f.options ? `Choose the ${f.label.toLowerCase()}` : `Enter the ${f.label.toLowerCase()}`;
          else if (check(c.id, f.key, v)) e[k] = check(c.id, f.key, v);
        }
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`${uid}-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    if (last) {
      update((a) => {
        const sender = { ...a.sender };
        for (const c of order) sender[c.id] = { state: 'submitted', fields: values[c.id] ?? {} };
        return { ...a, sender };
      });
      onSubmitted(order.length);
      return;
    }
    setStep(step + 1);
  };

  return (
    <div className="cg-page">
      <Crumbs items={[...trail, { label: edit ? `Edit ${channels[0].label}` : channels.length === 1 ? 'Add notification channel' : 'Add notification channels' }]} />
      <section className="cg" aria-labelledby={`${uid}-h`}>
        <h1 id={`${uid}-h`} ref={heading} tabIndex={-1}>
          {edit ? `Edit ${channels[0].label} details` : step === 1 ? 'Add sender details' : 'Which channels do you want to set up?'}
        </h1>
        <div className="cg-sub">
          <p>
            {step === 0
              ? 'Choose one or more. You can set up the others later.'
              : 'Messages go out from your own accounts. Add the details for each channel you chose, and check them before you connect.'}
          </p>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          {step === 0 && (
            <fieldset className={`qz-tiles cg-tiles ch-tiles${errors.pick ? ' has-error' : ''}`} aria-describedby={errors.pick ? `${uid}-pick-error` : undefined}>
              <legend className="ux-visually-hidden">Which channels do you want to set up?</legend>
              {errors.pick && (
                <p id={`${uid}-pick-error`} className="fld-error">
                  <span className="ux-visually-hidden">Error: </span>
                  {errors.pick}
                </p>
              )}
              <div className="qz-tile-row">
                {channels.map((c, i) => {
                  const on = picked.includes(c.id);
                  return (
                    <label key={c.id} className={`qz-tile${on ? ' is-on' : ''}`}>
                      <input
                        type="checkbox"
                        id={i === 0 ? `${uid}-pick` : undefined}
                        checked={on}
                        onChange={() => {
                          setPicked(on ? picked.filter((x) => x !== c.id) : [...picked, c.id]);
                          setErrors({});
                        }}
                      />
                      <span className="cg-tile-icon" aria-hidden="true">
                        <Icon name={ICON[c.id]} size={28} />
                      </span>
                      <span className="qz-tile-label">{TILE[c.id]}</span>
                      {on && (
                        <span className="qz-tile-tick" aria-hidden="true">
                          <Icon name="Check" size={12} />
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}
          {step === 1 && (
            <div className="ch-form">
              {order.map((c) => (
                <section key={c.id} className="ch-sec" aria-labelledby={`${uid}-${c.id}-h`}>
                  <div className="ch-sec-head">
                    <span className="geo-icon" aria-hidden="true">
                      <Icon name={ICON[c.id]} size={20} />
                    </span>
                    <div className="ch-sec-title">
                      <h2 id={`${uid}-${c.id}-h`}>{c.label}</h2>
                    </div>
                    <span className={`geo-status${edit ? ' is-active' : ''}`}>{edit ? 'Connected' : 'Not connected'}</span>
                  </div>
                  <p className="ch-why">
                    <Icon name="Info" size={18} />
                    {c.why}
                  </p>
                  <div className="ch-fields-form">
                    {c.fields.map((f) => {
                      const k = `${c.id}-${f.key}`;
                      const v = values[c.id]?.[f.key] ?? '';
                      const set = (x: string) => setValues({ ...values, [c.id]: { ...values[c.id], [f.key]: x } });
                      return (
                        <div key={k} className="cg-split">
                          <Field id={`${uid}-${k}`} label={f.label} hint={f.hint} error={errors[k]}>
                            {f.options ? (
                              <select
                                id={`${uid}-${k}`}
                                value={v}
                                aria-invalid={!!errors[k] || undefined}
                                aria-describedby={describedBy(`${uid}-${k}`, f.hint, errors[k])}
                                onChange={(e) => set(e.target.value)}
                              >
                                <option value="">Choose</option>
                                {f.options.map((o) => (
                                  <option key={o}>{o}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                id={`${uid}-${k}`}
                                value={v}
                                placeholder={f.secret ? '••••••••' : f.placeholder}
                                type={f.secret ? 'password' : f.key === 'from' ? 'email' : f.key === 'number' ? 'tel' : 'text'}
                                autoComplete={f.secret ? 'new-password' : 'off'}
                                aria-invalid={!!errors[k] || undefined}
                                aria-describedby={describedBy(`${uid}-${k}`, f.hint, errors[k])}
                                onChange={(e) => set(e.target.value)}
                              />
                            )}
                          </Field>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
          <button type="submit" className="ux-visually-hidden" tabIndex={-1} aria-hidden="true" />
        </form>
      </section>
      <footer className="cg-bar">
        <Button variation="secondary" icon="ArrowBack" label="Back" onClick={back} />
        <div className="cg-bar-end">
        {edit && onDeactivate && (
          <Button
            variation="secondary"
            icon="Close"
            label="Deactivate channel"
            onClick={() => window.confirm(`Deactivate ${channels[0].label}? Messages stop going out on it until you add it again.`) && onDeactivate()}
          />
        )}
        <Button
          variation="primary"
          label={edit ? 'Save changes' : last ? (order.length === 1 ? 'Connect channel to account' : 'Connect channels to account') : 'Next'}
          icon={last ? undefined : 'ArrowForward'}
          isSuffix
          onClick={next}
        />
        </div>
      </footer>
    </div>
  );
}
