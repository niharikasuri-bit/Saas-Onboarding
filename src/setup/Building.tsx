import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { BRAND_COLOURS, PRODUCTS } from '../lib/model';
import { Backdrop } from './Backdrop';
import { DOMAIN, accountSub } from './link';
import type { Answers } from './steps';
import { LOGO } from '../logo';

/**
 * After the last question: the loader, where each part of the account ticks
 * off in turn ("Setting up your account"), then "Your account is created":
 * the sign-in link first (to copy and keep), the other details below it
 * (everything except look and feel), and Go to Home. Not "ready": products
 * still need setting up inside. Reduced motion skips the stagger.
 */

const STEP_MS = 650;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Mixes a hex colour towards white (amount > 0) or black (amount < 0). */
function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const ch = (v: number) => Math.round(v + (target - v) * t);
  const r = ch((n >> 16) & 255), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Fixed colours for the trophy and confetti; the glow is a light tint of the trophy's gold. */
const ART = {
  cup: '#F2B33D',
  cupDark: '#E09A1A',
  rim: '#E09A1A',
  confetti: ['#C84C0E', '#F2B33D', '#0B4B66', '#0057BD', '#F2B33D', '#C84C0E', '#00703C'],
};

/** Confetti pieces placed around a ring, deterministically, so every render matches. */
const CONFETTI = Array.from({ length: 34 }, (_, i) => {
  const angle = (i / 34) * Math.PI * 2 + (i % 3) * 0.21;
  const radius = 96 + ((i * 37) % 58);
  const kind = i % 5 === 0 ? 'curl' : i % 3 === 0 ? 'dot' : 'strip';
  return {
    x: 180 + Math.cos(angle) * radius,
    y: 180 + Math.sin(angle) * radius,
    rot: (i * 47) % 180,
    tone: i,
    kind,
    size: kind === 'dot' ? 2 + (i % 3) : 1,
  };
});

/**
 * Success: calm and on brand. A soft gold glow, a gold trophy, and a ring of
 * confetti around it.
 */
