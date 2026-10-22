import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { Select } from '../components/Select';
import { useAccount } from '../lib/store';
import { PRODUCTS, PRODUCT_FULL_NAME, PRODUCT_ORDER, ROLES, hasGeography, newId, todoDone, todosFor, DEFAULT_HOME, type HomeWidget, type Product, type TodoId } from '../lib/model';
import { Geographies } from './Geographies';
import { Channels } from './Channels';
import { IntegrationsSummary } from './Integrations';
import { MultiSelect } from './Team';
import { TaskBody } from './TaskCard';
import { usePageToast } from './PageToast';
import { AccountSetup, HomeHeader } from './AccountSetup';
import cmsArt from '../assets/undraw/cms.svg?raw';
import hcmArt from '../assets/undraw/hcm.svg?raw';
import lnpArt from '../assets/undraw/lnp.svg?raw';

/**
 * Home, laid out like an admin portal's landing page:
 * 1. A greeting banner.
 * 2. Your task: the next account step, with why it matters and its button (or, once all done, the account at a glance).
 * 3. Your products (no visible heading): one tinted card each, with three numbers, an illustration and Open.
 * 4. Side by side: the health systems DIGIT plugs into, and inviting the team.
 * 5. Explore other products not in the account yet.
 * Until geographies are in, only the banner and the task show: the products need them.
 */

/** Prototype values: each product's three numbers, its tint and its illustration. */
/** The full product names on Home's cards. */
const CARD_NAME = PRODUCT_FULL_NAME;

const CARD: Record<Product, { stats: [string, string][]; tint: string; art: Art; tag: string }> = {
  cms: { stats: [['6', 'Complaint types'], ['5', 'Modules'], ['14', 'Features']], tint: '#E8F1F8', art: 'chat', tag: 'Citizen services' },
  hcm: { stats: [['4+', 'Campaign templates'], ['8', 'Modules'], ['12', 'Features']], tint: '#E7F4EC', art: 'health', tag: 'Health' },
  lnp: { stats: [['3', 'Licence templates'], ['6', 'Modules'], ['10', 'Features']], tint: '#FDF0E7', art: 'doc', tag: 'Revenue' },
};


