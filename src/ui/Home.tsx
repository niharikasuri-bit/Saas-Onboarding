import { useId } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import {
  PRODUCTS,
  PRODUCT_ORDER,
  cardState,
  nextRow,
  percent,
  todoDone,
  todoResult,
  todosFor,
  type Product,
  type TodoId,
} from '../lib/model';
import { firstName } from '../setup/steps';
import { setupDone } from '../lib/model';
import { AccountSetup } from './AccountSetup';

const TODO_ACTION: Record<TodoId, [string, string]> = {
  geography: ['Add Geographies', 'View Geographies'],
  users: ['Invite Users', 'Invite More'],
  sender: ['Set Up Notification Channels', 'View Notification Channels'],
};

/**
 * Home: a Primary 1 bg hero with the admin's account to-do, then a card for
 * each product. Members don't see the to-do.
 */
export function Home() {
  const { account, answers } = useAccount();
  const uid = useId();
  const admin = account.ui.viewAs === 'admin';
  const on = PRODUCT_ORDER.filter((p) => account.products[p].enabled);
  const off = PRODUCT_ORDER.filter((p) => !account.products[p].enabled);

  // Until the account to-do is done it leads Home; the products sit below it.
  const setup = !setupDone(account);

  return (
    <div className={`hm${setup ? ' is-setup' : ''}`}>
      {setup ? <AccountSetup /> : <Hero name={firstName(answers)} admin={admin} />}

      {/* products appear once the account to-do is done */}
      {!setup && (
      <section aria-labelledby={`${uid}-p`} className="pc-wrap">
        <h2 id={`${uid}-p`} className="tg-h">
          Your products
        </h2>
        <ul className="pc-list">
          {on.map((p) => (
            <ProductCard key={p} p={p} />
          ))}
        </ul>
        {off.length > 0 && (
          <ul className="pc-off" aria-label="Not enabled">
            {off.map((p) => (
              <OffCard key={p} p={p} />
            ))}
          </ul>
        )}
      </section>
      )}
    </div>
  );
}

function Hero({ name, admin }: { name: string; admin: boolean }) {
  const { account, params, openModal } = useAccount();
  const todos = todosFor(account);
  const left = todos.filter((t) => !todoDone(t.id, account)).length;

  const open = (id: TodoId) =>
    openModal(id === 'geography' ? { kind: 'geography' } : id === 'users' ? { kind: 'users' } : { kind: 'sender' });

  return (
    <section className="hero" aria-labelledby="hero-h">
      <h1 id="hero-h" tabIndex={-1}>
        Hey {name} <span aria-hidden="true">👋</span>
      </h1>
      {admin ? (
        <>
          <p className="hero-lead">
            {left
              ? `Your account needs ${left === 1 ? 'one more thing' : `${left} things`}. Each one unlocks something in your products.`
              : 'Your account is set up. Everything in your products is unlocked.'}
          </p>
          <ul className="todo-list">
            {todos.map((t) => {
              const done = todoDone(t.id, account);
              return (
                <li
                  key={t.id}
                  className={`todo-row${done ? ' is-done' : ''}${params.highlight === t.id ? ' is-lit' : ''}`}
                >
                  <span className="todo-mark" aria-hidden="true">
                    {done && <Icon name="Check" size={14} />}
                  </span>
                  <span className="todo-text">
                    <span className="todo-name">
                      {t.label}
                      {done && <span className="ux-visually-hidden"> (done)</span>}
                    </span>
                    <span className="todo-why">{done ? todoResult(t.id, account) : t.unlocks}</span>
                  </span>
                  <Button
                    variation={done ? 'link' : 'secondary'}
                    size="medium"
                    label={TODO_ACTION[t.id][done ? 1 : 0]}
                    onClick={() => open(t.id)}
                  />
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="hero-lead">Here are the products your team is working on.</p>
      )}
    </section>
  );
}

function ProductCard({ p }: { p: Product }) {
  const { account, openProduct, openModal } = useAccount();
  const st = account.products[p];
  const meta = PRODUCTS[p];
  const state = cardState(p, account);
  const admin = account.ui.viewAs === 'admin';
  const pct = percent(p, account);
  const next = nextRow(p, account);

  return (
    <li className={`pc is-${state}`}>
      <div className="pc-head">
        <span className="pc-icon" aria-hidden="true">
          <Icon name={meta.icon} size={26} />
        </span>
        <h3>{meta.name}</h3>
        <span className={`tag ${st.live ? 'is-completed' : 'is-not-started'}`}>{st.live ? 'Live' : 'Not live'}</span>
      </div>

      {state === 'nogeo' && (
        <>
          <p className="pc-about">{meta.about}</p>
          <p className="pc-note">
            <Icon name="Lock" size={16} />
            {admin ? 'Opens once you add the areas you work in' : 'Waiting for an admin to add areas'}
          </p>
          {/* while the account to-do is open, adding areas happens there, not here */}
          {admin && setupDone(account) && (
            <div className="pc-actions">
              <Button variation="primary" label="Define Geography" onClick={() => openModal({ kind: 'gate', product: p })} />
            </div>
          )}
        </>
      )}

      {state === 'setting' && (
        <>
          <p className="pc-about">{meta.about}</p>
          <div className="pc-progress">
            <span className="pc-bar" aria-hidden="true">
              <span style={{ width: `${pct}%` }} />
            </span>
            <span>{st.templateId ? `${pct}% set up` : 'Not started'}</span>
          </div>
          {st.templateId && next && (
            <p className="pc-next">
              Next: <strong>{next.label}</strong>
            </p>
          )}
          <div className="pc-actions">
            <Button
              variation="primary"
              label={admin ? (st.templateId ? 'Continue Setup' : 'Start Setup') : 'Open'}
              onClick={() => openProduct(p)}
            />
          </div>
        </>
      )}

      {state === 'live' && (
        <>
          <p className="pc-health">
            <span className="dot is-ok" aria-hidden="true" />
            Healthy
          </p>
          <ul className="pc-metrics">
            {liveMetrics(p).map(([k, v]) => (
              <li key={k}>
                <strong>{v}</strong>
                <span>{k}</span>
              </li>
            ))}
          </ul>
          <div className="pc-actions">
            <Button variation="secondary" label="Open" onClick={() => openProduct(p)} />
          </div>
        </>
      )}
    </li>
  );
}

/** Just live, so the numbers start at zero. */
const liveMetrics = (p: Product): [string, string][] =>
  p === 'cms'
    ? [['New today', '0'], ['Open', '0'], ['On time', '—']]
    : p === 'lnp'
      ? [['Applications today', '0'], ['Waiting for review', '0'], ['Fees collected', '0']]
      : [['Coverage', '0%'], ['Households reached', '0'], ['Field workers active', '0']];

function OffCard({ p }: { p: Product }) {
  const { account, update } = useAccount();
  const admin = account.ui.viewAs === 'admin';
  return (
    <li className="pc-small">
      <Icon name={PRODUCTS[p].icon} size={20} />
      <span className="pc-small-name">{PRODUCTS[p].name}</span>
      <span className="pc-small-state">Not enabled</span>
      {admin && (
        <>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            className="lnk"
            aria-label={`Add ${PRODUCTS[p].name}`}
            onClick={() =>
              update((a) => ({ ...a, products: { ...a.products, [p]: { ...a.products[p], enabled: true } } }))
            }
          >
            Add
          </button>
        </>
      )}
    </li>
  );
}
