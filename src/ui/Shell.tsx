import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import {
  NAVS,
  PRODUCTS,
  SECTION_ICON,
  sectionLabel,
  type PageId,
} from '../lib/model';
import { Widget } from './Widget';
import { Modals } from './Modals';
import { HelpButton } from './HelpButton';
import { HelpPanel } from './HelpPanel';
import { LOGO } from '../logo';

/** The account's own pages. The side nav shows where things live, not their status.
 * Product health does nothing when clicked for now. */
const ACCOUNT_NAV: { id: PageId; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: 'Home' },
  { id: 'health', label: 'Product health', icon: 'Analytics' },
  { id: 'geographies', label: 'Geographies', icon: 'Public' },
  { id: 'team', label: 'Team', icon: 'Group' },
  { id: 'sender', label: 'Notification channels', icon: 'Email' },
  { id: 'integrations', label: 'Integrations', icon: 'Extension' },
  { id: 'branding', label: 'Branding', icon: 'InvertColors' },
  { id: 'languages', label: 'Language', icon: 'Translate' },
];

/** Top bar + side nav. Inside a product, the nav is that product's. */
export function Shell({ children }: { children: ReactNode }) {
  const { account, page, params, go, restart } = useAccount();
  const [query, setQuery] = useState('');
  const match = (label: string) => label.toLowerCase().includes(query.trim().toLowerCase());
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
          <img className="sh-digit" src={LOGO} alt="DIGIT" width={528} height={124} />
        </div>
      </header>

      <div className="sh-body">
        <nav className="sh-nav" aria-label={product ? PRODUCTS[product].name : 'Account'}>
          <div className="sh-search">
            <input
              type="search"
              placeholder="Search"
              aria-label="Search the menu"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
              <path d="M15 15l5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
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
                {NAVS[product].filter((s) => match(sectionLabel(product, s))).map((s) => (
                  <NavItem
                    key={s}
                    label={sectionLabel(product, s)}
                    icon={SECTION_ICON[s]}
                    current={page === 'product' && params.section === s}
                    onClick={() => go('product', { product, section: s })}
                  />
                ))}
              </ul>
            </div>
          ) : (
            <ul>
              {ACCOUNT_NAV.filter((n) => match(n.label)).map((n) => (
                <NavItem key={n.id} label={n.label} icon={n.icon} current={page === n.id} onClick={() => n.id !== 'health' && go(n.id)} />
              ))}
            </ul>
          )}
          <div className="sh-nav-foot">
            <button
              type="button"
              className="sh-restart"
              onClick={() => {
                if (window.confirm('Restart from the beginning? Everything you’ve entered will be cleared.')) restart();
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Restart
            </button>
            <p className="sh-powered">
              Powered by <img src={LOGO} alt="DIGIT" width={528} height={124} />
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
  current,
  onClick,
}: {
  label: string;
  icon: string;
  current: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button type="button" className="sh-nav-item" aria-current={current ? 'page' : undefined} onClick={onClick}>
        <Icon name={icon} size={20} />
        <span className="sh-nav-label">{label}</span>
      </button>
    </li>
  );
}
