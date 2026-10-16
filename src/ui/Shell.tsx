import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import {
  NAVS,
  PRODUCTS,
  SECTION_ICON,
  enabledProducts,
  hasGeography,
  sectionLabel,
  sectionStatus,
  senderReady,
  todoDone,
  todosFor,
  type Account,
  type PageId,
} from '../lib/model';
import { Widget } from './Widget';
import { Modals } from './Modals';
import { HelpButton } from './HelpButton';
import { HelpPanel } from './HelpPanel';

type Badge = { label: string; tone: string } | null;

/** The account's own pages, each with its status beside it. */
const ACCOUNT_NAV: { id: PageId; label: string; icon: string; badge: (a: Account) => Badge }[] = [
  {
    id: 'home',
    label: 'Home',
    icon: 'Home',
    badge: (a) => {
      if (a.ui.viewAs !== 'admin') return null;
      const left = todosFor(a).filter((t) => !todoDone(t.id, a)).length;
      return left ? { label: `${left} to do`, tone: 'is-in-progress' } : { label: 'Done', tone: 'is-completed' };
    },
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'Analytics',
    badge: (a) => {
      const live = enabledProducts(a).filter((p) => a.products[p].live).length;
      return live ? { label: `${live} live`, tone: 'is-completed' } : { label: 'No data', tone: 'is-locked' };
    },
  },
  {
    id: 'geographies',
    label: 'Geographies',
    icon: 'Public',
    badge: (a) =>
      hasGeography(a)
        ? { label: `${a.geography.areas.length} areas`, tone: 'is-completed' }
        : { label: 'To do', tone: 'is-not-started' },
  },
  {
    id: 'sender',
    label: 'Sender details',
    icon: 'Email',
    badge: (a) =>
      senderReady(a)
        ? { label: 'Submitted', tone: 'is-waiting' }
        : a.products.cms.enabled || a.products.lnp.enabled
          ? { label: 'To do', tone: 'is-not-started' }
          : { label: 'Optional', tone: 'is-locked' },
  },
  {
    id: 'team',
    label: 'Team',
    icon: 'Group',
    badge: (a) =>
      a.users.length ? { label: `${a.users.length} users`, tone: 'is-completed' } : { label: 'To do', tone: 'is-not-started' },
  },
  { id: 'integrations', label: 'Integrations', icon: 'Extension', badge: () => ({ label: 'Optional', tone: 'is-locked' }) },
  {
    id: 'branding',
    label: 'Branding',
    icon: 'InvertColors',
    badge: (a) => (a.branding.saved ? { label: 'Done', tone: 'is-completed' } : { label: 'Optional', tone: 'is-locked' }),
  },
];

/** Top bar + side nav. Inside a product, the nav is that product's. */
export function Shell({ children }: { children: ReactNode }) {
  const { account, page, params, go, restart, update } = useAccount();
  const [helpOpen, setHelpOpen] = useState(false);
  const helpBtn = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const closeHelp = () => {
    setHelpOpen(false);
    helpBtn.current?.focus();
  };
  const b = account.branding;
  const product = (page === 'product' || page === 'golive') && params.product ? params.product : null;

  return (
    <div className="sh">
      <a className="sh-skip" href="#main">
        Skip to main content
      </a>
      <header className="sh-top">
        <div className="sh-org">
          {b.logo ? (
            <img src={b.logo} alt="" className="sh-org-logo" />
          ) : (
            <span className="sh-org-mark" aria-hidden="true" style={b.colour ? { background: b.colour } : undefined}>
              {(b.name[0] ?? 'D').toUpperCase()}
            </span>
          )}
          <span className="sh-org-name">{b.name}</span>
        </div>
        <div className="sh-top-end">
          <img className="sh-digit" src="/digit-logo.png" alt="DIGIT" width={528} height={124} />
        </div>
      </header>

      <div className="sh-body">
        <nav className="sh-nav" aria-label={product ? PRODUCTS[product].name : 'Account'}>
          {product ? (
            <div className="sh-nav-main">
              <button type="button" className="sh-back" onClick={() => go('home')}>
                <Icon name="ArrowBack" size={18} />
                Home
              </button>
              <p className="sh-nav-h">
                <Icon name={PRODUCTS[product].icon} size={20} />
                {PRODUCTS[product].name}
              </p>
              <ul>
                {NAVS[product].map((s) => (
                  <NavItem
                    key={s}
                    label={sectionLabel(product, s)}
                    icon={SECTION_ICON[s]}
                    badge={sectionStatus(product, s, account)}
                    current={page === 'product' && params.section === s}
                    onClick={() => go('product', { product, section: s })}
                  />
                ))}
              </ul>
            </div>
          ) : (
            <ul>
              {ACCOUNT_NAV.map((n) => (
                <NavItem
                  key={n.id}
                  label={n.label}
                  icon={n.icon}
                  badge={n.badge(account)}
                  current={page === n.id}
                  onClick={() => go(n.id)}
                />
              ))}
            </ul>
          )}
          <div className="sh-nav-foot">
            <fieldset className="sh-viewas">
              <legend>Demo: view as</legend>
              {(['admin', 'member'] as const).map((v) => (
                <label key={v}>
                  <input
                    type="radio"
                    name="viewas"
                    checked={account.ui.viewAs === v}
                    onChange={() => update((a) => ({ ...a, ui: { ...a.ui, viewAs: v } }))}
                  />
                  {v === 'admin' ? 'Admin' : 'Member'}
                </label>
              ))}
            </fieldset>
            <button
              type="button"
              className="sh-restart"
              onClick={() => {
                if (window.confirm('Restart the demo? Everything you’ve entered will be cleared.'))
                  restart();
              }}
            >
              Restart demo
            </button>
            <p>
              Powered by <strong>DIGIT</strong>
            </p>
          </div>
        </nav>
        <div className="sh-content">
          <div className="sh-sub">
            <HelpButton
              open={helpOpen}
              controls={panelId}
              onToggle={() => setHelpOpen((o) => !o)}
              buttonRef={helpBtn}
            />
          </div>
          <main id="main" className="sh-main" tabIndex={-1}>
            {children}
          </main>
        </div>
        {helpOpen && (
          <HelpPanel
            id={panelId}
            onClose={closeHelp}
            onGo={(p) => {
              setHelpOpen(false);
              go(p);
            }}
          />
        )}
      </div>
      {!helpOpen && <Widget />}
      <Modals />
    </div>
  );
}

function NavItem({
  label,
  icon,
  badge,
  current,
  onClick,
}: {
  label: string;
  icon: string;
  badge: Badge;
  current: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button type="button" className="sh-nav-item" aria-current={current ? 'page' : undefined} onClick={onClick}>
        <Icon name={icon} size={20} />
        <span className="sh-nav-label">{label}</span>
        {badge && (
          <span className={`tag nb ${badge.tone}`}>
            <span className="ux-visually-hidden">, </span>
            {badge.label}
          </span>
        )}
      </button>
    </li>
  );
}
