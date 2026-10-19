import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, ReactNode, RefObject } from 'react';
import { Button, TextInput } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { BRAND_COLOURS, PRODUCTS, type Product } from '../lib/model';
import { PRODUCT_OPTIONS, type Answers } from './steps';
import { Backdrop } from './Backdrop';
import { AccountLink } from './AccountLink';
import { DOMAIN, accountSub, checkSub } from './link';
import { DEVICE, Figure, GREY, GREY_2, INK } from './Figure';
import { LOGO } from '../logo';

/**
 * After sign-up or log-in: a few questions, grouped into four short steps on
 * a split card. The left panel illustrates the step and reacts to the answers
 * (chosen products light up, the logo and colour preview live, each invite
 * adds a teammate). The right panel holds the form.
 */

type GroupKey = 'about' | 'account' | 'products' | 'look' | 'team';

export const GROUPS: { key: GroupKey; optional?: boolean }[] = [
  { key: 'about' },
  { key: 'account' },
  { key: 'products' },
  { key: 'look', optional: true },
  { key: 'team', optional: true },
];

const ORANGE = '#C84C0E';
const ORANGE_BG = '#FBEEE8';
const TEAL = '#0B4B66';

/* ---------------------------------------------------------------- */
/* Illustrations, one per step, unDraw style                         */
/* ---------------------------------------------------------------- */

const Ground = () => <path d="M24 330.5 H346" stroke={GREY} strokeWidth={2} strokeLinecap="round" />;

/** A person beside their name card, as the account's admin, and the building they run. */
function AboutArt({ a }: { a: Answers }) {
  const name = a.name.trim() || 'Your name';
  return (
    <svg viewBox="0 0 360 360" className="qz-art" aria-hidden="true" fontFamily="Roboto, sans-serif">
      <circle cx={180} cy={190} r={150} fill={GREY_2} />
      {/* building */}
      <path d="M218 150 L268 122 L318 150 Z" fill={ORANGE} />
      <rect x={224} y={150} width={88} height={180} fill="#FFFFFF" stroke={DEVICE} strokeWidth={2.4} />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={236 + c * 24} y={166 + r * 32} width={14} height={18} rx={2} fill={ORANGE_BG} />),
      )}
      <rect x={256} y={298} width={24} height={32} fill={TEAL} />
      {/* name card */}
      <g transform="translate(40 96)">
        <rect width={150} height={92} rx={10} fill="#FFFFFF" stroke={DEVICE} strokeWidth={2.4} />
        <circle cx={34} cy={40} r={16} fill={ORANGE_BG} />
        <circle cx={34} cy={36} r={6} fill={ORANGE} />
        <path d="M24 50 a10 8 0 0 1 20 0z" fill={ORANGE} />
        <text x={60} y={38} fontSize={11} fontWeight={700} fill={TEAL}>
          {name.length > 13 ? `${name.slice(0, 12)}…` : name}
        </text>
        <text x={60} y={54} fontSize={9} fill="#787878">
          Account admin
        </text>
        <rect x={16} y={70} width={118} height={6} rx={3} fill={GREY} />
      </g>
      <g transform="translate(150 330) scale(1.75)">
        <Figure shirt={ORANGE} skin="#8D5524" hair={INK} pose="point" />
      </g>
      <Ground />
    </svg>
  );
}


const SERVICE: Record<Product, { x: number; y: number }> = {
  cms: { x: 196, y: 70 },
  hcm: { x: 264, y: 150 },
  lnp: { x: 196, y: 228 },
};

/** Moves each mark so its visible shape is centred (the bubble's tail makes it sit low). */
const MARK_NUDGE: Record<Product, number> = { cms: -1.5, hcm: 0.5, lnp: -0.8 };