function SuccessArt() {
  // The glow takes the trophy's gold.
  const c = { ...ART, glow: shade(ART.cup, 0.75) };
  return (
    <svg viewBox="0 0 360 360" className="qz-art" aria-hidden="true">
      <defs>
        <radialGradient id="sc-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c.glow} stopOpacity={0.9} />
          <stop offset="70%" stopColor={c.glow} stopOpacity={0.35} />
          <stop offset="100%" stopColor={c.glow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={180} cy={180} r={170} fill="url(#sc-glow)" />
      {CONFETTI.map((p, i) => {
        const fill = c.confetti[p.tone % c.confetti.length];
        return (
          <g key={i} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rot})`}>
            {p.kind === 'dot' && <circle r={p.size} fill={fill} />}
            {p.kind === 'strip' && <rect x={-6} y={-2.2} width={12} height={4.4} rx={1.4} fill={fill} />}
            {p.kind === 'curl' && (
              <path d="M-10 0 q2.5 -5 5 0 t5 0 t5 0 t5 0" stroke={fill} strokeWidth={3} fill="none" strokeLinecap="round" />
            )}
          </g>
        );
      })}
      {/* the trophy, scaled up now it stands on its own */}
      <g transform="translate(180 185) scale(1.5) translate(-180 -185)">
        {/* handles */}
        <path d="M157 160 C143 160 143 186 163 189" stroke={c.cup} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M203 160 C217 160 217 186 197 189" stroke={c.cup} strokeWidth={5} fill="none" strokeLinecap="round" />
        {/* cup, with a darker right half */}
        <path d="M155 152 H205 V166 C205 184 194 197 180 200 C166 197 155 184 155 166 Z" fill={c.cup} />
        <path d="M180 152 H205 V166 C205 184 194 197 180 200 Z" fill={c.cupDark} />
        <rect x={152} y={148} width={56} height={7} rx={2.5} fill={c.rim} />
        <path d="M180 162 l3.2 6.5 7.2 1 -5.2 5.1 1.2 7.1 -6.4 -3.4 -6.4 3.4 1.2 -7.1 -5.2 -5.1 7.2 -1 z" fill="#FFFFFF" />
        {/* stem and base */}
        <rect x={175} y={200} width={10} height={9} fill={c.rim} />
        <rect x={166} y={208} width={28} height={6} rx={2} fill="#3F3D56" />
        <rect x={160} y={213} width={40} height={9} rx={2.5} fill="#0B4B66" />
      </g>
    </svg>
  );
}

export function Building({
  a,
  headingRef,
  onDone,
}: {
  a: Answers;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onDone: () => void;
}) {
  const colour = BRAND_COLOURS.find((c) => c.value === (a.colour || BRAND_COLOURS[0].value)) ?? BRAND_COLOURS[0];
  const invites = a.invites.split(/[\s,;]+/).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  const products = a.products.map((p) => PRODUCTS[p].name).join(', ') || '—';
  const team = invites.length ? `${invites.length} ${invites.length === 1 ? 'person' : 'people'} invited` : 'Just you for now';
  const link = `${accountSub(a)}.${DOMAIN}`;

  const rows: { label: string; value: string; swatch?: string }[] = [
    { label: 'Your profile', value: a.name.trim() || 'You' },
    { label: 'Account', value: a.org.trim() || 'Your account' },
    { label: 'Products', value: products },
    { label: 'Look and feel', value: colour.label, swatch: colour.value },
    { label: 'Team', value: team },
  ];

  const [done, setDone] = useState(() => (reduced() ? rows.length : 0));
  const [ready, setReady] = useState(() => reduced());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (ready) return;
    const t =
      done < rows.length
        ? setTimeout(() => setDone((d) => d + 1), STEP_MS)
        : setTimeout(() => setReady(true), 700); // a beat on the finished list
    return () => clearTimeout(t);
  }, [done, ready, rows.length]);

  // Announce the success screen by moving focus to its heading.
  useEffect(() => {
    if (ready) headingRef.current?.focus();
  }, [ready, headingRef]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${link}`);
    } catch {
      // Clipboard can be blocked; the link is still there to select by hand.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (ready) {
    const details: { label: string; value: string }[] = [
      { label: 'Account name', value: a.org.trim() || '—' },
      { label: 'Products', value: products },
      // Team only shows once someone has been invited.
      ...(invites.length ? [{ label: 'Team', value: team }] : []),
    ];
    return (
      <div className="sf su qz">
        <Backdrop />
        <header className="su-top">
          <img className="sf-logo" src={LOGO} alt="DIGIT" width={528} height={124} />
        </header>
        <main className="qz-main">
          <div className="qz-card">
            <div className="qz-panel">
              <SuccessArt />
            </div>
            <div className="qz-form sc">
              <div className="sc-body">
                <span className="sc-tick" aria-hidden="true">
                  <Icon name="Check" size={26} />
                </span>
                <h1 ref={headingRef} tabIndex={-1}>
                  Your account is created
                </h1>

                <div className="sc-link">
                  <span className="sc-link-label" id="sc-link-label">
                    Account link
                  </span>
                  <div className="sc-link-row">
                    <span className="sc-link-field">
                      <span className="sc-link-url" aria-labelledby="sc-link-label">
                        {link}
                      </span>
                    </span>
                    <button type="button" className="sc-link-copy" onClick={copy}>
                      {copied ? (
                        <Icon name="Check" size={16} />
                      ) : (
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                          <rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      )}
                      {copied ? 'Copied' : 'Copy link'}
                    </button>
                  </div>
                  {/* the details live in the same panel, under one hairline */}
                  <dl className="sc-list">
                    {details.map((r) => (
                      <div key={r.label} className="sc-row">
                        <dt>{r.label}</dt>
                        <dd>{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <div className="qz-actions">
                <Button variation="primary" label="Go to Your Account" onClick={onDone} />
              </div>
              <p className="ux-visually-hidden" role="status">
                {copied ? 'Link copied' : ''}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const pct = Math.round((done / rows.length) * 100);
  return (
    <div className="sf su qz">
      <Backdrop />
      <header className="su-top">
        <img className="sf-logo" src={LOGO} alt="DIGIT" width={528} height={124} />
      </header>
      <main className="bl-main">
        <div className="bl-card" aria-busy="true">
          <h1 ref={headingRef} tabIndex={-1}>
            Setting up your account
          </h1>
          <p className="qz-lead">This only takes a moment.</p>
          <div
            className="bl-bar"
            role="progressbar"
            aria-label="Account setup"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <span style={{ width: `${pct}%` }} />
          </div>
          <ul className="bl-list">
            {rows.map((r, i) => {
              const state = i < done ? 'is-done' : i === done ? 'is-doing' : 'is-todo';
              return (
                <li key={r.label} className={`bl-row ${state}`}>
                  <span className="bl-mark" aria-hidden="true">
                    {state === 'is-done' && <Icon name="Check" size={14} />}
                  </span>
                  <span className="bl-text">
                    <span className="bl-label">{r.label}</span>
                    <span className="bl-value">
                      {r.swatch && <span className="bl-swatch" style={{ background: r.swatch }} aria-hidden="true" />}
                      {r.value}
                    </span>
                  </span>
                  <span className="ux-visually-hidden">
                    {state === 'is-done' ? ', done' : state === 'is-doing' ? ', in progress' : ', waiting'}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="ux-visually-hidden" role="status">
            {done > 0 ? `${rows[done - 1].label} set up` : ''}
          </p>
        </div>
      </main>
    </div>
  );
}
