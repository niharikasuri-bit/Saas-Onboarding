import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Toast } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { Select } from '../components/Select';
import { usePageToast } from './PageToast';
import { useAccount } from '../lib/store';
import { Field, describedBy } from './StepFrame';
import { Crumbs } from './Crumbs';
import { PRODUCTS, PRODUCT_FULL_NAME, PRODUCT_ORDER, type Account, type Product } from '../lib/model';

/**
 * Integrations: the systems DIGIT plugs into, shown for the products the account has.
 * Each has a setup that matches reality: who usually does it, what's needed, the details,
 * a connection test, then Connect. Systems an outside body must approve (MOSIP, DigiLocker)
 * send a request and wait. Complaints and licence systems are samples.
 */
type SetupField = { key: string; label: string; hint?: string; example?: string; secret?: boolean; options?: string[]; optional?: boolean; type?: string };
type SystemSpec = {
  id: string;
  /** Where the setup guide lives (placeholder: DIGIT docs until each guide exists). */
  guide?: string;
  /** The company's logo (public/integrations), who makes it, and what it is, for the catalogue. */
  logo: string;
  by: string;
  about: string;
  /** About two lines, for the catalogue card. */
  blurb: string;
  name: string;
  desc: string;
  mark: string;
  color: string;
  /** What it does in each product it fits. */
  uses: Partial<Record<Product, string>>;
  who: string;
  needs: string;
  time: string;
  /** An outside body approves the setup: they send a request instead of connecting. */
  approval?: boolean;
  owner?: string;
  fields: SetupField[];
};

const SYSTEMS: readonly SystemSpec[] = [
  {
    id: 'dhis2', blurb: 'Open-source health information platform for reporting and analysis.', logo: '/integrations/dhis2.svg', by: 'HISP Centre, University of Oslo', about: 'DHIS2 is an open-source health information platform that ministries of health use to collect, report and analyse health data.',
    name: 'DHIS2', desc: 'Analytics and reporting integration', mark: 'D2', color: '#2C6693', uses: { hcm: 'Send campaign figures to DHIS2 for reporting' },
    who: 'Your IT team or DHIS2 administrator', needs: 'The DHIS2 server address and an account for DIGIT to use', time: 'About 30 minutes, plus matching your locations',
    fields: [
      { key: 'url', label: 'DHIS2 server address', example: 'https://dhis2.health.gov.example', type: 'url' },
      { key: 'user', label: 'Username', example: 'digit-sync' },
      { key: 'password', label: 'Password', secret: true },
    ],
  },
  {
    id: 'elmis', blurb: 'Open-source system for tracking health supply stock and deliveries.', logo: '/integrations/openlmis.svg', by: 'OpenLMIS Community', about: 'OpenLMIS is an open-source logistics management system that health supply chains use to track stock, requisitions and deliveries.',
    name: 'OpenLMIS', desc: 'Inventory and supply chain management', mark: 'LM', color: '#00703C', uses: { hcm: 'Keep campaign stock in step with OpenLMIS' },
    who: 'Your IT team or supply chain lead', needs: 'The OpenLMIS server address and an API key', time: 'About 20 minutes',
    fields: [
      { key: 'url', label: 'OpenLMIS server address', example: 'https://openlmis.health.gov.example', type: 'url' },
      { key: 'key', label: 'API key', secret: true },
    ],
  },
  {
    id: 'mosip', blurb: 'Open-source platform for building national digital identity systems.', logo: '/integrations/mosip.png', by: 'MOSIP', about: 'MOSIP is an open-source platform that governments use to build their foundational digital identity systems.',
    name: 'MOSIP', desc: 'Digital identity integration', mark: 'MO', color: '#6A3FA0', uses: { hcm: 'Verify people when they register for a campaign', cms: 'Verify the citizen filing a complaint', lnp: 'Verify the applicant' },
    who: 'Your IT team, with your national ID authority', needs: 'Partner registration with the ID authority', time: 'Usually a few weeks, while the ID authority reviews it',
    approval: true, owner: 'the national ID authority',
    fields: [
      { key: 'contact', label: 'Contact name', example: 'Elena Garcia' },
      { key: 'email', label: 'Contact email', example: 'elena@city.gov', type: 'email' },
    ],
  },
  {
    id: 'arcgis', blurb: 'Esri’s mapping platform for managing places and assets on a map.', logo: '/integrations/arcgis.svg', by: 'Esri', about: 'ArcGIS is Esri’s mapping and location platform, used by city and national governments to manage places and assets on a map.',
    name: 'ArcGIS', desc: 'Map complaints to locations', mark: 'GIS', color: '#1D5F96', uses: { cms: 'Plot complaints on your city map' },
    who: 'Your GIS or IT team', needs: 'Your ArcGIS portal address and an API key', time: 'About 15 minutes',
    fields: [
      { key: 'url', label: 'ArcGIS portal address', example: 'https://maps.city.gov.example/portal', type: 'url' },
      { key: 'key', label: 'API key', secret: true },
    ],
  },
  {
    id: 'payments', blurb: 'Payment gateway for cards, UPI, net banking and wallets.', logo: '/integrations/razorpay.svg', by: 'Razorpay', about: 'Razorpay is a payment gateway that accepts cards, UPI, net banking and wallets, and settles the money to your account.',
    name: 'Razorpay', desc: 'Collect licence fees online', mark: 'RP', color: '#8A4B08', uses: { lnp: 'Collect licence and permit fees online' },
    who: 'Your finance team, with IT', needs: 'A Razorpay merchant account and its API keys', time: 'About 30 minutes once the merchant account is approved',
    fields: [
      { key: 'merchant', label: 'Merchant ID', example: 'MID-204918' },
      { key: 'key', label: 'Key ID', example: 'rzp_live_000000000000' },
      { key: 'secret', label: 'Key secret', secret: true },
    ],
  },
  {
    id: 'digilocker', blurb: 'Government of India platform for issuing verified digital documents.', logo: '/integrations/digilocker.svg', by: 'Ministry of Electronics and IT, Government of India', about: 'DigiLocker is the Government of India’s platform for issuing and storing verified digital documents.',
    name: 'DigiLocker', desc: 'Issue licences as verified documents', mark: 'DL', color: '#3D4FA0', uses: { lnp: 'Issue approved licences as verified documents' },
    who: 'Your IT team, with DigiLocker', needs: 'Registration as a document issuer', time: 'Usually a few weeks, while DigiLocker reviews it',
    approval: true, owner: 'DigiLocker',
    fields: [
      { key: 'contact', label: 'Contact name', example: 'Elena Garcia' },
      { key: 'email', label: 'Contact email', example: 'elena@city.gov', type: 'email' },
      { key: 'docs', label: 'Documents you’ll issue', example: 'Trade licences' },
    ],
  },
];
type System = (typeof SYSTEMS)[number];
const GUIDE = 'https://docs.digit.org';
type State = 'none' | 'requested' | 'connected';
const STATUS: Record<State, string> = { none: 'Not set up', requested: 'Waiting on approval', connected: 'Connected' };

/** The systems that fit the products in this account. */
/** The account's products a system fits, in the usual product order. */
const fitsIn = (a: Account, s: System) => PRODUCT_ORDER.filter((p) => s.uses[p] && a.products[p]?.enabled);
export const systemsFor = (a: Account) => SYSTEMS.filter((s) => fitsIn(a, s).length > 0);
/** Saved as { state, fields }; an older plain `true` counts as connected. */
export const stateOf = (a: Account, id: string): State => {
  const v = a.integrations?.[id];
  if (!v) return 'none';
  return v === true ? 'connected' : v.state;
};
/** Where a connection is used: what they chose, or every product it fits. */
const usedIn = (a: Account, s: System): Product[] => {
  const v = a.integrations?.[s.id];
  const fit = fitsIn(a, s);
  return v && v !== true && v.products ? v.products.filter((p) => fit.includes(p)) : fit;
};
const names = (ps: Product[]) => ps.map((p) => PRODUCT_FULL_NAME[p]).join(', ');
const fieldsOf = (a: Account, id: string): Record<string, string> => {
  const v = a.integrations?.[id];
  return v && v !== true ? v.fields : {};
};