/** The same marks as the option cards: a bubble with "!", a medical bag, a licence card. */
function ServiceMark({ p, c }: { p: Product; c: string }) {
  if (p === 'cms')
    return (
      <>
        <path d="M-8 -7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9l-5 4v-4h-2a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" fill={c} />
        <path d="M0 -4.4v4.6M0 3v0.3" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
      </>
    );
  if (p === 'hcm')
    return (
      <>
        <path d="M-3.6 -6.4v-2.2h7.2v2.2" stroke={c} strokeWidth={1.8} fill="none" strokeLinejoin="round" />
        <rect x={-9} y={-6.4} width={18} height={14} rx={2} fill={c} />
        <path d="M0 -3v7.2M-3.6 0.6h7.2" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
      </>
    );
  return (
    <>
      <rect x={-9} y={-7.4} width={18} height={12.6} rx={1.6} fill={c} />
      <path d="M-6 -4h12M-6 -1h7" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" />
      <path d="M1.6 3v6l2.4-1.6 2.4 1.6v-6" fill={c} stroke="#FFFFFF" strokeWidth={0.8} strokeLinejoin="round" />
      <circle cx={4} cy={2.4} r={2.6} fill="#FFFFFF" />
      <circle cx={4} cy={2.4} r={1.5} fill={c} />
    </>
  );
}

/** The account's building, with its sign-in link in a browser bar above it. */
function AccountArt({ a }: { a: Answers }) {
  const url = `${accountSub(a)}.${DOMAIN}`;
  return (
    <svg viewBox="0 0 360 360" className="qz-art" aria-hidden="true" fontFamily="Roboto, sans-serif">
      <circle cx={180} cy={190} r={150} fill={GREY_2} />
      {/* browser bar with the sign-in link */}
      <g transform="translate(40 64)">
        <rect width={280} height={44} rx={10} fill="#FFFFFF" stroke={DEVICE} strokeWidth={2.4} />
        <circle cx={18} cy={22} r={3.4} fill={GREY} />
        <circle cx={30} cy={22} r={3.4} fill={GREY} />
        <rect x={44} y={11} width={224} height={22} rx={11} fill={GREY_2} />
        <path d="M58 19.6v-1.8a3.2 3.2 0 0 1 6.4 0v1.8" stroke={TEAL} strokeWidth={1.4} fill="none" />
        <rect x={56.6} y={19.6} width={9.2} height={7} rx={1.4} fill={TEAL} />
        <text x={72} y={26.4} fontSize={10.5} fontWeight={700} fill={TEAL}>
          {url.length > 34 ? `${url.slice(0, 33)}…` : url}
        </text>
      </g>
      {/* the account's building */}
      <path d="M126 168 L180 138 L234 168 Z" fill={ORANGE} />
      <rect x={132} y={168} width={96} height={162} fill="#FFFFFF" stroke={DEVICE} strokeWidth={2.4} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={146 + c * 26} y={184 + r * 32} width={16} height={18} rx={2} fill={ORANGE_BG} />),
      )}
      <rect x={168} y={292} width={24} height={38} fill={TEAL} />
      <Ground />
    </svg>
  );
}

/** A person choosing between the three services; chosen ones light up. */
function ProductsArt({ a }: { a: Answers }) {
  return (
    <svg viewBox="0 0 360 360" className="qz-art" aria-hidden="true" fontFamily="Roboto, sans-serif">
      <circle cx={180} cy={190} r={150} fill={GREY_2} />
      {(Object.keys(SERVICE) as Product[]).map((p) => {
        const s = SERVICE[p];
        const on = a.products.includes(p);
        const label = PRODUCTS[p].name;
        return (
          <g key={p} transform={`translate(${s.x} ${s.y})`} className="qz-svc">
            <rect x={-52} y={-30} width={104} height={64} rx={10} fill="#FFFFFF" stroke={on ? ORANGE : GREY} strokeWidth={on ? 2.4 : 1.6} />
            <circle cx={0} cy={-6} r={14} fill={on ? ORANGE_BG : GREY_2} />
            <g transform="translate(0 -6) scale(0.72)">
              <ServiceMark p={p} c={on ? ORANGE : '#B9B9B9'} />
            </g>
            <text x={0} y={22} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={on ? TEAL : '#787878'}>
              {label.length > 18 ? 'Licences & Permits' : label}
            </text>
          </g>
        );
      })}
      <g transform="translate(92 330) scale(1.75)">
        <Figure shirt={TEAL} skin="#F1C27D" hair="#5A3825" pose="point" />
      </g>
      <Ground />
    </svg>
  );
}

