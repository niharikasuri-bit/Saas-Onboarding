import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { PRODUCTS, PRODUCT_ORDER, ROLES, hasGeography, newId, todoDone, todosFor, type Product, type TodoId } from '../lib/model';
import { firstName } from '../setup/steps';
import { Geographies } from './Geographies';
import { Channels } from './Channels';
import { HealthStack } from './Integrations';
import { usePageToast } from './PageToast';

/**
 * Home, laid out like an admin portal's landing page:
 * 1. A greeting banner.
 * 2. Your task: the next account step, with why it matters and its button (or, once all done, the account at a glance).
 * 3. Your products: one tinted card each, with three numbers, an illustration and Open.
 * 4. Side by side: the health systems DIGIT plugs into, and inviting the team.
 * 5. Explore other products not in the account yet.
 * Until geographies are in, only the banner and the task show: the products need them.
 */

/** Prototype values: each product's three numbers, its tint and its illustration. */
const CARD: Record<Product, { stats: [string, string][]; tint: string; art: Art; tag: string }> = {
  cms: { stats: [['6', 'Complaint types'], ['5', 'Modules'], ['14', 'Features']], tint: '#E8F1F8', art: 'chat', tag: 'Citizen services' },
  hcm: { stats: [['4+', 'Campaign templates'], ['8', 'Modules'], ['12', 'Features']], tint: '#E7F4EC', art: 'health', tag: 'Health' },
  lnp: { stats: [['3', 'Licence templates'], ['6', 'Modules'], ['10', 'Features']], tint: '#FDF0E7', art: 'doc', tag: 'Revenue' },
};

const TASK: Record<TodoId, { title: string; needs: string[]; why: string; minutes: number; icon: string; action: string }> = {
  geography: {
    title: 'Add your geographies',
    needs: ['Your country', 'Its levels', 'The places in it'],
    why: 'Every product uses your geographies to know where things happen, so work reaches the right place. Your products unlock once they’re in.',
    minutes: 5,
    icon: 'Public',
    action: 'Add geographies',
  },
  sender: {
    title: 'Set up notification channels',
    needs: ['SMS', 'Email', 'Sender details'],
    why: 'Updates go out in your organisation’s name, so your products need your services and sender details before they go live.',
    minutes: 5,
    icon: 'Email',
    action: 'Add notification channels',
  },
  users: {
    title: 'Invite your team',
    needs: ['Work emails', 'Roles'],
    why: 'Once your team is in, you can give each person a role and assign them work.',
    minutes: 2,
    icon: 'Group',
    action: 'Add team members',
  },
};

