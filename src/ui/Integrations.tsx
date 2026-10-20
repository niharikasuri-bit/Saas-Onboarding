import { Button } from '@egovernments/digit-ui-components';
import { usePageToast } from './PageToast';
import { useAccount } from '../lib/store';

/**
 * Integrations: the health systems DIGIT plugs into. A small map with DIGIT in the middle
 * and each system wired to it (solid once connected), then one card per system.
 */
const SYSTEMS = [
  { id: 'dhis2', name: 'DHIS2', desc: 'Analytics and reporting integration', mark: 'D2', color: '#2C6693' },
  { id: 'elmis', name: 'eLMIS', desc: 'Inventory and supply chain management', mark: 'eL', color: '#00703C' },
  { id: 'mosip', name: 'MOSIP', desc: 'Digital identity integration', mark: 'MO', color: '#6A3FA0' },
] as const;
type SystemId = (typeof SYSTEMS)[number]['id'];

/** The Integrations page: its header, then the health systems in a white card. */
export function Integrations() {
  return (
    <div className="ig">
      <header className="ig-head">
        <h1>
          Built to Plug into <em>Your Health Stack</em>
        </h1>
        <p>Seamless integration with existing health information systems and infrastructure</p>
      </header>
      <section className="ig-card" aria-label="Health systems">
        <HealthStack />
      </section>
    </div>
  );
}

/** The map and one row per system, with Connect / Disconnect. Shared by Home and Integrations. */
/** tiles: on Home, the systems as tiles under the map (logo, name, what it's for, action). */
export function HealthStack({ tiles }: { tiles?: boolean } = {}) {
  const { account, update } = useAccount();
  const on = Object.fromEntries(SYSTEMS.map((s) => [s.id, !!account.integrations?.[s.id]])) as Record<SystemId, boolean>;
  const [toastEl, showToast] = usePageToast();
  const count = SYSTEMS.filter((s) => on[s.id]).length;
  const toggle = (id: SystemId, name: string) => {
    if (on[id] && !window.confirm(`Disconnect ${name}? Data stops flowing between DIGIT and ${name}.`)) return;
    update((a) => ({ ...a, integrations: { ...a.integrations, [id]: !on[id] } }));
    showToast(on[id] ? `${name} disconnected` : `${name} connected`);
  };
  return (
    <>
      <HubMap on={on} count={count} />
      <ul className={`ig-list${tiles ? ' is-tiles' : ''}`}>
        {SYSTEMS.map((s) => (
          <li key={s.id} className={`ig-item${on[s.id] ? ' is-on' : ''}`}>
            <span className="ig-logo" style={{ background: s.color }} aria-hidden="true">
              {s.mark}
            </span>
            <span className="ig-text">
              <span className="ig-name">
                <strong>{s.name}</strong>
                <span className={`geo-status${on[s.id] ? ' is-active' : ''}`}>{on[s.id] ? 'Connected' : 'Not connected'}</span>
              </span>
              <span>{s.desc}</span>
            </span>
            <Button
              variation={on[s.id] ? 'secondary' : 'primary'}
              label={on[s.id] ? 'Disconnect' : 'Connect'}
              title={`${on[s.id] ? 'Disconnect' : 'Connect'} ${s.name}`}
              onClick={() => toggle(s.id, s.name)}
            />
          </li>
        ))}
      </ul>
      {toastEl}
    </>
  );
}

/** DIGIT in the middle, each system wired in; a connected wire is solid and coloured. */
function HubMap({ on, count }: { on: Record<SystemId, boolean>; count: number }) {
  const W = 560, H = 160, hubW = 132, hubH = 48, node = 40;
  const hx = W / 2 - hubW / 2, hy = H / 2 - hubH / 2;
  const nodes = SYSTEMS.map((s, i) => ({ s, x: i === 1 ? W - 64 - node : 64, y: i === 0 ? 20 : i === 1 ? H / 2 - node / 2 : H - 20 - node }));
  return (
    <div className="ig-map">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`DIGIT, with ${count} of ${SYSTEMS.length} health systems connected: ${SYSTEMS.map((s) => `${s.name} ${on[s.id] ? 'connected' : 'not connected'}`).join(', ')}`}>
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
          <rect width={hubW} height={hubH} rx={10} fill="#0B4B66" />
          <circle cx={0} cy={hubH / 2} r={4} fill="#fff" stroke="#0B4B66" strokeWidth={2} />
          <circle cx={hubW} cy={hubH / 2} r={4} fill="#fff" stroke="#0B4B66" strokeWidth={2} />
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
