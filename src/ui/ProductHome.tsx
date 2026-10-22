import { useId, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import type { Product, Section } from '../lib/model';

/**
 * A product's landing: Overview (four numbers and how they moved since yesterday),
 * Quick actions (three cards, each with a few links into the product) and Items to
 * review (tabs over a table). Prototype figures, worded per product.
 */

type Metric = { label: string; value: string; delta: string; up: boolean };
type Action = { title: string; about: string; links: [string, Section][] };
type ReviewRow = { name: string; id: string; assigned: string; sla: number; status: 'Active' | 'Overdue' | 'Pending' };

const CONTENT: Record<Product, { metrics: Metric[]; actions: Action[]; tabs: string[]; idLabel: string; rows: ReviewRow[] }> = {
  cms: {
    metrics: [
      { label: 'Open complaints', value: '128', delta: '+12 since yesterday', up: true },
      { label: 'Resolved today', value: '34', delta: '+6 since yesterday', up: true },
      { label: 'Past their SLA', value: '9', delta: '−2 since yesterday', up: false },
      { label: 'Average time to resolve', value: '2.4 days', delta: '−0.3 since yesterday', up: false },
    ],
    actions: [
      { title: 'Complaints', about: 'Register a complaint for a citizen, or find and assign the ones waiting.', links: [['Register a complaint', 'data'], ['View all complaints', 'data'], ['Assign complaints', 'data']] },
      { title: 'Teams', about: 'Decide which department handles each complaint type, and who is in it.', links: [['Departments', 'departments'], ['Users and roles', 'users'], ['Escalation rules', 'departments']] },
      { title: 'Messages', about: 'Choose what citizens hear at each step, in the languages they use.', links: [['Notifications', 'notifications'], ['Message wording', 'translations'], ['Languages', 'translations']] },
    ],
    tabs: ['Waiting to be assigned', 'Past SLA', 'Reopened', 'Escalated'],
    idLabel: 'Complaint ID',
    rows: [
      { name: 'Wanjiru Kamau', id: 'CMP-10234', assigned: 'Westlands', sla: 15, status: 'Active' },
      { name: 'Otieno Odhiambo', id: 'CMP-10241', assigned: 'Kibra', sla: 9, status: 'Active' },
      { name: 'Achieng Wafula', id: 'CMP-10257', assigned: 'Langata', sla: 2, status: 'Overdue' },
      { name: 'Kiprop Rono', id: 'CMP-10263', assigned: 'Kasarani', sla: 22, status: 'Pending' },
    ],
  },
  hcm: {
    metrics: [
      { label: 'Households registered', value: '12,480', delta: '+640 since yesterday', up: true },
      { label: 'Doses delivered', value: '31,905', delta: '+1,820 since yesterday', up: true },
      { label: 'Coverage', value: '68%', delta: '+4% since yesterday', up: true },
      { label: 'Field workers active', value: '214', delta: '−6 since yesterday', up: false },
    ],
    actions: [
      { title: 'Campaign', about: 'Check the plan, targets and the areas this campaign covers.', links: [['Campaign data', 'data'], ['Targets by area', 'data'], ['Delivery plan', 'data']] },
      { title: 'Field team', about: 'See who is working, and add or move field workers.', links: [['Users and roles', 'users'], ['Add field workers', 'users'], ['Teams by area', 'users']] },
      { title: 'Messages', about: 'Reminders and updates for households and field workers.', links: [['Notifications', 'notifications'], ['Message wording', 'translations'], ['Languages', 'translations']] },
    ],
    tabs: ['Waiting for approval', 'Stock alerts', 'Sync errors', 'Flagged'],
    idLabel: 'Registration ID',
    rows: [
      { name: 'Amina Yusuf', id: 'REG-10234', assigned: 'Kano North', sla: 15, status: 'Active' },
      { name: 'Ibrahim Musa', id: 'REG-10239', assigned: 'Kano South', sla: 12, status: 'Active' },
      { name: 'Fatima Bello', id: 'REG-10246', assigned: 'Dala', sla: 3, status: 'Overdue' },
      { name: 'Sani Abdullahi', id: 'REG-10252', assigned: 'Fagge', sla: 20, status: 'Pending' },
    ],
  },
  lnp: {
    metrics: [
      { label: 'Applications received', value: '86', delta: '+9 since yesterday', up: true },
      { label: 'Approved', value: '41', delta: '+5 since yesterday', up: true },
      { label: 'Waiting for inspection', value: '17', delta: '−3 since yesterday', up: false },
      { label: 'Fees collected', value: '₹4.2 lakh', delta: '+₹38,000 since yesterday', up: true },
    ],
    actions: [
      { title: 'Applications', about: 'Review new applications, and approve or send them back.', links: [['View applications', 'data'], ['Licence types', 'data'], ['Renewals', 'data']] },
      { title: 'Inspections', about: 'Assign inspectors and check what is due this week.', links: [['Inspection schedule', 'data'], ['Inspectors', 'users'], ['Checklists', 'data']] },
      { title: 'Messages', about: 'What applicants hear when their licence moves to the next stage.', links: [['Notifications', 'notifications'], ['Message wording', 'translations'], ['Languages', 'translations']] },
    ],
    tabs: ['Waiting for review', 'Inspection due', 'Payment due', 'Renewals'],
    idLabel: 'Application ID',
    rows: [
      { name: 'Priya Sharma', id: 'APP-10234', assigned: 'Ward 4', sla: 15, status: 'Active' },
      { name: 'Rahul Verma', id: 'APP-10238', assigned: 'Ward 7', sla: 10, status: 'Active' },
      { name: 'Anita Rao', id: 'APP-10245', assigned: 'Ward 2', sla: 1, status: 'Overdue' },
      { name: 'Vikram Singh', id: 'APP-10251', assigned: 'Ward 9', sla: 18, status: 'Pending' },
    ],
  },
};

/** A small desk-and-screen drawing for the action cards (decorative). */
function Illustration() {
  return (
    <svg viewBox="0 0 120 70" width="120" height="70" aria-hidden="true" focusable="false">
      <rect x="30" y="8" width="60" height="38" rx="3" fill="#fff" stroke="#3B4752" strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5].map((c) =>
        [0, 1, 2].map((r) => (
          <rect key={`${c}-${r}`} x={37 + c * 8} y={15 + r * 8} width="5" height="4" rx="1" style={{ fill: r === 0 && c < 3 ? 'var(--c-primary)' : '#B9C1C8' }} />
        )),
      )}
      <rect x="56" y="46" width="8" height="10" fill="#3B4752" />
      <rect x="46" y="56" width="28" height="3" rx="1.5" fill="#3B4752" />
      <line x1="10" y1="62" x2="110" y2="62" stroke="#D5D9DD" strokeWidth="1.5" />
    </svg>
  );
}

