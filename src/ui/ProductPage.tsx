import { useEffect } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import {
  HCM_TEMPLATES,
  LNP_TEMPLATES,
  NAVS,
  PRODUCTS,
  ROWS,
  TEMPLATES,
  hasGeography,
  hcmTemplate,
  lnpTemplate,
  newId,
  nextRow,
  percent,
  rowLocked,
  rowState,
  sectionLabel,
  slug,
  templateById,
  type Account,
  type Product,
  type Section,
} from '../lib/model';
import { UserList } from './Users';
import { ProductHome } from './ProductHome';

/** A product: its start screen until a template is chosen, then its sections. */
export function ProductPage() {
  const { account, params, go } = useAccount();
  const p = params.product;
  const ok = !!p && account.products[p].enabled && hasGeography(account);
  useEffect(() => {
    if (!ok) go('home');
  }, [ok, go]);
  if (!ok || !p) return null;
  const st = account.products[p];
  if (!st.templateId) return <Start p={p} />;
  const section = params.section && NAVS[p].includes(params.section) ? params.section : 'overview';
  if (section === 'overview') return <Overview p={p} />;
  return <SectionPage p={p} s={section} />;
}

/* ---------------------------------------------------------------- */
/* Start: choose a template (HCM: or create your own)                */
/* ---------------------------------------------------------------- */

type Card = { id: string; name: string; about: string; icon: string; meta: string };

function Start({ p }: { p: Product }) {
  const { account, update } = useAccount();
  const cards: Card[] =
    p === 'cms'
      ? TEMPLATES.map((t) => ({ ...t, meta: `${t.types.length} complaint types` }))
      : p === 'lnp'
        ? LNP_TEMPLATES.map((t) => ({ ...t, meta: `${t.types.length} licence types` }))
        : HCM_TEMPLATES.map((t) => ({ ...t, meta: `Reaches ${t.target.toLowerCase()}` }));

  const use = (id: string) =>
    update((a) => {
      const next: Account = {
        ...a,
        products: { ...a.products, [p]: { ...a.products[p], templateId: id } },
      };
      if (p === 'cms') {
        const t = templateById(id)!;
        next.services = [...a.services, { id: newId(), templateId: id, name: t.name, types: t.types.map((x) => x.id) }];
      }
      if (p === 'lnp') {
        const t = LNP_TEMPLATES.find((x) => x.id === id)!;
        next.products.lnp = {
          ...next.products.lnp,
          data: { ...next.products.lnp.data, types: t.types.map((x) => x.id) },
        };
      }
      return next;
    });

  return (
    <div className="hm">
      <p className="hm-hi">{PRODUCTS[p].name}</p>
      <h1 tabIndex={-1}>{p === 'hcm' ? 'Use a template, or create your own' : 'Choose a template'}</h1>
      <p className="hm-lead">
        {p === 'hcm'
          ? 'A template fills in the campaign basics, checklists and app for you. Starting from scratch? Create your own.'
          : 'Each one comes ready to change. Pick the closest; the checklist then walks you through the rest.'}
      </p>
      <ul className="tg-list">
        {cards.map((t) => (
          <li key={t.id} className="tc">
            <span className="tc-icon" aria-hidden="true">
              <Icon name={t.icon} size={26} />
            </span>
            <h2 className="tc-h">{t.name}</h2>
            <p className="tc-about">{t.about}</p>
            <p className="tc-meta">{t.meta}</p>
            <div className="tc-actions">
              <Button variation="primary" label="Use Template" onClick={() => use(t.id)} />
            </div>
          </li>
        ))}
        {p === 'hcm' && (
          <li className="tc is-own">
            <span className="tc-icon" aria-hidden="true">
              <Icon name="Add" size={26} />
            </span>
            <h2 className="tc-h">Create my own</h2>
            <p className="tc-about">Start with an empty campaign and set up each part yourself.</p>
            <p className="tc-meta">Nothing filled in</p>
            <div className="tc-actions">
              <Button variation="secondary" label="Create My Own" onClick={() => use('own')} />
            </div>
          </li>
        )}
      </ul>
      {account.ui.viewAs !== 'admin' && <p className="tip">Only an admin can start setting this up.</p>}
    </div>
  );
}

const templateName = (p: Product, a: Account) =>
  p === 'cms'
    ? a.services[a.services.length - 1]?.name
    : p === 'lnp'
      ? lnpTemplate(a)?.name
      : a.products.hcm.templateId === 'own'
        ? 'Your own campaign'
        : hcmTemplate(a)?.name;

/* ---------------------------------------------------------------- */
/* Overview                                                          */
/* ---------------------------------------------------------------- */