export function Home() {
  const { account, openProduct, go } = useAccount();
  const uid = useId();
  const [toastEl, showToast] = usePageToast();
  const on = PRODUCT_ORDER.filter((p) => account.products[p].enabled);
  const todos = todosFor(account);
  const open = todos.filter((t) => !todoDone(t.id, account));
  const task = open[0];
  const started = hasGeography(account);
  // A setup step opens here, in place of the page
  const [flow, setFlow] = useState<TodoId | null>(null);
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
  // First landing, until geographies are in: the original setup page, unchanged
  // (Welcome aboard, Let’s set up your account, the progress bar and every task).
  if (!started)
    return (
      <div className="geo is-overview hm-first">
        <AccountSetup />
      </div>
    );
  if (flow === 'geography') return <Geographies embedded onDone={back} />;
  if (flow === 'sender') return <Channels embedded onDone={back} />;


  // Customize home is off for now, so Home always uses the default layout (saved layouts are ignored)
  const layout = DEFAULT_HOME;
  const visible = layout.order.filter((w) => !layout.hidden.includes(w));
  const rows: HomeWidget[][] = [];
  for (const w of visible) {
    const last = rows[rows.length - 1];
    if (w !== 'products' && last && last.length === 1 && last[0] !== 'products') last.push(w);
    else rows.push([w]);
  }
  const widget = (w: HomeWidget) =>
    w === 'products' ? (
      <section key={w} className="lp-sec" aria-labelledby={`${uid}-p`}>
        {/* Not shown, but keeps the heading order (h1, then h2 before the product h3s) */}
        <h2 id={`${uid}-p`} className="sr-only">
          Your products
        </h2>
        <ul className={`lp-products${on.length === 1 ? ' is-single' : ''}`}>
          {on.map((p) => (
            <li key={p} className="lp-product" style={{ background: CARD[p].tint }}>
              <h3>{CARD_NAME[p]}</h3>
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
                <Button variation="primary" label="View product" ariaLabel={`View ${CARD_NAME[p]}`} icon="ArrowForward" isSuffix onClick={() => openProduct(p)} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    ) : w === 'integrations' ? (
      <section key={w} className="lp-panel" aria-labelledby={`${uid}-i`}>
        <div className="lp-panel-head">
          <div>
            <h2 id={`${uid}-i`}>Your integrations</h2>
            <p>Connect DIGIT to the systems you already use.</p>
          </div>
        </div>
        <IntegrationsSummary view={layout.integrationsView} />
      </section>
    ) : (
      <InvitePanel key={w} onSent={showToast} />
    );

  return (
    <div className="lp">
      {toastEl}
      {/* The orange header, with the same words whatever's done */}
      <HomeHeader ref={heading} />

      {task && (
        <section className="as-sheet" aria-label="Your account setup">
          {/* The same sheet as the first landing: progress in the header row, the task below */}
          <div className="as-sheet-head">
            <div className="as-progress">
              <p id={`${uid}-step`}>Your account setup progress</p>
              <p className="as-count">
                <strong>{todos.length - open.length}</strong> of {todos.length} done
              </p>
            </div>
            <div
              className="as-bar"
              role="progressbar"
              aria-labelledby={`${uid}-step`}
              aria-valuemin={0}
              aria-valuemax={todos.length}
              aria-valuenow={todos.length - open.length}
              aria-valuetext={`${todos.length - open.length} of ${todos.length} done`}
            >
              <span style={{ width: `${((todos.length - open.length) / todos.length) * 100}%` }} />
            </div>
          </div>
          <div className="lp-task as-task">
            <TaskBody
              id={task.id}
              headingId={`${uid}-t`}
              showWhy={false}
              onStart={() => (task.id === 'users' ? go('team') : setFlow(task.id))}
            />
          </div>
        </section>
      )}

      {started && (
        <>
          {/* Sections in the saved Home layout (Customize home is off for now). Products is full width; two half-width sections
              next to each other share a row, and one on its own takes the full row. */}
          {rows.map((row) =>
            row.length === 2 ? (
              <div key={row.join('-')} className="lp-split">
                {row.map((w) => widget(w))}
              </div>
            ) : (
              <div key={row[0]} className={row[0] === 'products' ? undefined : 'lp-solo'}>
                {widget(row[0])}
              </div>
            ),
          )}
        </>
      )}

    </div>
  );
}


const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** A name from an email until they set their own: amina.wanjiru@… → Amina Wanjiru */
const nameFrom = (email: string) =>
  email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(' ');

/** Invite your team, laid out the common way: one email field with the role picker inside it and the send
 *  button beside it, then the people invited. Type or paste emails (Enter or comma after each). */
function InvitePanel({ onSent }: { onSent: (m: string) => void }) {
  const { account, update, go } = useAccount();
  const uid = useId();
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [role, setRole] = useState('Staff');
  const on = PRODUCT_ORDER.filter((p) => account.products[p].enabled);
  // Every product in the account is ticked to start with
  const [products, setProducts] = useState<Product[]>(on);
  const [productError, setProductError] = useState('');
  const [error, setError] = useState('');
  const taken = new Set(account.users.map((u) => u.email.toLowerCase()));

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
    if (!products.length) {
      setProductError('Choose at least one product');
      return document.getElementById(`${uid}-p`)?.focus();
    }
    update((a) => ({ ...a, users: [...a.users, ...next.map((email) => ({ id: newId(), name: nameFrom(email), email, role, products, status: 'invited' as const, invitedAt: Date.now() }))] }));
    setEmails([]);
    setError('');
    onSent(`${next.length} ${next.length === 1 ? 'invite' : 'invites'} sent`);
  };

  return (
    <section className="lp-panel" aria-labelledby={`${uid}-h`}>
      <div className="lp-panel-head">
        <div>
          <h2 id={`${uid}-h`}>Your team</h2>
          <p>Invite people by email and choose their role.</p>
        </div>
      </div>
      {/* The invite form in a grey box: emails, product access and role side by side, Send invite under them */}
      <form
        className="lp-invite is-boxed"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <div className="lp-invite-fields">
          <div className="lp-fld is-emails">
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
          </div>
          <div className="lp-fld">
            <label htmlFor={`${uid}-p`} className="lp-label">
              Product access
            </label>
            <MultiSelect
              id={`${uid}-p`}
              options={on.map((p) => ({ value: p, label: PRODUCTS[p].name }))}
              value={products}
              invalid={!!productError}
              describedBy={productError ? `${uid}-p-err` : undefined}
              onChange={(v) => {
                setProducts(v as Product[]);
                if (v.length) setProductError('');
              }}
            />
          </div>
          <div className="lp-fld">
            <label htmlFor={`${uid}-r`} className="lp-label">
              Role
            </label>
            <Select id={`${uid}-r`} value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </div>
        </div>
        {productError && (
          <p className="fld-error" id={`${uid}-p-err`}>
            <span className="ux-visually-hidden">Error: </span>
            {productError}
          </p>
        )}
        <div className="lp-invite-foot">
          <Button variation="primary" label={emails.length > 1 ? 'Send invites' : 'Send invite'} submit onClick={() => {}} />
        </div>
      </form>
      <div className="ig-sum-foot">
        <Button variation="secondary" label="Manage team" icon="ArrowForward" isSuffix onClick={() => go('team')} />
      </div>
    </section>
  );
}

/** A product not in the account yet: illustration on a tint, its tag, about, and Add to account. */
/** An add-to-account card for a product they don’t have yet; kept for the Settings page. */
export function ExploreCard({ p, admin, onAdded }: { p: Product; admin: boolean; onAdded: () => void }) {
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