/** A live preview of their console header, with their logo and colour. */
function LookArt({ a }: { a: Answers }) {
  const colour = a.colour || BRAND_COLOURS[0].value;
  const org = a.org.trim() || 'Your account';
  return (
    <svg viewBox="0 0 360 360" className="qz-art" aria-hidden="true" fontFamily="Roboto, sans-serif">
      <circle cx={180} cy={190} r={150} fill={GREY_2} />
      <rect x={40} y={70} width={280} height={190} rx={12} fill="#FFFFFF" stroke={DEVICE} strokeWidth={2.6} />
      <path d="M41.3 96 H318.7" stroke={GREY} strokeWidth={1.4} />
      {[54, 64, 74].map((x) => (
        <circle key={x} cx={x} cy={83} r={3} fill={GREY} />
      ))}
      {/* their header */}
      <rect x={52} y={106} width={256} height={36} rx={6} fill={colour} className="qz-fill" />
      {a.logo ? (
        <image href={a.logo} x={60} y={112} width={24} height={24} preserveAspectRatio="xMidYMid meet" />
      ) : (
        <>
          <rect x={60} y={112} width={24} height={24} rx={6} fill="#FFFFFF" opacity={0.92} />
          <text x={72} y={128.5} textAnchor="middle" fontSize={12} fontWeight={700} fill={colour}>
            {org.charAt(0).toUpperCase()}
          </text>
        </>
      )}
      <text x={92} y={128.5} fontSize={11} fontWeight={700} fill="#FFFFFF">
        {org.length > 26 ? `${org.slice(0, 25)}…` : org}
      </text>
      <rect x={52} y={154} width={150} height={8} rx={4} fill={GREY} />
      <rect x={52} y={170} width={110} height={8} rx={4} fill={GREY_2} />
      {/* actions sit at the right, secondary first and primary last, as in DIGIT */}
      <rect x={150} y={196} width={74} height={22} rx={4} fill="#FFFFFF" stroke={colour} strokeWidth={1.4} className="qz-stroke" />
      <rect x={234} y={196} width={74} height={22} rx={4} fill={colour} className="qz-fill" />
      <g transform="translate(338 330) scale(1.55)">
        <Figure shirt={colour} skin="#C68642" hair={INK} pose="clipboard" />
      </g>
      <Ground />
    </svg>
  );
}

/** The team: one more person appears for each address added. */
function TeamArt({ a }: { a: Answers }) {
  const count = splitEmails(a.invites).filter((x) => !badEmails(x).length).length;
  const people = [
    { x: 120, shirt: ORANGE, skin: '#F1C27D', hair: '#5A3825' },
    { x: 180, shirt: TEAL, skin: '#8D5524', hair: INK },
    { x: 240, shirt: '#00703C', skin: '#C68642', hair: INK },
  ];
  return (
    <svg viewBox="0 0 360 360" className="qz-art" aria-hidden="true" fontFamily="Roboto, sans-serif">
      <circle cx={180} cy={190} r={150} fill={GREY_2} />
      {/* an invite on its way */}
      <g transform="translate(138 70)">
        <rect width={84} height={58} rx={6} fill="#FFFFFF" stroke={DEVICE} strokeWidth={2.4} />
        <path d="M2 4 L42 34 L82 4" stroke={DEVICE} strokeWidth={2.4} fill="none" strokeLinejoin="round" />
        <circle cx={80} cy={4} r={11} fill={ORANGE} />
        <text x={80} y={8} textAnchor="middle" fontSize={11} fontWeight={700} fill="#FFFFFF">
          {Math.min(count, 99)}
        </text>
      </g>
      {people.map((p, i) => (
        <g key={i} transform={`translate(${p.x} 330) scale(1.6)`} className="qz-person" style={{ opacity: i === 0 || count >= i ? 1 : 0.18 }}>
          <Figure shirt={p.shirt} skin={p.skin} hair={p.hair} />
        </g>
      ))}
      <Ground />
    </svg>
  );
}

/** Capitalises the first letter as people type, so "amina" becomes "Amina". */
const capFirst = (v: string) => v.replace(/^\s*\S/, (c) => c.toUpperCase());

/* ---------------------------------------------------------------- */
/* Fields                                                            */
/* ---------------------------------------------------------------- */

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="sf-error">
      <span className="ux-visually-hidden">Error: </span>
      {children}
    </p>
  );
}

