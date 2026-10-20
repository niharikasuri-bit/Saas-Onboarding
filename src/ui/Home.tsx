import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { PRODUCTS, PRODUCT_ORDER, ROLES, hasGeography, newId, todoDone, todosFor, type Product, type TodoId } from '../lib/model';
import { Geographies } from './Geographies';
import { Channels } from './Channels';
import { HealthStack } from './Integrations';
import { usePageToast } from './PageToast';
import { HomeHeader } from './AccountSetup';
import cmsArt from '../assets/undraw/cms.svg?raw';
import hcmArt from '../assets/undraw/hcm.svg?raw';
import lnpArt from '../assets/undraw/lnp.svg?raw';

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

const TASK: Record<TodoId, { title: string; needs: string; why: string; minutes: number; icon: string; action: string }> = {
  geography: {
    title: 'Add your geographies',
    needs: 'your country, its levels and the places in it',
    why: 'Every product uses your geographies to know where things happen, so work reaches the right place. Your products unlock once they’re in.',
    minutes: 5,
    icon: 'Public',
    action: 'Add geographies',
  },
  sender: {
    title: 'Set up notification channels',
    needs: 'SMS, email and sender details',
    why: 'Updates go out in your organisation’s name, so your products need your services and sender details before they go live.',
    minutes: 5,
    icon: 'Email',
    action: 'Add notification channels',
  },
  users: {
    title: 'Invite your team',
    needs: 'work emails and roles',
    why: 'Once your team is in, you can give each person a role and assign them work.',
    minutes: 2,
    icon: 'Group',
    action: 'Add team members',
  },
};

export function Home() {
  const { account, openProduct, go } = useAccount();
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

  const geoCount = (account.geography.sets?.length ?? 0) + (account.geography.custom?.length ?? 0);
  const channels = Object.values(account.sender).filter((s) => s.state !== 'none').length;

  return (
    <div className="lp">
      {toastEl}
      {/* The orange header, with the same words whatever's done */}
      <HomeHeader ref={heading} />

      {task ? (
        <section className="lp-task" aria-labelledby={`${uid}-t`}>
          {/* The same progress row as the first landing: Your progress, x of y done, the green bar */}
          <div className="lp-task-top as-progress">
            <p id={`${uid}-step`}>Your progress</p>
            <p className="as-count">
              <strong>{todos.length - open.length}</strong> of {todos.length} done
            </p>
          </div>
          <div
            className="lp-task-bar as-bar"
            role="progressbar"
            aria-labelledby={`${uid}-step`}
            aria-valuemin={0}
            aria-valuemax={todos.length}
            aria-valuenow={todos.length - open.length}
            aria-valuetext={`${todos.length - open.length} of ${todos.length} done`}
          >
            <span style={{ width: `${((todos.length - open.length) / todos.length) * 100}%` }} />
          </div>
          <div className="lp-task-body">
            <span className="lp-task-icon" aria-hidden="true">
              <Icon name={TASK[task.id].icon} size={24} />
            </span>
            <div className="lp-task-text">
              <h2 id={`${uid}-t`}>{TASK[task.id].title}</h2>
              <p>
                You’ll need {TASK[task.id].needs}. About {TASK[task.id].minutes} minutes.
              </p>
              <button type="button" className="lp-link" onClick={() => setWhy(true)}>
                Why complete this?
              </button>
            </div>
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
      <div className="lp-ex-art" aria-hidden="true">
        <Illustration art={CARD[p].art} />
      </div>
      <div className="lp-ex-body">
        <h3>{meta.name}</h3>
        <p>{meta.about}</p>
        <ul className="lp-ex-tags" aria-label="About the product">
          {CARD[p].stats.map(([n, l]) => (
            <li key={l} className="geo-tag">
              {n} {l.toLowerCase()}
            </li>
          ))}
        </ul>
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
const ART: Record<Art, string> = { chat: cmsArt, health: hcmArt, doc: lnpArt };
/** unDraw illustrations (free to use), their accent in the theme colour; decorative. */
function Illustration({ art }: { art: Art }) {
  return <span className="lp-undraw" dangerouslySetInnerHTML={{ __html: ART[art] }} />;
}
