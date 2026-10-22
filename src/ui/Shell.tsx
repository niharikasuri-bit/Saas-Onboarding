import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import {
  NAVS,
  PRODUCTS,
  SECTION_ICON,
  sectionLabel,
  type PageId,
  statusOf,
} from '../lib/model';
import { Widget } from './Widget';
import { Modals } from './Modals';
import { HelpButton } from './HelpButton';
import { HelpPanel } from './HelpPanel';
import { Tour } from './Tour';
import { LOGO } from '../logo';

/** The account's own pages. The side nav shows where things live, not their status.
 * Product health and Language do nothing when clicked for now. */
/** Not built yet: these do nothing when clicked, for now. */
const INERT: PageId[] = ['health'];

/** In the order the onboarding tour walks through them: set up first (geographies, notification channels),
 *  then the team, then branding and language, then the rest. tour names the tour step each item belongs to. */
const ACCOUNT_NAV: { id: PageId; label: string; icon: string; tour?: string }[] = [
  { id: 'home', label: 'Home', icon: 'Home' },
  { id: 'geographies', label: 'Geographies', icon: 'Public', tour: 'setup' },
  { id: 'sender', label: 'Notification Channels', icon: 'Email', tour: 'setup' },
  { id: 'team', label: 'Team', icon: 'Group', tour: 'team' },
  { id: 'branding', label: 'Branding', icon: 'InvertColors', tour: 'brand' },
  { id: 'languages', label: 'Language', icon: 'Translate', tour: 'brand' },
  { id: 'integrations', label: 'Integrations', icon: 'Extension', tour: 'more' },
  { id: 'health', label: 'Product Health', icon: 'Analytics', tour: 'more' },
];

/** Top bar + side nav. Inside a product, the nav is that product's. */
export function Shell({ children }: { children: ReactNode }) {
  const { account, page, params, go, restart } = useAccount();
  // Pages with breadcrumbs already have a way back
  const mainRef = useRef<HTMLElement>(null);
  const [hasCrumbs, setHasCrumbs] = useState(false);
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const check = () => setHasCrumbs(!!el.querySelector('.cg-crumbs'));
    check();
    const mo = new MutationObserver(check);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  const showBack = page !== 'home' && !hasCrumbs;
  // Prototype: people accept their invite about 10 seconds after it's sent
  const { update } = useAccount();
  useEffect(() => {
    const tick = () =>
      update((a) => {
        const now = Date.now();
        if (!a.users.some((u) => statusOf(u) === 'invited')) return a;
        const users = a.users.map((u) =>
          statusOf(u) !== 'invited' ? u : !u.invitedAt ? { ...u, invitedAt: now } : now - u.invitedAt > 10000 ? { ...u, status: 'accepted' as const } : u,
        );
        return users.some((u, i) => u !== a.users[i]) ? { ...a, users } : a;
      });
    tick();
    const t = setInterval(tick, 2000);
    return () => clearInterval(t);
  }, []);
  const [query, setQuery] = useState('');
  const match = (label: string) => label.toLowerCase().includes(query.trim().toLowerCase());
  const [helpOpen, setHelpOpen] = useState(false);
  // The onboarding tour: the welcome card the first time they reach Home, or the steps when replayed from Help
  const [tour, setTour] = useState<'welcome' | 'steps' | null>(null);
  useEffect(() => {
    if (page === 'home' && !account.ui.tourDone && !tour) setTour('welcome');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  const endTour = () => {
    setTour(null);
    if (!account.ui.tourDone) update((a) => ({ ...a, ui: { ...a.ui, tourDone: true } }));
  };
  const helpBtn = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const closeHelp = () => {
    setHelpOpen(false);
    helpBtn.current?.focus();
  };
  const b = account.branding;
  const product = (page === 'product' || page === 'golive') && params.product ? params.product : null;
  // The nav shrinks to icons the moment they open any page from it; Home shows it in full.
  const expanded = page === 'home';
  const mini = !expanded;

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
        <nav className={`sh-nav${mini ? ' is-mini' : ''}`} aria-label={product ? PRODUCTS[product].name : 'Account'}>
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
              <button type="button" className="sh-back" data-label="Home" onClick={() => go('home')}>
                <Icon name="ArrowBack" size={18} />
                <span className="sh-nav-label">Home</span>
              </button>
              <p className="sh-nav-h">
                <Icon name={PRODUCTS[product].icon} size={20} />
                <span className="sh-nav-label">{PRODUCTS[product].name}</span>
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
                <NavItem
                  key={n.id}
                  label={n.label}
                  icon={n.icon}
                  tour={n.tour}
                  current={page === n.id}
                  onClick={() => !INERT.includes(n.id) && go(n.id)}
                />
              ))}
            </ul>
          )}
          <div className="sh-nav-foot">
            <button
              type="button"
              className="sh-restart"
              data-label="Restart"
              onClick={() => {
                if (window.confirm('Restart from the beginning? Everything you’ve entered will be cleared.')) restart();
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="sh-nav-label">Restart</span>
            </button>
            <p className="sh-powered">
              Powered by <img src={LOGO} alt="DIGIT" width={528} height={124} />
            </p>
          </div>
        </nav>
        <div className="sh-content">
          <div className={`sh-sub${showBack ? ' has-back' : ''}`}>
            {/* Back on every page except Home, unless the page has its own breadcrumbs */}
            {showBack && (
              <button type="button" className="sh-back-home" onClick={() => go('home')}>
                <Icon name="ArrowBack" size={18} />
                Back
              </button>
            )}
            {page === 'branding' && <h1 className="sh-sub-title">Branding</h1>}
            {/* No Help button on the Help Center itself */}
            {!['helpcenter', 'documents', 'tutorials', 'faq'].includes(page) && (
            <HelpButton
              open={helpOpen}
              controls={panelId}
              onToggle={() => setHelpOpen((o) => !o)}
              buttonRef={helpBtn}
            />
            )}
          </div>
          <main id="main" ref={mainRef} className="sh-main" tabIndex={-1}>
            {children}
          </main>
        </div>
        {helpOpen && (
          <HelpPanel
            id={panelId}
            page={page}
            onClose={closeHelp}
            onGo={(p) => {
              setHelpOpen(false);
              go(p);
            }}
            onReplay={() => {
              setHelpOpen(false);
              // The tour points at the full side nav, which shows on Home
              if (page !== 'home') go('home');
              requestAnimationFrame(() => requestAnimationFrame(() => setTour('steps')));
            }}
          />
        )}
        {tour && <Tour start={tour} onDone={endTour} />}
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
  tour,
  onClick,
}: {
  label: string;
  icon: string;
  current: boolean;
  tour?: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button type="button" className="sh-nav-item" data-tour={tour} data-label={label} aria-current={current ? 'page' : undefined} onClick={onClick}>
        <Icon name={icon} size={20} />
        <span className="sh-nav-label">{label}</span>
      </button>
    </li>
  );
}