/** The Integrations page, laid out like Notification channels and Geographies: a band with "Add integrations",
 *  your integrations as cards (details as label / value rows, one Edit action), and an add flow that picks the
 *  systems first, then takes each one's details on one page. */
export function Integrations() {
  const { account, params, go } = useAccount();
  const systems = systemsFor(account);
  const left = systems.filter((s) => stateOf(account, s.id) === 'none');
  // Opened from Home for one system: add it if it's not set up yet, otherwise edit it
  const fromHome = params.setup && systems.some((s) => s.id === params.setup) ? params.setup : undefined;
  const homeIsSetUp = !!fromHome && stateOf(account, fromHome) !== 'none';
  const [adding, setAdding] = useState<boolean>(!!fromHome && !homeIsSetUp);
  const [editing, setEditing] = useState<string | null>(homeIsSetUp ? fromHome! : null);
  // The integration chosen in the catalogue, being set up
  const [picking, setPicking] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [view, setView] = useState<'cards' | 'map'>('cards');
  const [iq, setIq] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) first.current = false;
    else if (!adding && !editing) heading.current?.focus();
  }, [adding, editing]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const toastEl = (
    <div className="cg-toast" role="status" aria-live="polite">
      {toast && <Toast type="success" label={toast} onClose={() => setToast('')} />}
    </div>
  );
  const trail = [{ label: 'Home', onClick: () => go('home') }, { label: 'Integrations', onClick: () => { setAdding(false); setEditing(null); } }];
  const done = (message?: string) => {
    setAdding(false);
    setEditing(null);
    if (message) setToast(message);
  };

  const spec = systems.find((s) => s.id === editing);
  if (spec)
    return (
      <div className="geo is-creating">
        <IntegrationFlow trail={trail} systems={[spec]} edit onClose={done} />
        {toastEl}
      </div>
    );
  // Setting one up: straight from Home, or from "Add integration to account" in the catalogue
  if (adding && left.length && (fromHome || picking))
    return (
      <div className="geo is-creating">
        <IntegrationFlow
          trail={[...trail, ...(picking ? [{ label: 'Add integration', onClick: () => setPicking(null) }] : [])]}
          systems={left}
          preselect={picking ?? (homeIsSetUp ? undefined : fromHome)}
          onClose={(m) => {
            setPicking(null);
            done(m);
          }}
        />
        {toastEl}
      </div>
    );
  const setUpCount = systems.filter((s) => stateOf(account, s.id) !== 'none').length;
  // First visit (nothing added yet), or Add integrations: the catalogue
  if (!setUpCount || adding)
    return (
      <>
        <Catalogue
          systems={systems}
          first={!setUpCount}
          onBack={setUpCount ? () => setAdding(false) : undefined}
          onAdd={(id) => {
            setAdding(true);
            setPicking(id);
          }}
          onEdit={(id) => {
            setAdding(false);
            setEditing(id);
          }}
        />
        {toastEl}
      </>
    );

  // Connected first, then waiting on approval, then the ones not set up
  const rank = { connected: 0, requested: 1, none: 2 } as const;
  const sorted = [...systems].filter((s) => !iq.trim() || `${s.name} ${s.by} ${s.desc}`.toLowerCase().includes(iq.trim().toLowerCase())).sort((a, b) => rank[stateOf(account, a.id)] - rank[stateOf(account, b.id)]);
  const setUp = systems.filter((s) => stateOf(account, s.id) !== 'none');

  return (
    <div className="geo is-overview">
      <header className="geo-head geo-band">
        <div className="geo-band-text">
          <h1 ref={heading} tabIndex={-1}>
            Integrations
          </h1>
          <p className="geo-lead">
            An integration connects DIGIT to a system you already use. Each one is set up once for the account and used by the products you choose. Some need approval from
            the system’s owner, which can take a few weeks, so request them early.
          </p>
        </div>
        {left.length > 0 && <Button variation="primary" icon="Add" label="Add integrations" onClick={() => setAdding(true)} />}
      </header>
      <div className="geo-bar">
        <h2 className="geo-section-h">
          Your integrations <span className="geo-section-n">{setUp.length}</span>
        </h2>
        <div className="geo-tools is-end">
          <div className="geo-search ig-search">
            <label htmlFor="ig-q" className="ux-visually-hidden">
              Search integrations
            </label>
            <Icon name="Search" size={20} />
            <input id="ig-q" type="search" placeholder="Search by name" value={iq} onChange={(e) => setIq(e.target.value)} />
          </div>
          <div className="geo-view" role="group" aria-label="View as">
            <button type="button" aria-pressed={view === 'cards'} onClick={() => setView('cards')}>
              <Icon name="GridView" size={18} />
              Cards
            </button>
            <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>
              <MapIcon />
              Network
            </button>
          </div>
        </div>
      </div>
      {view === 'map' ? (
        <AccountMap systems={sorted} onOpen={(id) => (stateOf(account, id) === 'none' ? (setAdding(true), go('integrations', { setup: id })) : setEditing(id))} />
      ) : (
      <ul className="geo-cards">
        {sorted.map((s) => {
          const st = stateOf(account, s.id);
          const saved = fieldsOf(account, s.id);
          const first = s.fields[0];
          return (
            <li key={s.id} className={`geo-card${st === 'none' ? ' is-off' : ''}`}>
              <div className="geo-card-top">
                <span className="ig-logo-box">
                  <img src={s.logo} alt="" />
                </span>
                <span className={`geo-status${st === 'connected' ? ' is-active' : st === 'requested' ? ' is-pending' : ''}`}>{STATUS[st]}</span>
              </div>
              <h3 className="geo-card-h">{s.name}</h3>
              {st !== 'none' && (
                <dl className="ch-fields ig-fields">
                  {st === 'connected' && !first.secret && (
                    <div>
                      <dt>{first.label}</dt>
                      <dd className="is-cut" title={saved[first.key]}>{saved[first.key] || '—'}</dd>
                    </div>
                  )}
                  {st === 'requested' && (
                    <div>
                      <dt>Waiting on</dt>
                      <dd>{s.owner}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Used in</dt>
                    <dd>{names(usedIn(account, s))}</dd>
                  </div>
                </dl>
              )}
              {st !== 'none' && (
                <div className="geo-actions is-edit">
                  <Button
                    variation="secondary"
                    icon={st === 'connected' ? 'Edit' : undefined}
                    label={st === 'connected' ? 'Edit integration details' : 'View request'}
                    ariaLabel={`${st === 'connected' ? 'Edit integration details for' : 'View request for'} ${s.name}`}
                    onClick={() => setEditing(s.id)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      )}
      {toastEl}
    </div>
  );
}

/** A product's Integrations section: the same words, tags and setup as the Integrations page, seen from the
 *  product. The product node is wired to each integration that fits it; selecting a set-up integration
 *  turns "In use" on or off here, and "Set up" opens the same setup and comes back. */
export function ProductIntegrations({ p }: { p: Product }) {
  const { account, update, go } = useAccount();
  const product = PRODUCT_FULL_NAME[p];
  const systems = systemsFor(account).filter((s) => s.uses[p]);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [setting, setSetting] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [note, setNote] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  const toastEl = (
    <div className="cg-toast" role="status" aria-live="polite">
      {toast && <Toast type="success" label={toast} onClose={() => setToast('')} />}
    </div>
  );

  const spec = systems.find((s) => s.id === setting);
  if (spec)
    return (
      <div className="geo is-creating">
        <IntegrationFlow
          trail={[
            { label: 'Home', onClick: () => go('home') },
            { label: product, onClick: () => go('product', { product: p, section: 'overview' }) },
            { label: 'Integrations', onClick: () => setSetting(null) },
          ]}
          systems={[spec]}
          edit={stateOf(account, spec.id) !== 'none'}
          preselect={spec.id}
          onClose={(m) => {
            setSetting(null);
            if (m) setToast(m);
            window.setTimeout(() => heading.current?.focus(), 0);
          }}
        />
        {toastEl}
      </div>
    );

  const inUse = (s: System) => stateOf(account, s.id) !== 'none' && usedIn(account, s).includes(p);
  const toggle = (s: System) => {
    const now = usedIn(account, s);
    const on = now.includes(p);
    if (on && now.length === 1) {
      setNote(`${s.name} has to be used in at least one product. To stop using it everywhere, disconnect it on the Integrations page.`);
      return;
    }
    setNote('');
    const next = on ? now.filter((x) => x !== p) : PRODUCT_ORDER.filter((x) => x === p || now.includes(x));
    update((a) => {
      const v = a.integrations?.[s.id];
      const base = v && v !== true ? v : { state: 'connected' as const, fields: {} };
      return { ...a, integrations: { ...a.integrations, [s.id]: { ...base, products: next } } };
    });
    setToast(on ? `${s.name} is no longer used in ${product}` : `${s.name} is now used in ${product}`);
  };
  const count = systems.filter(inUse).length;
  const action = (s: System) => (s.approval ? 'Request setup' : 'Set up');

  // Rows and wires: same sizes as "Use it in"
  const ROW = 76, GAP = 12, W = 120;
  const H = Math.max(ROW, systems.length * ROW + (systems.length - 1) * GAP);
  const mid = H / 2;

  return (
    <div className="geo is-overview">
      <header className="geo-head geo-band">
        <div className="geo-band-text">
          <p className="ig-eyebrow">{product}</p>
          <h1 ref={heading} tabIndex={-1}>
            Integrations
          </h1>
          <p className="geo-lead">
            These are the integrations {product} can use. Each one is set up once for the account, so turning it on here
            reuses the same connection. Some need approval from the system’s owner, which can take a few weeks.
          </p>
        </div>
        <Button variation="secondary" label="Manage all integrations" onClick={() => go('integrations')} />
      </header>
      <div className="geo-bar">
        <h2 className="geo-section-h">
          In use in {product} <span className="geo-section-n">{count}</span>
        </h2>
        <div className="geo-tools is-end">
          <div className="geo-view" role="group" aria-label="View as">
            <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>
              <MapIcon />
              Network
            </button>
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
              <Icon name="List" size={18} />
              List
            </button>
          </div>
        </div>
      </div>
      {note && (
        <p className="ig-note" role="alert">
          <Icon name="Info" size={18} />
          {note}
        </p>
      )}
      {!systems.length ? (
        <p className="ig-empty">There are no integrations for {product} yet.</p>
      ) : view === 'map' ? (
        <section className="ig-map-view" aria-label={`Integrations for ${product}`}>
          <div className="ig-map-legend" aria-hidden="true">
            <span><i className="is-on" /> In use</span>
            <span><i className="is-wait" /> Waiting on approval</span>
            <span><i className="is-off" /> Not used</span>
          </div>
          <div className="ig-nodes is-product" style={{ ['--h' as string]: `${H}px` }}>
            <div className="ig-node ig-node-src">
              <span className="ig-use-icon" aria-hidden="true">
                <Icon name={PRODUCTS[p].icon} size={20} />
              </span>
              <strong>{product}</strong>
              <span>
                {count} of {systems.length} integrations
              </span>
            </div>
            <svg className="ig-wires" viewBox={`0 0 ${W} ${H}`} width={W} height={H} preserveAspectRatio="none" aria-hidden="true" focusable="false">
              {systems.map((s, i) => {
                const y = i * (ROW + GAP) + ROW / 2;
                const st = stateOf(account, s.id);
                const on = inUse(s);
                const cls = on ? (st === 'requested' ? 'is-wait' : 'is-on') : '';
                return (
                  <g key={s.id}>
                    <path d={`M0,${mid} C${W / 2},${mid} ${W / 2},${y} ${W},${y}`} fill="none" className={cls} strokeDasharray={on && st === 'connected' ? undefined : on ? '6 5' : '5 5'} />
                    <circle cx={W - 3} cy={y} r={4} className={cls} />
                  </g>
                );
              })}
              <circle cx={3} cy={mid} r={4} className="is-on" />
            </svg>
            <div className="ig-node-list">
              {systems.map((s) => {
                const st = stateOf(account, s.id);
                const on = inUse(s);
                const body = (
                  <>
                    <span className="geo-icon ig-mark is-sm" aria-hidden="true">
                      {s.mark}
                    </span>
                    <span className="ig-use-text">
                      <strong>{s.name}</strong>
                      <span>{s.uses[p]}</span>
                    </span>
                    <span className={`geo-status${st === 'connected' ? ' is-active' : st === 'requested' ? ' is-pending' : ''}`}>{STATUS[st]}</span>
                  </>
                );
                return st === 'none' ? (
                  <div key={s.id} className="ig-node ig-node-dst is-static is-off">
                    {body}
                    <Button variation="primary" size="small" label={action(s)} ariaLabel={`${action(s)} for ${s.name}`} onClick={() => setSetting(s.id)} />
                  </div>
                ) : (
                  <label key={s.id} className={`ig-node ig-node-dst${on ? ' is-on' : ''}`}>
                    <input type="checkbox" className="ux-visually-hidden" checked={on} onChange={() => toggle(s)} aria-label={`Use ${s.name} in ${product}`} />
                    {body}
                    <span className={`ig-node-state${on ? ' is-on' : ''}`}>{on ? 'In use' : 'Not used'}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <div className="geo-table-wrap">
          <table className="geo-table">
            <thead>
              <tr>
                <th scope="col">Integration</th>
                <th scope="col">In {product}</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {systems.map((s) => {
                const st = stateOf(account, s.id);
                const on = inUse(s);
                return (
                  <tr key={s.id}>
                    <th scope="row">
                      <span className="ig-row-name">
                        <span className="geo-icon ig-mark is-sm" aria-hidden="true">
                          {s.mark}
                        </span>
                        {s.name}
                      </span>
                    </th>
                    <td>{s.uses[p]}</td>
                    <td>
                      <span className={`geo-status${st === 'connected' ? ' is-active' : st === 'requested' ? ' is-pending' : ''}`}>{STATUS[st]}</span>
                    </td>
                    <td>
                      <div className="geo-row-actions">
                        {st === 'none' ? (
                          <Button variation="primary" size="small" label={action(s)} ariaLabel={`${action(s)} for ${s.name}`} onClick={() => setSetting(s.id)} />
                        ) : (
                          <label className="ig-switch">
                            <input type="checkbox" checked={on} onChange={() => toggle(s)} />
                            <span className="ig-switch-track" aria-hidden="true" />
                            <span>{on ? 'In use' : 'Not used'}</span>
                            <span className="ux-visually-hidden"> in {product} for {s.name}</span>
                          </label>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {toastEl}
    </div>
  );
}

/** The catalogue: every integration for the account's products, laid out like "Select your geographies"
 *  (heading, search, Cards / List). Each card opens a page about the integration, whose footer adds it. */
function Catalogue({
  systems,
  first,
  onBack,
  onAdd,
  onEdit,
}: {
  systems: readonly System[];
  first: boolean;
  onBack?: () => void;
  onAdd: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const { account, go } = useAccount();
  const uid = useId();
  const [q, setQ] = useState('');
  const [reading, setReading] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const homeCrumb = { label: 'Home', onClick: () => go('home') };
  const igCrumb = first ? [] : [{ label: 'Integrations', onClick: onBack }];
  const term = q.trim().toLowerCase();
  const hits = systems.filter((s) => (!term || `${s.name} ${s.by} ${s.desc}`.toLowerCase().includes(term)));

  const spec = systems.find((s) => s.id === reading);

  return (
    <div className="geo">
      <Crumbs items={[homeCrumb, ...igCrumb, { label: 'Add integration' }]} />
      <header className="geo-head">
        <h1 ref={heading} tabIndex={-1}>
          Add integration
        </h1>
        <p className="geo-lead">Select an integration and connect it to your account.</p>
      </header>
      <div className="geo-bar">
        <div className="geo-tools">
          <div className="geo-search">
            <label htmlFor={`${uid}-q`} className="ux-visually-hidden">
              Search integrations
            </label>
            <Icon name="Search" size={20} />
            <input id={`${uid}-q`} type="search" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </div>
      <p className="ux-visually-hidden" role="status">
        {term ? `${hits.length} ${hits.length === 1 ? 'integration' : 'integrations'} found` : `${systems.length} integrations you can add`}
      </p>
      {!hits.length ? (
        <div className="geo-empty">
          <h2>No integrations found</h2>
          <p>Nothing matches “{q.trim()}”. Try another search.</p>
        </div>
      ) : (
        <ul className="geo-cards ig-cat">
          {hits.map((s) => {
            const st = stateOf(account, s.id);
            return (
              <li key={s.id}>
                <button type="button" className="ig-cat-card" aria-haspopup="dialog" onClick={() => setReading(s.id)}>
                  {st !== 'none' && (
                    <span className={`geo-status ig-cat-state${st === 'connected' ? ' is-active' : ' is-pending'}`}>{STATUS[st]}</span>
                  )}
                  <span className="ig-cat-logo">
                    <img src={s.logo} alt="" />
                  </span>
                  <strong className="ig-cat-name">{s.name}</strong>
                  <span className="ig-cat-desc">{s.blurb}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {spec && (
        <IntegrationDialog
          system={spec}
          onClose={() => setReading(null)}
          onAdd={() => onAdd(spec.id)}
          onEdit={() => onEdit(spec.id)}
        />
      )}
    </div>
  );
}

/** An integration's details in a popup, laid out like the attendance "What is an attendance register?" popup:
 *  centred logo and title, the description in a grey box, then sections split by dividers (Used for, What it
 *  takes) with small grey cards and blue label tags, and one full-width button. A native modal dialog: focus
 *  moves in, Escape or the close button shuts it, and focus goes back to the card that opened it. */
function IntegrationDialog({ system: s, onClose, onAdd, onEdit }: { system: System; onClose: () => void; onAdd: () => void; onEdit: () => void }) {
  const { account } = useAccount();
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const st = stateOf(account, s.id);
  useEffect(() => {
    opener.current = document.activeElement;
    ref.current?.showModal();
  }, []);
  const close = () => {
    ref.current?.close();
    const back = opener.current as HTMLElement | null;
    onClose();
    // Back to the card that opened it, once the dialog has gone
    window.setTimeout(() => back?.focus(), 0);
  };
  return createPortal(
    <dialog
      ref={ref}
      className="ag ig-dlg"
      aria-labelledby={`${uid}-h`}
      aria-describedby={`${uid}-d`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        // A click on the dimmed backdrop closes it
        if (e.target === ref.current) close();
      }}
    >
      <button type="button" className="ig-dlg-x" aria-label="Close" onClick={close}>
        <Icon name="Close" size={20} />
      </button>
      <div className="ig-dlg-body">
        {/* Logo on the left, name and maker beside it, the description underneath */}
        <div className="ig-dlg-top">
          <span className="ig-dlg-logo">
            <img src={s.logo} alt="" />
          </span>
          <div className="ig-dlg-top-text">
            <h2 id={`${uid}-h`} className="ig-dlg-h">
              {s.name}
            </h2>
            <p className="ig-dlg-by">
              By {s.by}
              {st !== 'none' && (
                <span className={`geo-status${st === 'connected' ? ' is-active' : ' is-pending'}`}>{STATUS[st]}</span>
              )}
            </p>
          </div>
        </div>
        <p id={`${uid}-d`} className="ig-dlg-desc">
          {s.about}
        </p>
        <a className="ig-guide ig-dlg-guide" href={s.guide ?? GUIDE} target="_blank" rel="noreferrer">
          <Icon name="MenuBook" size={18} />
          {s.name} setup guide
          <span className="ux-visually-hidden"> (opens in a new tab)</span>
        </a>

        <hr className="ig-dlg-rule" />
        <section aria-labelledby={`${uid}-uses`}>
          <h3 id={`${uid}-uses`}>Used for</h3>
          <p className="ig-dlg-sub">It works with these products in your account:</p>
          <ul className="ig-dlg-tags">
            {fitsIn(account, s).map((p) => (
              <li key={p} className="ig-dlg-tag" title={s.uses[p]}>
                <Icon name={PRODUCTS[p].icon} size={16} />
                {PRODUCT_FULL_NAME[p]}
              </li>
            ))}
          </ul>
        </section>

        <hr className="ig-dlg-rule" />
        <section aria-labelledby={`${uid}-takes`}>
          <h3 id={`${uid}-takes`}>What it takes</h3>
          {/* A small card each: who, what, how long */}
          <ul className="ig-dlg-facts">
            {(
              [
                ['Group', 'Who usually does this?', s.who],
                ['Assignment', 'What will you need?', s.needs],
                ['Schedule', 'How long does it take?', s.time],
              ] as const
            ).map(([icon, label, value]) => (
              <li key={label} className="ig-dlg-fact">
                <span className="ig-dlg-fact-icon" aria-hidden="true">
                  <Icon name={icon} size={20} />
                </span>
                <span className="ig-dlg-label">{label}</span>
                <span className="ig-dlg-fact-value">{value}</span>
              </li>
            ))}
          </ul>
          {s.approval && (
            <p className="ig-dlg-box ig-dlg-approval">
              <strong>Needs approval.</strong> {s.name} can be used once {s.owner} approves it. Adding it sends them a request.
            </p>
          )}
        </section>

        <div className="ig-dlg-cta">
          {st === 'none' ? (
            <Button variation="primary" label="Add integration to account" onClick={onAdd} />
          ) : (
            <Button variation="primary" label={st === 'connected' ? 'Edit integration details' : 'View request'} onClick={onEdit} />
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

/** How Home's integrations card lays its items out. A widget setting will let admins choose later. */
export type IntegrationsView = 'cards' | 'connections' | 'list';

/** Home's integrations card: each integration for the account's products with its logo and status, and
 *  one action to the Integrations page (setup happens there, not on Home). */
export function IntegrationsSummary({ view = 'cards' }: { view?: IntegrationsView }) {
  const { account, go } = useAccount();
  const [only, setOnly] = useState<'all' | 'connected' | 'requested'>('all');
  const all = systemsFor(account);
  // Only the ones set up (connected or waiting on approval); the rest are on the Integrations page
  const setUpList = all.filter((s) => stateOf(account, s.id) !== 'none');
  const systems = setUpList.filter((s) => only === 'all' || stateOf(account, s.id) === only);
  const setUp = setUpList.length;
  return (
    <>
      {setUp > 0 && (
        <div className="geo-view ig-filter" role="group" aria-label="Show integrations">
          {(['all', 'connected', 'requested'] as const).map((k) => (
            <button key={k} type="button" aria-pressed={only === k} onClick={() => setOnly(k)}>
              {k === 'all' ? 'All' : STATUS[k]}
            </button>
          ))}
        </div>
      )}
      {!systems.length ? (
        !setUp ? (
          // Nothing set up yet: a few of the systems they could connect, as a nudge
          <div className="ig-empty">
            <ul className="ig-empty-logos" aria-hidden="true">
              {all.slice(0, 4).map((s) => (
                <li key={s.id} className="ig-logo-box">
                  <img src={s.logo} alt="" />
                </li>
              ))}
            </ul>
            <p className="ig-empty-h">No integrations yet</p>
            <p className="ig-empty-p">
              Connect the systems you already use, like {all.slice(0, 2).map((s) => s.name).join(' or ')}, so your products can share data with them.
            </p>
          </div>
        ) : (
          <p className="ig-empty-mini">
            <Icon name="Info" size={18} />
            {only === 'connected' ? 'None connected yet.' : 'None waiting on approval.'}
          </p>
        )
      ) : view === 'connections' ? (
        <MiniConnections systems={systems} />
      ) : (
      <ul className={`ig-sum${view === 'cards' ? ' is-cards' : ''}`}>
        {systems.map((s) => {
          const st = stateOf(account, s.id);
          return (
            <li key={s.id} className={`ig-sum-item${st === 'none' ? ' is-off' : ''}`}>
              <span className="ig-logo-box">
                <img src={s.logo} alt="" />
              </span>
              <span className="ig-sum-text">
                <strong>{s.name}</strong>
                <span className={`geo-status${st === 'connected' ? ' is-active' : st === 'requested' ? ' is-pending' : ''}`}>{STATUS[st]}</span>
              </span>
            </li>
          );
        })}
      </ul>
      )}
      <div className="ig-sum-foot">
        <Button variation={setUp ? 'secondary' : 'primary'} label={setUp ? 'Manage integrations' : 'Add integration'} icon="ArrowForward" isSuffix onClick={() => go('integrations')} />
      </div>
    </>
  );
}

/** Home's connection view: each product wired to the integrations it uses. Connected wires are solid green,
 *  waiting on approval dashed amber; integrations not set up have no wires and are dimmed. */
function MiniConnections({ systems, only }: { systems: readonly System[]; only?: Product }) {
  const { account } = useAccount();
  const products = PRODUCT_ORDER.filter((p) => account.products[p]?.enabled && (!only || p === only));
  const PR = 64, PG = 12, IR = 56, IG = 10, W = 72;
  const pH = products.length * PR + (products.length - 1) * PG;
  const iH = systems.length * IR + (systems.length - 1) * IG;
  const H = Math.max(pH, iH);
  const py = (i: number) => (H - pH) / 2 + i * (PR + PG) + PR / 2;
  const iy = (i: number) => (H - iH) / 2 + i * (IR + IG) + IR / 2;
  const used = (s: System) => (stateOf(account, s.id) === 'none' ? [] : usedIn(account, s));
  const wires = systems.flatMap((s, i) => used(s).filter((p) => products.includes(p)).map((p) => ({ key: `${s.id}-${p}`, y1: py(products.indexOf(p)), y2: iy(i), wait: stateOf(account, s.id) === 'requested' })));
  const curve = (y1: number, y2: number) => `M0,${y1} C${W / 2},${y1} ${W / 2},${y2} ${W},${y2}`;
  return (
    <div className="ig-map2 ig-mini" style={{ ['--h' as string]: `${H}px` }}>
      <ul className="ig-map2-col" style={{ paddingTop: (H - pH) / 2, gap: PG }} aria-label="Your products">
        {products.map((p) => (
          <li key={p} className="ig-mini-product" style={{ height: PR }}>
            <span className="ig-use-icon" aria-hidden="true">
              <Icon name={PRODUCTS[p].icon} size={18} />
            </span>
            <strong>{PRODUCT_FULL_NAME[p]}</strong>
          </li>
        ))}
      </ul>
      <svg className="ig-map2-wires" viewBox={`0 0 ${W} ${H}`} width={W} height={H} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {wires.map((w) => (
          <path key={w.key} d={curve(w.y1, w.y2)} fill="none" className={w.wait ? 'is-wait' : 'is-on'} strokeDasharray={w.wait ? '6 5' : undefined} />
        ))}
      </svg>
      <ul className="ig-map2-col" style={{ paddingTop: (H - iH) / 2, gap: IG }} aria-label="Integrations">
        {systems.map((s) => {
          const st = stateOf(account, s.id);
          const u = used(s);
          return (
            <li key={s.id} className={`ig-mini-int${st === 'none' ? ' is-off' : ''}`} style={{ height: IR }}>
              <span className="ig-logo-box is-xs">
                <img src={s.logo} alt="" />
              </span>
              <span className="ig-map-node-text">
                <strong>{s.name}</strong>
                <span className={`ig-map2-st is-${st}`}>{STATUS[st]}</span>
              </span>
              <span className="ux-visually-hidden">{u.length ? `, used in ${names(u)}` : ''}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** A small node-map glyph for the Map view button (the library set has none). */
function MapIcon() {
  return (
    <span className="ux-icon" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2.5" y="9" width="6" height="6" rx="1.5" />
        <rect x="15.5" y="3" width="6" height="6" rx="1.5" />
        <rect x="15.5" y="15" width="6" height="6" rx="1.5" />
        <path d="M8.5 12h3.5M12 12c0-3 1-6 3.5-6M12 12c0 3 1 6 3.5 6" />
      </svg>
    </span>
  );
}

/** Map view: DIGIT wired to each product, and each product wired to the integrations it uses. Connected wires
 *  are solid, waiting on approval are dashed amber; integrations not set up have no wires and are dimmed.
 *  Each integration node opens its details (or its setup). */
function AccountMap({ systems, only, onOpen }: { systems: readonly System[]; only?: Product; onOpen: (id: string) => void }) {
  const { account } = useAccount();
  const products = PRODUCT_ORDER.filter((p) => account.products[p]?.enabled && (!only || p === only));
  const PR = 84, PG = 24, IR = 64, IG = 14, W1 = 120, W2 = 150, DH = 120;
  const pH = products.length * PR + (products.length - 1) * PG;
  const iH = systems.length * IR + (systems.length - 1) * IG;
  const H = Math.max(pH, iH, DH);
  const py = (i: number) => (H - pH) / 2 + i * (PR + PG) + PR / 2;
  const iy = (i: number) => (H - iH) / 2 + i * (IR + IG) + IR / 2;
  const used = (s: System) => (stateOf(account, s.id) === 'none' ? [] : usedIn(account, s));
  const wires = systems.flatMap((s, i) => used(s).filter((p) => products.includes(p)).map((p) => ({ key: `${s.id}-${p}`, y1: py(products.indexOf(p)), y2: iy(i), wait: stateOf(account, s.id) === 'requested' })));
  const curve = (x: number, y1: number, y2: number) => `M0,${y1} C${x / 2},${y1} ${x / 2},${y2} ${x},${y2}`;
  // Moving dots show the connections are live; none for people who prefer reduced motion
  const moving = typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <section className="ig-map-view ig-map2" aria-label="How DIGIT, your products and your integrations connect">
      {/* The legend, in its own box */}
      <div className="ig-map2-legend" aria-hidden="true">
        <span><i className="is-digit" /> DIGIT to product</span>
        <span><i className="is-on" /> Connected</span>
        <span><i className="is-wait" /> Waiting on approval</span>
      </div>
      {/* Column headings: a chip over each column, with what's in it */}
      <div className="ig-map2-heads" aria-hidden="true">
        <span className="ig-map2-head">
          <Icon name="Dashboard" size={18} />
          DIGIT
        </span>
        <span />
        <span className="ig-map2-head">
          <Icon name="Apps" size={18} />
          Your products
          <em>{products.length}</em>
        </span>
        <span />
        <span className="ig-map2-head">
          <Icon name="Extension" size={18} />
          Integrations
          <em>
            {systems.filter((s) => stateOf(account, s.id) !== 'none').length} of {systems.length} set up
          </em>
        </span>
      </div>
      <div className="ig-map2-grid" style={{ ['--h' as string]: `${H}px` }}>
        <div className="ig-map2-col" style={{ paddingTop: (H - DH) / 2 }}>
          <div className="ig-map2-digit">
            <img src="/digit-logo.png" alt="DIGIT" />
            <span>{products.length === 1 ? '1 product' : `${products.length} products`}</span>
          </div>
        </div>
        <svg className="ig-map2-wires" viewBox={`0 0 ${W1} ${H}`} width={W1} height={H} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {products.map((p, i) => (
            <g key={p}>
              <path d={curve(W1, H / 2, py(i))} className="is-digit" fill="none" />
              {/* A dot travelling along the wire (not for reduced motion) */}
              {moving && (
                <circle r={3.5} className="ig-dot is-digit">
                  <animateMotion dur={`${2.4 + i * 0.3}s`} repeatCount="indefinite" path={curve(W1, H / 2, py(i))} />
                </circle>
              )}
            </g>
          ))}
        </svg>
        <ul className="ig-map2-col" style={{ paddingTop: (H - pH) / 2, gap: PG }}>
          {products.map((p) => {
            const n = systems.filter((s) => used(s).includes(p)).length;
            return (
              <li key={p} className="ig-map2-product" style={{ height: PR }}>
                <span className="ig-use-icon" aria-hidden="true">
                  <Icon name={PRODUCTS[p].icon} size={22} />
                </span>
                <span className="ig-map-node-text">
                  <strong>{PRODUCT_FULL_NAME[p]}</strong>
                  <span>{n === 1 ? '1 integration' : `${n} integrations`}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <svg className="ig-map2-wires" viewBox={`0 0 ${W2} ${H}`} width={W2} height={H} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {wires.map((w) => (
            <g key={w.key}>
              <path d={curve(W2, w.y1, w.y2)} fill="none" className={w.wait ? 'is-wait' : 'is-on'} strokeDasharray={w.wait ? '6 5' : undefined} />
              {!w.wait && moving && (
                <circle r={3.5} className="ig-dot is-on">
                  <animateMotion dur="2.8s" repeatCount="indefinite" path={curve(W2, w.y1, w.y2)} />
                </circle>
              )}
            </g>
          ))}
        </svg>
        <ul className="ig-map2-col" style={{ paddingTop: (H - iH) / 2, gap: IG }}>
          {systems.map((s) => {
            const st = stateOf(account, s.id);
            const u = used(s);
            return (
              <li key={s.id} style={{ height: IR }}>
                <button type="button" className={`ig-map2-int${st === 'none' ? ' is-off' : ''}`} onClick={() => onOpen(s.id)}>
                  <span className="ig-logo-box is-sm">
                    <img src={s.logo} alt="" />
                  </span>
                  <span className="ig-map-node-text">
                    <strong>{s.name}</strong>
                    <span className={`geo-status ig-map2-tag${st === 'connected' ? ' is-active' : st === 'requested' ? ' is-pending' : ''}`}>{STATUS[st]}</span>
                  </span>
                  <span className="ux-visually-hidden">{u.length ? `, used in ${names(u)}` : ''}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Add: pick the systems, then each one's details on one page (like adding notification channels).
 *  Edit: one system's details. Connect checks the connections, then saves; systems that need approval
 *  send a request instead. */
export function IntegrationFlow({
  trail,
  systems,
  edit,
  preselect,
  onClose,
}: {
  trail: { label: string; onClick?: () => void }[];
  systems: readonly System[];
  edit?: boolean;
  preselect?: string;
  onClose: (message?: string) => void;
}) {
  const { account, update } = useAccount();
  const uid = useId();
  const [picked, setPicked] = useState<string[]>(edit ? systems.map((s) => s.id) : preselect ? [preselect] : []);
  const [step, setStep] = useState(edit || preselect ? 1 : 0); // 0 = pick, 1 = details
  // Prototype: filled in with example details, so the flow can be clicked straight through.
  const [values, setValues] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(
      systems.map((s) => {
        const saved = fieldsOf(account, s.id);
        return [s.id, Object.keys(saved).length ? { ...saved } : Object.fromEntries(s.fields.map((f) => [f.key, f.options ? f.options[0] : f.secret ? 'example-secret' : f.example ?? '']))];
      }),
    ),
  );
  const [use, setUse] = useState<Record<string, Product[]>>(() => Object.fromEntries(systems.map((s) => [s.id, usedIn(account, s)])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  // One Connect: it checks the connections, then saves (as n8n tests on save)
  const [check, setCheck] = useState<'idle' | 'checking' | 'failed'>('idle');
  const heading = useRef<HTMLHeadingElement>(null);
  const result = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  const order = systems.filter((s) => picked.includes(s.id));
  const one = order.length === 1 ? order[0] : null;
  const st = one ? stateOf(account, one.id) : 'none';
  const needsCheck = order.some((s) => !s.approval);
  const allApproval = order.length > 0 && order.every((s) => s.approval);

  const validate = () => {
    const e: Record<string, string> = {};
    for (const s of order) {
      for (const f of s.fields) if (!f.optional && !(values[s.id]?.[f.key] ?? '').trim()) e[`${s.id}-${f.key}`] = f.options ? `Choose the ${f.label.toLowerCase()}` : `Enter the ${f.label.toLowerCase()}`;
      if (fitsIn(account, s).length > 1 && !use[s.id]?.length) e[`${s.id}-use`] = 'Choose at least one product';
    }
    setErrors(e);
    if (Object.keys(e).length) document.getElementById(`${uid}-${Object.keys(e)[0]}`)?.focus();
    return !Object.keys(e).length;
  };
  const save = () =>
    update((a) => {
      const next = { ...a.integrations };
      for (const s of order) {
        const fit = fitsIn(a, s);
        next[s.id] = { state: s.approval ? 'requested' : 'connected', fields: values[s.id] ?? {}, products: fit.length > 1 ? use[s.id] : fit };
      }
      return { ...a, integrations: next };
    });
  const message = () => {
    if (edit && one) return one.approval ? `${one.name} request updated` : `${one.name} details saved`;
    const c = order.filter((s) => !s.approval).length;
    const r = order.length - c;
    return [c ? (c === 1 && one ? `${one.name} connected` : `${c} ${c === 1 ? 'integration' : 'integrations'} connected`) : '', r ? `${r === 1 ? 'request' : `${r} requests`} sent` : '']
      .filter(Boolean)
      .join(', ')
      .replace(/^./, (x) => x.toUpperCase());
  };

  const next = () => {
    if (step === 0) {
      if (!picked.length) {
        setErrors({ pick: 'Choose at least one integration' });
        document.getElementById(`${uid}-pick`)?.focus();
        return;
      }
      setErrors({});
      return setStep(1);
    }
    if (!validate()) return;
    if (!needsCheck) {
      save();
      return onClose(message());
    }
    setCheck('checking');
    // Prototype: the check passes unless a value contains "wrong", to show the failure state
    window.setTimeout(() => {
      if (order.some((s) => !s.approval && Object.values(values[s.id] ?? {}).some((v) => /wrong/i.test(v)))) {
        setCheck('failed');
        result.current?.focus();
        return;
      }
      save();
      onClose(message());
    }, 1000);
  };
  const back = () => {
    setErrors({});
    setCheck('idle');
    if (step === 0 || edit) onClose();
    else setStep(0);
  };
  const remove = () => {
    if (!one) return;
    const ask = st === 'requested' ? `Cancel your ${one.name} request?` : `Disconnect ${one.name}? Data stops flowing between DIGIT and ${one.name}.`;
    if (!window.confirm(ask)) return;
    update((a) => {
      const n = { ...a.integrations };
      delete n[one.id];
      return { ...a, integrations: n };
    });
    onClose(st === 'requested' ? `${one.name} request cancelled` : `${one.name} disconnected`);
  };

  const title = edit && one
    ? one.approval ? `Your ${one.name} request` : `Edit ${one.name} details`
    : step === 0 ? 'Which integrations do you want to set up?' : 'Add integration details';
  // The last crumb names what's being set up
  const crumb = edit && one ? title : one ? `Set up ${one.name}` : 'Add integration';
  const primaryLabel =
    step === 0 ? 'Next'
    : check === 'checking' ? 'Connecting…'
    : edit ? (one?.approval ? 'Update request' : 'Save changes')
    : allApproval ? (order.length === 1 ? 'Send request' : 'Send requests')
    : order.some((s) => s.approval) ? 'Connect and send requests'
    : one ? `Connect ${one.name}` : 'Connect integrations';

  return (
    <div className="cg-page">
      <Crumbs items={[...trail, { label: crumb }]} />
      <section className="cg" aria-labelledby={`${uid}-h`}>
        <h1 id={`${uid}-h`} ref={heading} tabIndex={-1}>
          {title}
        </h1>
        <div className="cg-sub">
          <p>
            {step === 0
              ? 'Choose one or more. You can set up the others later.'
              : one
                ? `Add your ${one.name} account details, then choose the products that use it.`
                : 'Add each integration’s account details, then choose the products that use them.'}
          </p>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (check !== 'checking') next();
          }}
        >
          {step === 0 && (
            <fieldset className={`qz-tiles cg-tiles ch-tiles ig-tiles${errors.pick ? ' has-error' : ''}`} aria-describedby={errors.pick ? `${uid}-pick-error` : undefined}>
              <legend className="ux-visually-hidden">Which integrations do you want to set up?</legend>
              {errors.pick && (
                <p id={`${uid}-pick-error`} className="fld-error">
                  <span className="ux-visually-hidden">Error: </span>
                  {errors.pick}
                </p>
              )}
              <div className="qz-tile-row">
                {systems.map((s, i) => {
                  const on = picked.includes(s.id);
                  return (
                    <label key={s.id} className={`qz-tile${on ? ' is-on' : ''}`}>
                      <input
                        type="checkbox"
                        id={i === 0 ? `${uid}-pick` : undefined}
                        checked={on}
                        onChange={() => {
                          setPicked(on ? picked.filter((x) => x !== s.id) : [...picked, s.id]);
                          setErrors({});
                        }}
                      />
                      <span className="cg-tile-icon ig-tile-mark" aria-hidden="true">
                        {s.mark}
                      </span>
                      <span className="qz-tile-label">{s.name}</span>
                      <span className="ig-tile-desc">{s.desc}</span>
                      {s.approval && <span className="ig-tile-flag">Needs approval</span>}
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
              {order.map((s) => {
                const fit = fitsIn(account, s);
                const chosen = use[s.id] ?? [];
                return (
                  <section key={s.id} className="ch-sec ig-form" aria-labelledby={`${uid}-${s.id}-h`}>
                    <div className="ch-sec-head ig-form-head">
                      <span className="ig-logo-box">
                        <img src={s.logo} alt="" />
                      </span>
                      <div className="ch-sec-title">
                        <h2 id={`${uid}-${s.id}-h`}>{s.name}</h2>
                        <p>{s.desc}</p>
                      </div>
                    </div>
                    <div className="ch-fields-form">
                      {s.fields.map((f) => {
                        const k = `${s.id}-${f.key}`;
                        const id = `${uid}-${k}`;
                        const v = values[s.id]?.[f.key] ?? '';
                        const set = (x: string) => {
                          setValues({ ...values, [s.id]: { ...values[s.id], [f.key]: x } });
                          if (check === 'failed') setCheck('idle');
                        };
                        return (
                          <div key={k} className="cg-split">
                            <Field id={id} label={f.label} hint={f.hint} error={errors[k]} optional={f.optional}>
                              {f.options ? (
                                <Select id={id} value={v} aria-invalid={!!errors[k] || undefined} aria-describedby={describedBy(id, f.hint, errors[k])} onChange={(e) => set(e.target.value)}>
                                  <option value="">Choose</option>
                                  {f.options.map((o) => (
                                    <option key={o}>{o}</option>
                                  ))}
                                </Select>
                              ) : (
                                <input
                                  id={id}
                                  value={v}
                                  placeholder={f.secret ? '••••••••' : f.example}
                                  type={f.secret ? 'password' : f.type ?? 'text'}
                                  autoComplete={f.secret ? 'new-password' : 'off'}
                                  aria-invalid={!!errors[k] || undefined}
                                  aria-describedby={describedBy(id, f.hint, errors[k])}
                                  onChange={(e) => set(e.target.value)}
                                />
                              )}
                            </Field>
                          </div>
                        );
                      })}
                      {/* Where it's used: a multiselect of the products it fits (fixed when only one fits) */}
                      <div className="cg-split">
                        <Field
                          id={`${uid}-${s.id}-use`}
                          label="Use it in"
                          hint={fit.length > 1 ? 'One connection serves every product you choose.' : undefined}
                          error={errors[`${s.id}-use`]}
                        >
                          <ProductMultiSelect
                            id={`${uid}-${s.id}-use`}
                            options={fit}
                            value={fit.length > 1 ? chosen : fit}
                            locked={fit.length < 2}
                            describedBy={describedBy(`${uid}-${s.id}-use`, fit.length > 1 ? 'x' : undefined, errors[`${s.id}-use`])}
                            invalid={!!errors[`${s.id}-use`]}
                            onChange={(next) => {
                              setUse({ ...use, [s.id]: next });
                              if (errors[`${s.id}-use`]) setErrors({ ...errors, [`${s.id}-use`]: '' });
                            }}
                          />
                        </Field>
                      </div>
                    </div>
                  </section>
                );
              })}
              {needsCheck && (
                <p ref={result} tabIndex={-1} className={`ig-test${check === 'failed' ? ' is-error' : ''}`} role="status">
                  {check === 'checking' && 'Checking the connections…'}
                  {check === 'failed' && (
                    <>
                      <Icon name="Error" size={18} />
                      We couldn’t connect. Check the details and try again. Nothing has been saved.
                    </>
                  )}
                </p>
              )}
            </div>
          )}
          <button type="submit" className="ux-visually-hidden" tabIndex={-1} aria-hidden="true" />
        </form>
      </section>
      <footer className="cg-bar">
        <Button variation="secondary" icon="ArrowBack" label="Back" onClick={back} />
        <div className="cg-bar-end">
          {edit && one && (
            <Button variation="secondary" icon="Close" label={st === 'requested' ? 'Cancel request' : 'Disconnect'} onClick={remove} />
          )}
          <Button variation="primary" label={primaryLabel} icon={step === 0 ? 'ArrowForward' : undefined} isSuffix onClick={() => check !== 'checking' && next()} />
        </div>
      </footer>
    </div>
  );
}

/** A multiselect dropdown of products: a button showing the choice, opening a list of checkboxes.
 *  Escape or a click outside closes it; each option is a real checkbox, so keyboard and screen readers work. */
function ProductMultiSelect({
  id,
  options,
  value,
  locked,
  invalid,
  describedBy: described,
  onChange,
}: {
  id: string;
  options: Product[];
  value: Product[];
  /** Only one product fits: it's shown selected and can't be unticked. */
  locked?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onChange: (next: Product[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);
  // In the same order as the list
  const summary = value.length ? options.filter((p) => value.includes(p)).map((p) => PRODUCT_FULL_NAME[p]).join(', ') : 'Choose products';
  return (
    <div
      ref={wrap}
      className={`ig-ms${open ? ' is-open' : ''}${invalid ? ' is-invalid' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
          btn.current?.focus();
        }
      }}
    >
      <button
        ref={btn}
        type="button"
        id={id}
        className="ig-ms-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-describedby={described}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen(!open)}
      >
        <span className={`ig-ms-value${value.length ? '' : ' is-ph'}`}>{summary}</span>
        <Icon name={open ? 'ArrowDropUp' : 'ArrowDropDown'} size={24} />
      </button>
      {open && (
        <div id={`${id}-list`} className="ig-ms-list" role="group" aria-label="Products">
          {options.map((p) => {
            const on = value.includes(p);
            return (
              <label key={p} className={`ig-ms-opt${on ? ' is-on' : ''}`}>
                <input
                  type="checkbox"
                  checked={on}
                  disabled={locked}
                  onChange={() => onChange(on ? value.filter((x) => x !== p) : PRODUCT_ORDER.filter((x) => x === p || value.includes(x)))}
                />
                <span className="ig-ms-opt-text">{PRODUCT_FULL_NAME[p]}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** The map and one row per system, with Connect / Disconnect. Shared by Home and Integrations. */
/** tiles: on Home, the systems as tiles under the map (logo, name, what it's for, action). */
export function HealthStack({ tiles }: { tiles?: boolean } = {}) {
  const { account, go } = useAccount();
  const systems = systemsFor(account);
  const on: Record<string, boolean> = Object.fromEntries(systems.map((s) => [s.id, stateOf(account, s.id) === 'connected']));
  const [toastEl] = usePageToast();
  const count = systems.filter((s) => on[s.id]).length;
  // Setup takes details and a test, so the button opens it on the Integrations page
  const toggle = (id: string) => go('integrations', { setup: id });
  return (
    <>
      <HubMap systems={systems} on={on} count={count} />
      <ul className={`ig-list${tiles ? ' is-tiles' : ''}`}>
        {systems.map((s) => (
          <li key={s.id} className={`ig-item${on[s.id] ? ' is-on' : ''}`}>
            <span className="ig-logo" style={{ background: s.color }} aria-hidden="true">
              {s.mark}
            </span>
            <span className="ig-text">
              <span className="ig-name">
                <strong>{s.name}</strong>
                {/* On Home's tiles only a connection shows; "Not connected" is left off */}
                {(on[s.id] || !tiles) && (
                  <span className={`geo-status${on[s.id] ? ' is-active' : ''}`}>{on[s.id] ? 'Connected' : 'Not connected'}</span>
                )}
              </span>
              <span>{s.desc}</span>
            </span>
            <Button
              variation={on[s.id] ? 'secondary' : 'primary'}
              label={on[s.id] ? 'Manage' : 'Set up'}
              title={`${on[s.id] ? 'Manage' : 'Set up'} ${s.name}`}
              ariaLabel={`${on[s.id] ? 'Manage' : 'Set up'} ${s.name}`}
              onClick={() => toggle(s.id)}
            />
          </li>
        ))}
      </ul>
      {toastEl}
    </>
  );
}

/** DIGIT in the middle, each system wired in (alternating left and right); a connected wire is solid and coloured. */
function HubMap({ systems, on, count }: { systems: readonly System[]; on: Record<string, boolean>; count: number }) {
  const node = 40, gap = 16, hubW = 132, hubH = 48, reach = 100;
  const perSide = Math.ceil(systems.length / 2);
  // Each side only as wide as its longest name, so short lists stay full size
  const room = (names: string[]) => 24 + Math.max(0, ...names.map((n) => n.length)) * 7.2;
  const leftEdge = room(systems.filter((_, i) => i % 2 === 0).map((s) => s.name));
  const rightEdge = room(systems.filter((_, i) => i % 2 === 1).map((s) => s.name));
  const W = leftEdge + node + reach + hubW + reach + node + rightEdge;
  const H = Math.max(160, perSide * (node + gap) + 24);
  const hx = leftEdge + node + reach, hy = H / 2 - hubH / 2;
  const sideY = (k: number, n: number) => H / 2 - (n * node + (n - 1) * gap) / 2 + k * (node + gap);
  const leftN = perSide, rightN = systems.length - perSide;
  const nodes = systems.map((s, i) => {
    const left = i % 2 === 0;
    const k = Math.floor(i / 2);
    return { s, x: left ? leftEdge : W - rightEdge - node, y: sideY(k, left ? leftN : rightN) };
  });
  return (
    <div className="ig-map">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`DIGIT, with ${count} of ${systems.length} systems connected: ${systems.map((s) => `${s.name} ${on[s.id] ? 'connected' : 'not connected'}`).join(', ')}`}>
        {nodes.map(({ s, x, y }) => {
          const left = x < W / 2;
          const sx = left ? x + node : x, sy = y + node / 2;
          const tx = left ? hx : hx + hubW, ty = H / 2;
          const mx = (sx + tx) / 2;
          return (
            <path
              key={s.id}
              d={`M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`}
              fill="none"
              stroke={on[s.id] ? s.color : '#C5CBCF'}
              strokeWidth={on[s.id] ? 2.5 : 1.5}
              strokeDasharray={on[s.id] ? undefined : '5 5'}
            />
          );
        })}
        {nodes.map(({ s, x, y }) => {
          const left = x < W / 2;
          return (
            <g key={s.id} transform={`translate(${x},${y})`}>
              <rect width={node} height={node} rx={8} fill={on[s.id] ? s.color : '#fff'} stroke={on[s.id] ? s.color : '#C5CBCF'} strokeWidth={1.5} />
              <text x={node / 2} y={node / 2 + 5} textAnchor="middle" className="ig-map-mark" fill={on[s.id] ? '#fff' : s.color}>
                {s.mark}
              </text>
              <text x={left ? -10 : node + 10} y={node / 2 + 5} textAnchor={left ? 'end' : 'start'} className="ig-map-label">
                {s.name}
              </text>
            </g>
          );
        })}
        <g transform={`translate(${hx},${hy})`}>
          <rect width={hubW} height={hubH} rx={10} style={{ fill: 'var(--digitv2-lightTheme-primary-2)' }} />
          <circle cx={0} cy={hubH / 2} r={4} fill="#fff" strokeWidth={2} style={{ stroke: 'var(--digitv2-lightTheme-primary-2)' }} />
          <circle cx={hubW} cy={hubH / 2} r={4} fill="#fff" strokeWidth={2} style={{ stroke: 'var(--digitv2-lightTheme-primary-2)' }} />
          <text x={hubW / 2} y={21} textAnchor="middle" className="ig-hub-name">
            DIGIT
          </text>
          <text x={hubW / 2} y={37} textAnchor="middle" className="ig-hub-sub">
            {count} connected
          </text>
        </g>
      </svg>
    </div>
  );
}