/** A labelled DIGIT TextInput: label, hint, error, then the input. */
function TextField({
  id, label, hint, value, error, placeholder, inputRef, onChange,
}: {
  id: string; label: string; hint?: string; value: string; error: string; placeholder?: string;
  inputRef: RefObject<HTMLInputElement | null>; onChange: (v: string) => void;
}) {
  return (
    <div className={`su-field qz-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="text-input digit-text-input-field">
        <TextInput
          id={id}
          name={id}
          type="text"
          label={label}
          placeholder={placeholder}
          inputRef={inputRef}
          value={value}
          error={error || undefined}
          errorStyle={!!error}
          onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
        />
      </div>
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
      {hint && <p className="qz-help">{hint}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Invite emails, one box per person                                 */
/* ---------------------------------------------------------------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const splitEmails = (v: string) => v.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean);
const badEmails = (v: string) => splitEmails(v).filter((e) => !EMAIL.test(e));

/**
 * One email box per person, two to start, and "Add team member" for more.
 * Nothing to learn: type an address in each box. A box is checked when you
 * leave it, and again when you finish. Stored as one comma-separated string.
 */
function InviteRows({ value, onChange, check }: { value: string; onChange: (v: string) => void; check: boolean }) {
  const uid = useId();
  const [rows, setRows] = useState<string[]>(() => {
    const start = splitEmails(value);
    return [...start, ...Array(Math.max(0, 2 - start.length)).fill('')];
  });
  const [touched, setTouched] = useState<boolean[]>([]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focusNext = useRef<number | null>(null);

  useEffect(() => {
    if (focusNext.current !== null) {
      refs.current[focusNext.current]?.focus();
      focusNext.current = null;
    }
  });

  const save = (next: string[]) => {
    setRows(next);
    onChange(next.map((r) => r.trim()).filter(Boolean).join(', '));
  };
  const errorFor = (i: number) => {
    const v = rows[i].trim();
    return v && (touched[i] || check) && !EMAIL.test(v) ? 'Enter an email address like name@example.com' : '';
  };

  return (
    <fieldset className="qz-invites">
      <legend className="sf-label">Invite by email</legend>
      <ul className="qz-rows">
        {rows.map((r, i) => {
          const err = errorFor(i);
          const id = `${uid}-row${i}`;
          return (
            <li key={i} className={`qz-row${err ? ' has-error' : ''}`}>
              <label htmlFor={id} className="ux-visually-hidden">
                Email address {i + 1}
              </label>
              <div className="qz-row-line">
                <input
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  id={id}
                  type="email"
                  className="qz-row-input"
                  placeholder="name@example.com"
                  autoComplete="off"
                  spellCheck={false}
                  value={r}
                  aria-invalid={!!err}
                  aria-describedby={err ? `${id}-err` : undefined}
                  onChange={(e) => save(rows.map((x, j) => (j === i ? e.target.value : x)))}
                  onBlur={() => setTouched((t) => rows.map((_, j) => (j === i ? true : !!t[j])))}
                />
                {rows.length > 1 && (
                  <button
                    type="button"
                    className="qz-row-remove"
                    aria-label={r.trim() ? `Remove ${r.trim()}` : `Remove email address ${i + 1}`}
                    onClick={() => {
                      save(rows.filter((_, j) => j !== i));
                      setTouched((t) => t.filter((_, j) => j !== i));
                      focusNext.current = Math.max(0, i - 1);
                    }}
                  >
                    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
              {err && <ErrorText id={`${id}-err`}>{err}</ErrorText>}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="qz-add-row"
        onClick={() => {
          focusNext.current = rows.length;
          save([...rows, '']);
        }}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Add team member
      </button>
    </fieldset>
  );
}

/* ---------------------------------------------------------------- */
/* The step                                                          */
/* ---------------------------------------------------------------- */

export function Questions({
  a,
  q,
  headingRef,
  update,
  onBack,
  onNext,
}: {
  a: Answers;
  q: number;
  headingRef: RefObject<HTMLHeadingElement | null>;
  update: (p: Partial<Answers>) => void;
  onBack: () => void;
  onNext: (patch?: Partial<Answers>) => void;
}) {
  const group = GROUPS[q];
  const last = q === GROUPS.length - 1;
  const uid = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const orgRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [logoError, setLogoError] = useState('');

  useEffect(() => setErrors({}), [q]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (group.key === 'about' && !a.name.trim()) {
      setErrors({ name: 'Enter your name' });
      return nameRef.current?.focus();
    }
    if (group.key === 'account') {
      const next = { org: a.org.trim() ? '' : 'Enter your account name', link: checkSub(accountSub(a)) ? 'check' : '' };
      setErrors(next);
      if (next.org) return orgRef.current?.focus();
      if (next.link) return requestAnimationFrame(() => document.getElementById('al-input')?.focus());
    }
    if (group.key === 'team' && badEmails(a.invites).length) {
      setErrors({ team: 'check' });
      requestAnimationFrame(() =>
        (document.querySelector('.qz-form [aria-invalid="true"]') as HTMLInputElement | null)?.focus(),
      );
      return;
    }
    if (group.key === 'products' && !a.products.length) {
      setErrors({ products: 'Choose at least one' });
      requestAnimationFrame(() => document.getElementById(`${uid}-p0`)?.focus());
      return;
    }
    onNext();
  };

  const takeLogo = (file?: File) => {
    if (!file) return;
    if (!/^image\/(png|svg\+xml|jpeg)$/.test(file.type)) {
      setLogoError('Choose a PNG, SVG or JPG image');
      return;
    }
    setLogoError('');
    // A data URL, so the logo survives a reload.
    const r = new FileReader();
    r.onload = () => update({ logo: String(r.result) });
    r.readAsDataURL(file);
  };

  const copy: Record<GroupKey, { title: string; lead: ReactNode }> = {
    about: { title: 'What should we call you?', lead: 'This is the name your team will see on your profile.' },
    account: {
      title: 'What’s your account called?',
      lead: 'Give your account a name, and choose the link your team uses to sign in.',
    },
    products: { title: 'What will you use DIGIT for?', lead: 'Choose everything you plan to use.' },
    look: { title: 'Choose a look and feel', lead: 'Choose how your product looks to your team and citizens.' },
    team: {
      title: 'Invite your team',
      lead: (
        <>
          Invite people by email. They’ll sign in at <span className="link-tag">{accountSub(a)}.{DOMAIN}</span>
        </>
      ),
    },
  };

  const art: Record<GroupKey, ReactNode> = {
    about: <AboutArt a={a} />,
    account: <AccountArt a={a} />,
    products: <ProductsArt a={a} />,
    look: <LookArt a={a} />,
    team: <TeamArt a={a} />,
  };

  const primary =
    group.key === 'team' ? (a.invites.trim() ? 'Send Invites and Finish' : 'Finish') : 'Continue';

  return (
    <div className="sf su qz">
      <Backdrop />
      <header className="su-top">
        <img className="sf-logo" src={LOGO} alt="DIGIT" width={528} height={124} />
      </header>
      <main className="qz-main">
        <div className="qz-card">
          <div className="qz-panel" key={group.key}>
            {art[group.key]}
          </div>

          <div className="qz-form">
            {/* Back, step and progress stay pinned to the top while the form scrolls. */}
            <div className="qz-top">
            <div className="qz-head">
              <button type="button" className="sf-back" onClick={onBack}>
                <Icon name="ArrowBack" size={18} />
                Back
              </button>
              <span className="qz-count">
                Step {q + 1} of {GROUPS.length}
                {group.optional && ' · Optional'}
              </span>
            </div>
            <div className="qz-bar" aria-hidden="true">
              {GROUPS.map((g, i) => (
                <span key={g.key} className={i <= q ? 'is-on' : undefined} />
              ))}
            </div>
            </div>

            <h1 ref={headingRef} tabIndex={-1}>
              {copy[group.key].title}
            </h1>
            <p className="qz-lead">{copy[group.key].lead}</p>

            <form onSubmit={submit} noValidate className="qz-fields">
              {group.key === 'about' && (
                <>
                  <TextField
                    id={`${uid}-name`}
                    label="Your name"
                    hint="Just your name, no titles needed."
                    value={a.name}
                    error={errors.name ?? ''}
                    inputRef={nameRef}
                    onChange={(v) => {
                      update({ name: capFirst(v) });
                      setErrors((x) => ({ ...x, name: '' }));
                    }}
                  />
                </>
              )}

              {group.key === 'account' && (
                <>
                  <TextField
                    id={`${uid}-org`}
                    label="Account name"
                    value={a.org}
                    error={errors.org ?? ''}
                    inputRef={orgRef}
                    onChange={(v) => {
                      update({ org: capFirst(v) });
                      setErrors((x) => ({ ...x, org: '' }));
                    }}
                  />
                  <AccountLink a={a} update={update} check={!!errors.link} />
                </>
              )}

              {group.key === 'products' && (
                <fieldset className={`qz-tiles${errors.products ? ' has-error' : ''}`}>
                  <legend className="ux-visually-hidden">What will you use DIGIT for?</legend>
                  {errors.products && <ErrorText id={`${uid}-perr`}>{errors.products}</ErrorText>}
                  <div className="qz-tile-row">
                    {PRODUCT_OPTIONS.map((o, n) => {
                      const p = o.value as Product;
                      const checked = a.products.includes(p);
                      return (
                        <label key={o.value} className={`qz-tile${checked ? ' is-on' : ''}`}>
                          <input
                            id={`${uid}-p${n}`}
                            type="checkbox"
                            value={o.value}
                            checked={checked}
                            aria-describedby={errors.products ? `${uid}-perr` : undefined}
                            onChange={() => {
                              update({ products: checked ? a.products.filter((x) => x !== p) : [...a.products, p] });
                              setErrors({});
                            }}
                          />
                          {/* the same mark as the illustration on the left */}
                          <svg className="qz-tile-mark" viewBox="-12 -12 24 24" aria-hidden="true" focusable="false">
                            <g transform={`translate(0 ${MARK_NUDGE[p]})`}>
                              <ServiceMark p={p} c={ORANGE} />
                            </g>
                          </svg>
                          <span className="qz-tile-label">{o.label}</span>
                          {checked && (
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

              {group.key === 'look' && (
                <>
                  <fieldset className="qz-colours">
                    <legend className="sf-label">Main colour</legend>
                    <div className="qz-swatches">
                      {BRAND_COLOURS.map((c) => {
                        const on = (a.colour || BRAND_COLOURS[0].value) === c.value;
                        return (
                          <label
                            key={c.value}
                            className={`qz-swatch${on ? ' is-on' : ''}`}
                            style={{ '--sw': c.value } as CSSProperties}
                          >
                            <input
                              type="radio"
                              name={`${uid}-colour`}
                              value={c.value}
                              checked={on}
                              onChange={() => update({ colour: c.value })}
                            />
                            <span className="qz-dot" style={{ background: c.value }} aria-hidden="true">
                              {on && <Icon name="Check" size={18} />}
                            </span>
                            <span className="qz-swatch-name">{c.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div
                    className={`qz-logo${over ? ' is-over' : ''}${logoError ? ' has-error' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOver(true);
                    }}
                    onDragLeave={() => setOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setOver(false);
                      takeLogo(e.dataTransfer.files[0]);
                    }}
                  >
                    <span className="sf-label" id={`${uid}-logo`}>
                      Logo <span className="sf-optional">(optional)</span>
                    </span>
                    <div className="qz-logo-row">
                      <span className="qz-logo-box" aria-hidden="true">
                        {a.logo ? <img src={a.logo} alt="" /> : <Icon name="CloudUpload" size={22} />}
                      </span>
                      <label className="qz-upload">
                        <input
                          type="file"
                          accept="image/png,image/svg+xml,image/jpeg"
                          aria-labelledby={`${uid}-logo`}
                          aria-describedby={`${uid}-logo-help${logoError ? ` ${uid}-logo-err` : ''}`}
                          onChange={(e) => takeLogo(e.target.files?.[0])}
                        />
                        {a.logo ? 'Replace logo' : 'Upload logo'}
                      </label>
                      {a.logo && (
                        <button type="button" className="sf-link qz-remove" onClick={() => update({ logo: '' })}>
                          Remove
                        </button>
                      )}
                    </div>
                    {logoError && <ErrorText id={`${uid}-logo-err`}>{logoError}</ErrorText>}
                    <p className="qz-help" id={`${uid}-logo-help`}>
                      Supported file types: PNG, SVG, JPG
                    </p>
                  </div>
                </>
              )}

              {group.key === 'team' && (
                <InviteRows value={a.invites} onChange={(v) => update({ invites: v })} check={!!errors.team} />
              )}

              {/* The main action stays pinned to the bottom of the form. */}
              <div className="qz-actions">
                <Button variation="primary" label={primary} submit onClick={() => {}} />
                {/* On the team step, Finish already skips when nobody is added. */}
                {group.optional && (group.key !== 'team' || !!a.invites.trim()) && (
                  <Button
                    variation="link"
                    label={last ? 'Skip and Finish' : 'Skip for Now'}
                    onClick={() => {
                      if (group.key === 'team') {
                        update({ invites: '' });
                        onNext({ invites: '' });
                      } else onNext();
                    }}
                  />
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