export function Home() {
  const { account, answers, openProduct, go } = useAccount();
  const uid = useId();
  const [toastEl, showToast] = usePageToast();
  const admin = account.ui.viewAs === 'admin';
  const on = PRODUCT_ORDER.filter((p) => account.products[p].enabled);
  const off = PRODUCT_ORDER.filter((p) => !account.products[p].enabled);
  const todos = todosFor(account);
  const open = todos.filter((t) => !todoDone(t.id, account));
  const task = open[0];
  const started = hasGeography(account);
  // A setup step opens here, in place of the page
  const [flow, setFlow] = useState<TodoId | null>(null);
  const [why, setWhy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const wasFlow = useRef(false);
  useEffect(() => {
    if (wasFlow.current && !flow) heading.current?.focus();
    wasFlow.current = !!flow;
  }, [flow]);

  const back = (message?: string) => {
    setFlow(null);
    if (message) showToast(message);
  };
  if (flow === 'geography') return <Geographies embedded onDone={back} />;
  if (flow === 'sender') return <Channels embedded onDone={back} />;

  const org = answers.org.trim() || 'your organisation';
  const geoCount = (account.geography.sets?.length ?? 0) + (account.geography.custom?.length ?? 0);
  const channels = Object.values(account.sender).filter((s) => s.state !== 'none').length;

  return (
    <div className="lp">
      {toastEl}
      <section className="lp-hero" aria-labelledby={`${uid}-h`}>
        <h1 id={`${uid}-h`} ref={heading} tabIndex={-1}>
          Hi {firstName(answers)}{' '}
          <span className="lp-wave" aria-hidden="true">
            👋
          </span>
        </h1>
        <p>
          {task
            ? `Finish your task below and your products are ready for ${org}.`
            : `Your one stop to access your products for ${org}, manage your account and its settings.`}
        </p>
      </section>

      {task ? (
        <section className="lp-task" aria-labelledby={`${uid}-t`}>
          <span className="lp-task-icon" aria-hidden="true">
            <Icon name={TASK[task.id].icon} size={24} />
          </span>
          <div className="lp-task-text">
            <p className="lp-task-meta">
              <span className="lp-eyebrow">Your task</span>
              <span className="lp-pill">Pending</span>
              <span>
                Step {todos.length - open.length + 1} of {todos.length}
              </span>
              <span aria-hidden="true">·</span>
              <span>About {TASK[task.id].minutes} min</span>
            </p>
            <h2 id={`${uid}-t`}>{TASK[task.id].title}</h2>
            <ul className="lp-needs" aria-label="You’ll need">
              {TASK[task.id].needs.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <div className="lp-task-acts">
            <button type="button" className="lp-link" onClick={() => setWhy(true)}>
              Why complete this
            </button>
            <Button variation="primary" label={TASK[task.id].action} icon="ArrowForward" isSuffix onClick={() => (task.id === 'users' ? go('team') : setFlow(task.id))} />
          </div>
          {why && <WhyDialog title={TASK[task.id].title} text={TASK[task.id].why} onClose={() => setWhy(false)} />}
        </section>
      ) : (
        <section className="lp-glance" aria-label="Your account at a glance">
          <dl>
            {(
              [
                [on.length, on.length === 1 ? 'Product' : 'Products', 'Apps'],
                [geoCount, geoCount === 1 ? 'Geography' : 'Geographies', 'Public'],
                [account.users.length, account.users.length === 1 ? 'Team member' : 'Team members', 'Group'],
                [channels, channels === 1 ? 'Notification channel' : 'Notification channels', 'Email'],
              ] as const
            ).map(([n, label, icon]) => (
              <div key={label}>
                <span className="lp-glance-icon" aria-hidden="true">
                  <Icon name={icon} size={20} />
                </span>
                <dt>{label}</dt>
                <dd>{n}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {started && (
        <>
          <section className="lp-sec" aria-labelledby={`${uid}-p`}>
            <div className="lp-sec-head">
              <h2 id={`${uid}-p`}>Your products</h2>
              <p>Everything included in your account</p>
            </div>
            <ul className="lp-products">
              {on.map((p) => (
                <li key={p} className="lp-product" style={{ background: CARD[p].tint }}>
                  <h3>{PRODUCTS[p].name}</h3>
                  <p className="lp-about">{PRODUCTS[p].about}</p>
                  <dl className="lp-stats">
                    {CARD[p].stats.map(([n, label]) => (
                      <div key={label}>
                        <dd>{n}</dd>
                        <dt>{label}</dt>
                      </div>
                    ))}
                  </dl>
                  <div className="lp-art" aria-hidden="true">
                    <Illustration art={CARD[p].art} />
                  </div>
                  <div className="lp-product-foot">
                    <Button variation="primary" label={`Open ${PRODUCTS[p].name}`} icon="ArrowForward" isSuffix onClick={() => openProduct(p)} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="lp-split">
            <section className="lp-panel" aria-labelledby={`${uid}-i`}>
              <div className="lp-panel-head">
                <div>
                  <h2 id={`${uid}-i`}>Built to Plug into Your Health Stack</h2>
                  <p>Seamless integration with existing health information systems and infrastructure</p>
                </div>
              </div>
              <HealthStack tiles />
            </section>
            <InvitePanel onSent={showToast} />
          </div>

          {off.length > 0 && (
            <section className="lp-panel lp-explore" aria-labelledby={`${uid}-x`}>
              <div className="lp-panel-head">
                <div>
                  <h2 id={`${uid}-x`}>Explore other products</h2>
                  <p>More DIGIT products you can add to your account</p>
                </div>
              </div>
              <ul className="lp-explore-grid">
                {off.map((p) => (
                  <ExploreCard key={p} p={p} admin={admin} onAdded={() => showToast(`${PRODUCTS[p].name} added to your account`)} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/** "Why complete this": a short popup with what the step is for. */
function WhyDialog({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const close = () => {
    ref.current?.close();
    onClose();
  };
  return createPortal(
    <dialog
      ref={ref}
      className="ag lp-why"
      aria-labelledby={`${uid}-h`}
      aria-describedby={`${uid}-d`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <span className="lp-why-icon" aria-hidden="true">
        <Icon name="Info" size={24} />
      </span>
      <h2 id={`${uid}-h`}>Why complete this</h2>
      <p className="lp-why-step">{title}</p>
      <p id={`${uid}-d`}>{text}</p>
      <Button variation="primary" label="Got it" onClick={close} />
    </dialog>,
    document.body,
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const initials = (s: string) =>
  s
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
/** A name from an email until they set their own: amina.wanjiru@… → Amina Wanjiru */
const nameFrom = (email: string) =>
  email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(' ');

/** Invite your team: type or paste emails (Enter or comma after each), pick a role, send. */
function InvitePanel({ onSent }: { onSent: (m: string) => void }) {
  const { account, update, go } = useAccount();
  const uid = useId();
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [role, setRole] = useState('Staff');
  const [error, setError] = useState('');
  const taken = new Set(account.users.map((u) => u.email.toLowerCase()));
  const on = PRODUCT_ORDER.filter((p) => account.products[p].enabled);

  // Takes whatever's typed or pasted: emails become chips; anything else stays in the box with an error
  const take = (text: string) => {
    const parts = text.split(/[\s,;]+/).filter(Boolean);
    const bad = parts.filter((x) => !EMAIL.test(x));
    const dupe = parts.find((x) => EMAIL.test(x) && taken.has(x.toLowerCase()));
    const good = [...new Set(parts.filter((x) => EMAIL.test(x) && !taken.has(x.toLowerCase())).map((x) => x.toLowerCase()))].filter((x) => !emails.includes(x));
    const next = [...emails, ...good];
    setEmails(next);
    setDraft(bad.join(', '));
    setError(bad.length ? 'Enter a work email, like name@example.gov' : dupe ? `${dupe} is already in your team` : '');
    return { next, ok: !bad.length };
  };
  const send = () => {
    const { next, ok } = draft.trim() ? take(draft) : { next: emails, ok: true };
    if (!ok) return document.getElementById(`${uid}-e`)?.focus();
    if (!next.length) {
      setError('Add at least one work email');
      return document.getElementById(`${uid}-e`)?.focus();
    }
    update((a) => ({ ...a, users: [...a.users, ...next.map((email) => ({ id: newId(), name: nameFrom(email), email, role, products: on }))] }));
    setEmails([]);
    setError('');
    onSent(`${next.length} ${next.length === 1 ? 'invite' : 'invites'} sent`);
  };
  const team = [...account.users].reverse().slice(0, 4);

  return (
    <section className="lp-panel" aria-labelledby={`${uid}-h`}>
      <div className="lp-panel-head">
        <div>
          <h2 id={`${uid}-h`}>Invite your team</h2>
          <p>Add one or more emails and they’ll get an invite to join</p>
        </div>
      </div>
      <form
        className="lp-invite"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor={`${uid}-e`} className="lp-label">
          Work emails
        </label>
        <div className={`lp-chips${error ? ' has-error' : ''}`} onClick={() => document.getElementById(`${uid}-e`)?.focus()}>
          {emails.length > 0 && (
            <ul aria-label="Emails to invite">
              {emails.map((m) => (
                <li key={m}>
                  {m}
                  <button type="button" aria-label={`Remove ${m}`} onClick={() => setEmails((x) => x.filter((y) => y !== m))}>
                    <Icon name="Close" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            id={`${uid}-e`}
            type="text"
            inputMode="email"
            autoComplete="off"
            value={draft}
            placeholder={emails.length ? '' : 'Type or paste emails'}
            aria-invalid={!!error || undefined}
            aria-describedby={`${uid}-hint${error ? ` ${uid}-err` : ''}`}
            onChange={(e) => {
              const v = e.target.value;
              if (/[,;\s]$/.test(v) || /[,;\s].*\S/.test(v)) take(v);
              else setDraft(v);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) {
                e.preventDefault();
                take(draft);
              }
              if (e.key === 'Backspace' && !draft && emails.length) setEmails((x) => x.slice(0, -1));
            }}
            onBlur={() => draft.trim() && take(draft)}
          />
        </div>
        {error && (
          <p className="fld-error" id={`${uid}-err`}>
            <span className="ux-visually-hidden">Error: </span>
            {error}
          </p>
        )}
        <p className="lp-hint" id={`${uid}-hint`}>
          Press Enter or comma after each email. Paste a list to add many at once.
        </p>
        <div className="lp-invite-row">
          <div className="lp-fld">
            <label htmlFor={`${uid}-r`} className="lp-label">
              Role
            </label>
            <select id={`${uid}-r`} value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <Button variation="primary" label={emails.length > 1 ? 'Send invites' : 'Send invite'} submit onClick={() => {}} />
        </div>
      </form>

      <div className="lp-team-head">
        <h3>
          Your team <span className="geo-section-n">{account.users.length}</span>
        </h3>
        {account.users.length > 0 && (
          <button type="button" className="lp-link" onClick={() => go('team')}>
            View all
          </button>
        )}
      </div>
      {team.length ? (
        <ul className="lp-team">
          {team.map((u) => (
            <li key={u.id}>
              <span className="lp-avatar" aria-hidden="true">
                {initials(u.name || u.email)}
              </span>
              <span className="lp-person">
                <strong>{u.name || u.email}</strong>
                <span>{u.email}</span>
              </span>
              <span className="geo-tag">{u.role ?? 'Staff'}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="lp-empty">No one invited yet. Invites you send show here.</p>
      )}
    </section>
  );
}

/** A product not in the account yet: illustration on a tint, its tag, about, and Add to account. */
function ExploreCard({ p, admin, onAdded }: { p: Product; admin: boolean; onAdded: () => void }) {
  const { update } = useAccount();
  const meta = PRODUCTS[p];
  return (
    <li className="lp-ex">
      <div className="lp-ex-art" style={{ background: CARD[p].tint }} aria-hidden="true">
        <span className="lp-ex-tag">{CARD[p].tag}</span>
        <Illustration art={CARD[p].art} />
      </div>
      <div className="lp-ex-body">
        <h3>{meta.name}</h3>
        <p>{meta.about}</p>
        <p className="lp-ex-meta">
          {CARD[p].stats
            .slice(1)
            .map(([n, l]) => `${n} ${l.toLowerCase()}`)
            .join(' · ')}
        </p>
        <div className="lp-ex-foot">
          {admin ? (
            <Button
              variation="secondary"
              icon="Add"
              label="Add to account"
              title={`Add ${meta.name} to account`}
              onClick={() => {
                update((a) => ({ ...a, products: { ...a.products, [p]: { ...a.products[p], enabled: true } } }));
                onAdded();
              }}
            />
          ) : (
            <p className="lp-empty">Ask an admin to add it.</p>
          )}
        </div>
      </div>
    </li>
  );
}

type Art = 'chat' | 'health' | 'doc';
/** Flat illustrations in the DIGIT colours, decorative. */
function Illustration({ art }: { art: Art }) {
  if (art === 'chat')
    return (
      <svg viewBox="0 0 200 120" width="200" height="120">
        <ellipse cx="100" cy="110" rx="70" ry="6" fill="#0B4B66" opacity="0.08" />
        <rect x="40" y="18" width="96" height="62" rx="12" fill="#fff" stroke="#0B4B66" strokeWidth="3" />
        <path d="M60 80 l-6 18 22-18" fill="#fff" stroke="#0B4B66" strokeWidth="3" strokeLinejoin="round" />
        <rect x="56" y="34" width="64" height="7" rx="3.5" fill="#0B4B66" opacity="0.8" />
        <rect x="56" y="49" width="44" height="7" rx="3.5" fill="#0B4B66" opacity="0.35" />
        <rect x="112" y="46" width="56" height="40" rx="10" fill="#C84C0E" />
        <path d="M150 86 l10 14 -2-14z" fill="#C84C0E" />
        <path d="M128 66 l8 8 16-16" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (art === 'health')
    return (
      <svg viewBox="0 0 200 120" width="200" height="120">
        <ellipse cx="100" cy="110" rx="70" ry="6" fill="#0B4B66" opacity="0.08" />
        <path d="M30 100 V60 l40-26 40 26 v40z" fill="#fff" stroke="#0B4B66" strokeWidth="3" strokeLinejoin="round" />
        <rect x="60" y="74" width="20" height="26" rx="2" fill="#0B4B66" opacity="0.8" />
        <circle cx="140" cy="54" r="30" fill="#00703C" />
        <rect x="134" y="38" width="12" height="32" rx="2" fill="#fff" />
        <rect x="124" y="48" width="32" height="12" rx="2" fill="#fff" />
        <path d="M120 96 c10-14 30-14 40 0" fill="none" stroke="#C84C0E" strokeWidth="4" strokeLinecap="round" />
        <circle cx="140" cy="100" r="5" fill="#C84C0E" />
      </svg>
    );
  return (
    <svg viewBox="0 0 200 120" width="200" height="120">
      <ellipse cx="100" cy="110" rx="70" ry="6" fill="#0B4B66" opacity="0.08" />
      <rect x="62" y="12" width="76" height="94" rx="8" fill="#fff" stroke="#0B4B66" strokeWidth="3" />
      <rect x="76" y="30" width="48" height="7" rx="3.5" fill="#0B4B66" opacity="0.8" />
      <rect x="76" y="46" width="36" height="6" rx="3" fill="#0B4B66" opacity="0.35" />
      <rect x="76" y="60" width="42" height="6" rx="3" fill="#0B4B66" opacity="0.35" />
      <circle cx="132" cy="86" r="22" fill="#C84C0E" />
      <circle cx="132" cy="86" r="14" fill="none" stroke="#fff" strokeWidth="3" />
      <path d="M126 86 l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