function Overview({ p }: { p: Product }) {
  const { account, openModal, setWidgetOpen } = useAccount();
  const st = account.products[p];
  const pct = percent(p, account);
  const next = nextRow(p, account);

  return (
    <div className="sf2 pv-over">
      <p className="sv-eyebrow">
        {PRODUCTS[p].name}
        <span className={`tag ${st.live ? 'is-completed' : 'is-not-started'}`}>{st.live ? 'Live' : 'Not live'}</span>
      </p>
      <h1 tabIndex={-1}>{templateName(p, account)}</h1>

      {st.live ? (
        <LiveSummary p={p} />
      ) : (
        <section className="card ov-progress" aria-labelledby="ov-h">
          <h2 id="ov-h">{pct}% set up</h2>
          <span className="hc-bar" aria-hidden="true">
            <span style={{ width: `${pct}%` }} />
          </span>
          {next && (
            <p>
              Next: <strong>{next.label}</strong>
            </p>
          )}
          <div className="form-foot">
            {next && rowState(p, next, account) === 'open' && (
              <Button variation="primary" label="Continue" onClick={() => openModal({ kind: 'row', product: p, row: next.id })} />
            )}
            <Button variation="link" label="Show Checklist" onClick={() => setWidgetOpen(true)} />
          </div>
        </section>
      )}

      <ProductHome p={p} />
    </div>
  );
}

function LiveSummary({ p }: { p: Product }) {
  const { account, go } = useAccount();
  const link = `https://${slug(account.branding.name || 'your-org')}.digit.gov/${slug(PRODUCTS[p].name)}`;
  return (
    <section className="card" aria-labelledby="ov-live">
      <h2 id="ov-live">Live</h2>
      <p className="card-lead">
        {p === 'hcm' ? 'Field workers can sign in to the app and start.' : `People can use it from ${link}`}
      </p>
      <div className="form-foot">
        <Button variation="primary" label="Open Product Health" onClick={() => go('health')} />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Sections: where checklist rows live                               */
/* ---------------------------------------------------------------- */

const SECTION_LEAD: Partial<Record<Section, string>> = {
  departments: 'The teams that handle complaints, and who owns each one.',
  users: 'Your team, from the account. Invite more from Home.',
  notifications: 'The messages people get.',
  translations: 'Show it in the languages people speak.',
};

function SectionPage({ p, s }: { p: Product; s: Section }) {
  const { account, openModal } = useAccount();
  const rows = ROWS[p].filter((r) => r.section === s);
  const live = account.products[p].live;

  return (
    <div className="sf2">
      <p className="sv-eyebrow">{PRODUCTS[p].name}</p>
      <h1 tabIndex={-1}>{sectionLabel(p, s)}</h1>
      {SECTION_LEAD[s] && <p className="sf2-lead">{s === 'data' ? '' : SECTION_LEAD[s]}</p>}

      {rows.length > 0 && (
        <ul className="rc-list">
          {rows.map((r) => {
            const state = rowState(p, r, account);
            const result = account.products[p].done[r.id];
            return (
              <li key={r.id} className={`rc is-${state}`}>
                <span className="cl-mark" aria-hidden="true">
                  {state === 'done' ? <Icon name="Check" size={14} /> : state === 'locked' ? <Icon name="Lock" size={12} /> : null}
                </span>
                <div className="rc-text">
                  <h2>
                    {r.label} {r.account && <span className="tag acct">Account</span>}
                  </h2>
                  <p>{state === 'done' ? result : state === 'locked' ? rowLocked(p, r, account) : r.what}</p>
                </div>
                {state === 'done' ? (
                  <span className="cl-done">
                    <span className="tag is-completed">Done</span>
                    <Button
                      variation="secondary"
                      size="medium"
                      label={live ? 'Edit' : 'View'}
                      onClick={() => openModal({ kind: 'row', product: p, row: r.id })}
                    />
                  </span>
                ) : state === 'open' ? (
                  <Button variation="primary" size="medium" label="Start" onClick={() => openModal({ kind: 'row', product: p, row: r.id })} />
                ) : (
                  <span className="tag is-locked">Locked</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {s === 'users' && (
        <>
          {account.ui.viewAs === 'admin' && (
            <div className="form-foot">
              <Button variation="secondary" label="Invite Users" onClick={() => openModal({ kind: 'users' })} />
            </div>
          )}
          <UserList />
        </>
      )}
      {s === 'notifications' && p === 'hcm' && (
        <p className="tip">Field workers get updates in the app. Text messages to households are optional.</p>
      )}
      {s === 'translations' && <p className="tip">English is on. Add other languages any time, before or after going live.</p>}
    </div>
  );
}