export function ProductHome({ p }: { p: Product }) {
  const { go } = useAccount();
  const uid = useId();
  const c = CONTENT[p];
  const [tab, setTab] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const open = (s: Section) => go('product', { product: p, section: s });
  // Each tab shows a slightly different slice, so switching visibly changes the table.
  const rows = c.rows.map((r, i) => ({ ...r, sla: Math.max(1, r.sla - tab * 2 - i) }));

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const n = c.tabs.length;
    const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    setTab(to);
    tabRefs.current[to]?.focus();
  };

  return (
    <div className="ph">
      <section className="ph-sec" aria-labelledby={`${uid}-o`}>
        <h2 id={`${uid}-o`} className="ph-h">
          <Icon name="Assessment" size={22} />
          Overview
        </h2>
        <ul className="ph-metrics">
          {c.metrics.map((m) => (
            <li key={m.label} className="ph-metric">
              <span className="ph-m-label">{m.label}</span>
              <strong className="ph-m-value">{m.value}</strong>
              <span className={`ph-m-delta${m.up ? ' is-up' : ' is-down'}`}>
                <Icon name={m.up ? 'TrendingUp' : 'TrendingDown'} size={16} />
                {m.delta}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="ph-sec" aria-labelledby={`${uid}-a`}>
        <h2 id={`${uid}-a`} className="ph-h">
          <Icon name="Bolt" size={22} />
          Quick actions
        </h2>
        <ul className="ph-actions">
          {c.actions.map((a) => (
            <li key={a.title} className="ph-action">
              <div className="ph-a-top">
                <h3>{a.title}</h3>
                <p>{a.about}</p>
                <div className="ph-a-art">
                  <Illustration />
                </div>
              </div>
              <ul className="ph-a-links">
                {a.links.map(([label, s]) => (
                  <li key={label}>
                    <button type="button" onClick={() => open(s)}>
                      <Icon name="Layers" size={16} />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="ph-sec" aria-labelledby={`${uid}-r`}>
        <h2 id={`${uid}-r`} className="ph-h">
          <Icon name="AssignmentTurnedIn" size={22} />
          Items to review
        </h2>
        <div className="ph-tabs" role="tablist" aria-label="Items to review">
          {c.tabs.map((t, i) => (
            <button
              key={t}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${i}`}
              aria-selected={tab === i}
              aria-controls={`${uid}-panel`}
              tabIndex={tab === i ? 0 : -1}
              onClick={() => setTab(i)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="ph-table-wrap" role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${tab}`}>
          <table className="ph-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">{c.idLabel}</th>
                <th scope="col">Assigned to</th>
                <th scope="col" className="is-num">
                  SLA (hrs)
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <button type="button" className="ph-name" onClick={() => open('data')}>
                      {r.name}
                    </button>
                  </td>
                  <td>{r.id}</td>
                  <td>{r.assigned}</td>
                  <td className="is-num">{r.sla}</td>
                  <td>
                    <span className={`ph-status is-${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
