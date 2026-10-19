import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { PRODUCTS, PRODUCT_ORDER, hasGeography, setupDone, type Product } from '../lib/model';
import { firstName } from '../setup/steps';
import { AccountSetup } from './AccountSetup';

/**
 * Home, in three parts:
 * 1. An orange band: the account setup checklist (only geographies are
 *    required), or a greeting once it's done.
 * 2. Your products. Locked until the account has geographies; when they
 *    arrive the lock opens once, then each card leads to the product.
 * 3. Other products, not in their plan yet, to add.
 */

/** Prototype values: the card's three numbers. */
const CARD: Record<Product, { stats: [string, string][] }> = {
  cms: {
    stats: [['6', 'Complaint types'], ['5', 'Modules'], ['14', 'Features']],
  },
  hcm: {
    stats: [['4+', 'Campaign templates'], ['8', 'Modules'], ['12', 'Features']],
  },
  lnp: {
    stats: [['3', 'Licence templates'], ['6', 'Modules'], ['10', 'Features']],
  },
};

export function Home() {
  const { account, answers } = useAccount();
  const uid = useId();
  const admin = account.ui.viewAs === 'admin';
  const on = PRODUCT_ORDER.filter((p) => account.products[p].enabled);
  const off = PRODUCT_ORDER.filter((p) => !account.products[p].enabled);
  // A setup flow (adding geographies, channels or the team) takes over the page while it's open.
  const [flow, setFlow] = useState(false);

  const unlocked = hasGeography(account);
  // Open the lock once, when geographies arrive while they're here.
  const wasUnlocked = useRef(unlocked);
  const [opening, setOpening] = useState(false);
  useEffect(() => {
    if (unlocked && !wasUnlocked.current) {
      setOpening(true);
      const t = setTimeout(() => setOpening(false), 1800);
      wasUnlocked.current = true;
      return () => clearTimeout(t);
    }
    wasUnlocked.current = unlocked;
  }, [unlocked]);

  const done = setupDone(account);

  return (
    <div className="geo is-overview hm-v5">
      {done ? <Hero name={firstName(answers)} admin={admin} /> : <AccountSetup onFlow={setFlow} />}

      {!flow && (
        <>
          <section aria-labelledby={`${uid}-p`} className="hm-sec">
            <div className="geo-bar">
              <h2 id={`${uid}-p`} className="geo-section-h">
                Your products <span className="geo-section-n">{on.length}</span>
              </h2>
            </div>
            <p className="ux-visually-hidden" role="status">
              {opening ? 'Your products are unlocked.' : ''}
            </p>
            <ul className="pt-list">
              {on.map((p) => (
                <ProductTile key={p} p={p} locked={!unlocked} opening={opening} />
              ))}
            </ul>
          </section>

          {off.length > 0 && (
            <section aria-labelledby={`${uid}-o`} className="hm-sec">
              <div className="geo-bar">
                <h2 id={`${uid}-o`} className="geo-section-h">
                  Other products
                </h2>
              </div>
              <p className="hm-sub">Not in your plan yet. Add one when you need it.</p>
              <ul className="pt-list">
                {off.map((p) => (
                  <OffTile key={p} p={p} admin={admin} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/** Once the account is set up, the band just greets them. */
function Hero({ name, admin }: { name: string; admin: boolean }) {
  return (
    <header className="geo-head geo-band">
      <div className="geo-band-text">
        <h1 id="hero-h" tabIndex={-1}>
          Hi {name}
        </h1>
        <p className="geo-lead">{admin ? 'Pick a product below to start using it.' : 'Here are the products your team is working on.'}</p>
      </div>
    </header>
  );
}

/** "About the product": its three numbers in one box, each number above its label, with dividers between. */
function About({ p }: { p: Product }) {
  return (
    <div className="pt-about-box">
      <p className="pt-about-h">About the product</p>
      <dl>
        {CARD[p].stats.map(([n, label]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{n}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ProductTile({ p, locked, opening }: { p: Product; locked: boolean; opening: boolean }) {
  const { openProduct } = useAccount();
  const meta = PRODUCTS[p];
  return (
    <li className={`pt-card${locked ? ' is-locked' : ''}${opening ? ' is-opening' : ''}`}>
      <span className="pt-icon" aria-hidden="true">
        <Icon name={meta.icon} size={26} />
      </span>
      <h3>{meta.name}</h3>
      <p className="pt-about">{meta.about}</p>
      {/* Locked cards keep it short: the numbers arrive when the product unlocks */}
      {!locked && <About p={p} />}
      <div className="pt-actions">
        {locked ? (
          <p className="pt-lock-cta">Unlocks when you add geographies</p>
        ) : (
          <Button variation="primary" label="View product" title={`View ${meta.name}`} onClick={() => openProduct(p)} />
        )}
      </div>
      {(locked || opening) && (
        <span className="pt-lock" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="56" height="56">
            <path className="pt-shackle" d="M15 22v-6a9 9 0 0 1 18 0v6" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <rect x="9" y="21" width="30" height="22" rx="5" fill="currentColor" />
            <circle cx="24" cy="31" r="3" fill="#fff" />
            <rect x="22.5" y="31" width="3" height="6" rx="1.5" fill="#fff" />
          </svg>
        </span>
      )}
    </li>
  );
}

/** A product that isn't in their plan: lighter, dashed, with Add for admins. */
function OffTile({ p, admin }: { p: Product; admin: boolean }) {
  const { update } = useAccount();
  const meta = PRODUCTS[p];
  return (
    <li className="pt-card is-off">
      <div className="pt-head">
        <span className="pt-icon" aria-hidden="true">
          <Icon name={meta.icon} size={26} />
        </span>
        <span className="pt-tag is-off">Not in your plan</span>
      </div>
      <h3>{meta.name}</h3>
      <p className="pt-about">{meta.about}</p>
      <About p={p} />
      <div className="pt-actions">
        {admin ? (
          <Button
            variation="secondary"
            icon="Add"
            label="Add to my products"
            title={`Add ${meta.name} to my products`}
            onClick={() => update((a) => ({ ...a, products: { ...a.products, [p]: { ...a.products[p], enabled: true } } }))}
          />
        ) : (
          <p className="pt-lock-cta">Ask an admin to add it.</p>
        )}
      </div>
    </li>
  );
}
