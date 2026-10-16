import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode, RefObject } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { BRAND_COLOURS, type Product } from '../lib/model';
import {
  DEMO_ACCOUNT,
  EMPTY_ANSWERS,
  LANGUAGES,
  STEPS,
  TEMP_PASSWORD,
  firstName,
  type Answers,
  type Provider,
} from './steps';
import '../styles/setup.css';

type Props = { onDone: (a: Answers) => void };
type Stage = 'blank' | 'welcome' | 'signup' | 'inbox' | 'credentials' | 'login' | 'questions';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sign up → verify email → receive credentials → log in (with a language
 * selector) → a few questions → Home. One calm column throughout.
 */
export function SetupFlow({ onDone }: Props) {
  const [stage, setStage] = useState<Stage>('blank');
  const [q, setQ] = useState(0);
  const [a, setA] = useState<Answers>(EMPTY_ANSWERS);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (stage !== 'blank') return;
    const t = setTimeout(() => setStage('welcome'), reducedMotion() ? 0 : 700);
    return () => clearTimeout(t);
  }, [stage]);

  // Each new screen announces itself by moving focus to its heading.
  useEffect(() => {
    if (stage !== 'blank' && stage !== 'welcome') headingRef.current?.focus();
  }, [stage, q]);

  const update = (patch: Partial<Answers>) => setA((prev) => ({ ...prev, ...patch }));

  if (stage === 'blank') return <div className="sf" aria-busy="true" />;

  if (stage === 'welcome') {
    return (
      <Shell wide>
        <p className="sf-kicker sf-rise">Welcome to</p>
        <h1 className="sf-hero-logo sf-rise sf-d1">
          <img src="/digit-logo.png" alt="DIGIT" width={528} height={124} />
        </h1>
        <p className="sf-lead sf-rise sf-d2">
          Your home for running public services that reach every community, built for the people
          doing the work, on the ground.
        </p>
        <div className="sf-rise sf-d3 sf-full">
          <Button variation="primary" label="Get Started" onClick={() => setStage('signup')} />
        </div>
      </Shell>
    );
  }

  if (stage === 'signup') {
    return (
      <SignUp
        headingRef={headingRef}
        onDone={(via, email) => {
          update(
            via === 'email'
              ? { via, email }
              : { via, email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.name },
          );
          setStage('inbox');
        }}
      />
    );
  }

  if (stage === 'inbox') {
    return (
      <Shell>
        <span className="sf-badge" aria-hidden="true">
          <Icon name="Email" size={28} />
        </span>
        <h1 ref={headingRef} tabIndex={-1}>
          Check your inbox
        </h1>
        <p className="sf-lead">
          We’ve sent a link to <strong>{a.email}</strong>. Open it to verify your email, and we’ll
          send your login details.
        </p>

        <figure className="sf-mail" aria-label="Preview of the verification email">
          <div className="sf-mail-head">
            <img src="/digit-logo.png" alt="" width={528} height={124} />
            <span>Welcome to DIGIT</span>
          </div>
          <div className="sf-mail-body">
            <p className="sf-mail-hi">Hi {firstName(a) || 'there'},</p>
            <p>Verify your email to finish creating your account.</p>
            <span className="sf-mail-cta" aria-hidden="true">
              Verify My Email
            </span>
          </div>
        </figure>

        <div className="sf-full">
          <Button variation="primary" label="Verify My Email" onClick={() => setStage('credentials')} />
        </div>
      </Shell>
    );
  }

  if (stage === 'credentials') {
    return (
      <Shell>
        <span className="sf-badge" aria-hidden="true">
          <Icon name="CheckCircle" size={28} />
        </span>
        <h1 ref={headingRef} tabIndex={-1}>
          Your email is verified
        </h1>
        <p className="sf-lead">Here are your login details. We’ve emailed them to you too.</p>
        <dl className="sf-cred">
          <div>
            <dt>Username</dt>
            <dd>{a.email}</dd>
          </div>
          <div>
            <dt>Temporary password</dt>
            <dd>
              <code>{TEMP_PASSWORD}</code>
            </dd>
          </div>
        </dl>
        <p className="sf-fine">You’ll be asked to change the password after your first login.</p>
        <div className="sf-full">
          <Button variation="primary" label="Go to Login" onClick={() => setStage('login')} />
        </div>
      </Shell>
    );
  }

  if (stage === 'login') {
    return (
      <Login
        a={a}
        headingRef={headingRef}
        onLanguage={(language) => update({ language })}
        onDone={() => {
          setQ(0);
          setStage('questions');
        }}
      />
    );
  }

  return (
    <Questions
      a={a}
      q={q}
      headingRef={headingRef}
      update={update}
      onBack={() => (q === 0 ? setStage('login') : setQ(q - 1))}
      onNext={(patch) => {
        if (q < STEPS.length - 1) setQ(q + 1);
        else onDone({ ...a, ...patch });
      }}
    />
  );
}

/* ---------------------------------------------------------------- */

function Shell({ children, wide, top }: { children: ReactNode; wide?: boolean; top?: ReactNode }) {
  return (
    <div className="sf">
      <header className="sf-top">
        {top ?? (
          <img className="sf-logo" src="/digit-logo.png" alt="DIGIT" width={528} height={124} />
        )}
      </header>
      <main className={`sf-col${wide ? ' is-wide' : ''}`}>{children}</main>
    </div>
  );
}

function SignUp({
  headingRef,
  onDone,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  onDone: (via: Provider, email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) setError('Enter your email address');
    else if (!EMAIL_RE.test(email.trim()))
      setError('Enter an email address in the correct format, like name@example.com');
    else return onDone('email', email.trim());
    inputRef.current?.focus();
  };

  return (
    <Shell>
      <h1 ref={headingRef} tabIndex={-1}>
        Create your account
      </h1>
      <p className="sf-lead">Use your work account, or sign up with your email.</p>

      <div className="sf-sso">
        <button type="button" className="sf-sso-btn" onClick={() => onDone('google', '')}>
          <GoogleMark />
          Continue with Google
        </button>
        <button type="button" className="sf-sso-btn" onClick={() => onDone('microsoft', '')}>
          <MicrosoftMark />
          Continue with Microsoft
        </button>
      </div>

      <p className="sf-or">
        <span>or</span>
      </p>

      <form onSubmit={submit} noValidate className="sf-form">
        <Field id={`${uid}-email`} label="Work email" error={error}>
          <input
            ref={inputRef}
            id={`${uid}-email`}
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="name@organization.gov"
            value={email}
            aria-invalid={!!error}
            aria-describedby={error ? `${uid}-email-err` : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
          />
        </Field>
        <div className="sf-full">
          <Button variation="primary" label="Continue with Email" onClick={submit} />
        </div>
      </form>

      <p className="sf-fine">
        By continuing, you agree to the DIGIT terms of use and privacy policy.
      </p>
    </Shell>
  );
}

/** Log in with the emailed details. The language chosen here sticks. */
function Login({
  a,
  headingRef,
  onLanguage,
  onDone,
}: {
  a: Answers;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onLanguage: (l: string) => void;
  onDone: () => void;
}) {
  const uid = useId();
  const [user, setUser] = useState(a.email);
  const [pass, setPass] = useState(TEMP_PASSWORD);
  const [errors, setErrors] = useState<{ user?: string; pass?: string }>({});

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const err = {
      user: user.trim() ? '' : 'Enter your username',
      pass: pass ? '' : 'Enter your password',
    };
    setErrors(err);
    if (err.user || err.pass) return;
    onDone();
  };

  const top = (
    <div className="sf-login-top">
      <img className="sf-logo" src="/digit-logo.png" alt="DIGIT" width={528} height={124} />
      <label className="sf-lang">
        <Icon name="Translate" size={18} />
        <span className="ux-visually-hidden">Language</span>
        <select value={a.language} onChange={(e) => onLanguage(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <Shell top={top}>
      <h1 ref={headingRef} tabIndex={-1}>
        Log in
      </h1>
      <p className="sf-lead">Use the details we emailed you.</p>
      <form onSubmit={submit} noValidate className="sf-form">
        <Field id={`${uid}-u`} label="Username" error={errors.user}>
          <input
            id={`${uid}-u`}
            type="text"
            autoComplete="username"
            value={user}
            aria-invalid={!!errors.user}
            aria-describedby={errors.user ? `${uid}-u-err` : undefined}
            onChange={(e) => setUser(e.target.value)}
          />
        </Field>
        <Field id={`${uid}-p`} label="Password" error={errors.pass}>
          <input
            id={`${uid}-p`}
            type="password"
            autoComplete="current-password"
            value={pass}
            aria-invalid={!!errors.pass}
            aria-describedby={errors.pass ? `${uid}-p-err` : undefined}
            onChange={(e) => setPass(e.target.value)}
          />
        </Field>
        <div className="sf-full">
          <Button variation="primary" label="Log In" onClick={() => submit()} />
        </div>
      </form>
    </Shell>
  );
}

function Questions({
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
  const step = STEPS[q];
  const last = q === STEPS.length - 1;
  const [error, setError] = useState('');
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const uid = useId();

  useEffect(() => setError(''), [q]);

  const value = step.kind === 'text' || step.kind === 'textarea' ? a[step.key] : '';
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (step.kind === 'look') return onNext();
    if (step.kind === 'multi') {
      if (!a.products.length) {
        setError(step.error);
        requestAnimationFrame(() => document.getElementById(`${uid}-0`)?.focus());
        return;
      }
      return onNext();
    }
    if (!step.optional && !value.trim()) {
      setError(step.error ?? '');
      requestAnimationFrame(() => fieldRef.current?.focus());
      return;
    }
    onNext();
  };

  const top = (
    <div className="sf-progress-top">
      <button type="button" className="sf-back" onClick={onBack}>
        <Icon name="ArrowBack" size={18} />
        Back
      </button>
      <span className="sf-progress" aria-hidden="true">
        <span style={{ width: `${((q + 1) / STEPS.length) * 100}%` }} />
      </span>
      <span className="sf-count">{last ? 'Last one' : `${q + 1} of ${STEPS.length}`}</span>
    </div>
  );

  return (
    <Shell top={top}>
      <p className="ux-visually-hidden">
        Question {q + 1} of {STEPS.length}
      </p>
      <h1 ref={headingRef} tabIndex={-1}>
        {step.heading(a)}
      </h1>
      <p className="sf-lead">{step.body}</p>

      <form onSubmit={submit} noValidate className="sf-form">
        {step.kind === 'look' ? (
          <Look a={a} update={update} />
        ) : step.kind === 'multi' ? (
          <fieldset className={`sf-choices${error ? ' has-error' : ''}`}>
            <legend className="ux-visually-hidden">{step.label}</legend>
            {error && <ErrorText id={`${uid}-err`}>{error}</ErrorText>}
            {step.options.map((o, n) => {
              const checked = a.products.includes(o.value as Product);
              return (
                <label key={o.value} className={`sf-choice${checked ? ' is-checked' : ''}`}>
                  <input
                    id={`${uid}-${n}`}
                    type="checkbox"
                    value={o.value}
                    checked={checked}
                    aria-describedby={error ? `${uid}-err` : undefined}
                    onChange={() => {
                      const p = o.value as Product;
                      update({
                        products: checked ? a.products.filter((x) => x !== p) : [...a.products, p],
                      });
                      setError('');
                    }}
                  />
                  <span className="sf-choice-icon" aria-hidden="true">
                    <Icon name={o.icon} size={22} />
                  </span>
                  <span className="sf-choice-text">
                    <span className="sf-choice-label">{o.label}</span>
                    <span className="sf-choice-hint">{o.hint}</span>
                  </span>
                  <span className="sf-choice-tick is-box" aria-hidden="true">
                    <Icon name="Check" size={14} />
                  </span>
                </label>
              );
            })}
          </fieldset>
        ) : (
          <Field
            id={`${uid}-f`}
            label={step.label}
            optional={step.optional}
            hint={step.hint}
            error={error}
          >
            {step.kind === 'text' ? (
              <input
                ref={fieldRef}
                id={`${uid}-f`}
                type="text"
                autoComplete={step.key === 'name' ? 'name' : 'organization'}
                placeholder={step.placeholder}
                value={value}
                aria-invalid={!!error}
                aria-describedby={describe(uid, step.hint, error)}
                onChange={(e) => {
                  update({ [step.key]: e.target.value });
                  setError('');
                }}
              />
            ) : (
              <textarea
                ref={fieldRef}
                id={`${uid}-f`}
                rows={3}
                placeholder={step.placeholder}
                value={value}
                aria-describedby={describe(uid, step.hint, error)}
                onChange={(e) => update({ [step.key]: e.target.value })}
              />
            )}
          </Field>
        )}

        <div className="sf-full">
          <Button
            variation="primary"
            label={last && a.invites.trim() ? 'Send Invites' : 'Continue'}
            onClick={() => submit()}
          />
        </div>
        {step.kind === 'look' && (
          <div className="sf-full">
            <Button variation="link" label="Skip" onClick={() => onNext()} />
          </div>
        )}
        {step.key === 'invites' && (
          <div className="sf-full">
            <Button
              variation="link"
              label="Skip"
              onClick={() => {
                update({ invites: '' });
                onNext({ invites: '' });
              }}
            />
          </div>
        )}
      </form>
    </Shell>
  );
}

/** Logo and colour, with a live preview of their console header. */
function Look({ a, update }: { a: Answers; update: (p: Partial<Answers>) => void }) {
  const uid = useId();
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');
  const org = a.org.trim() || 'Your organisation';
  const colour = a.colour || BRAND_COLOURS[0].value;

  const take = (file?: File) => {
    if (!file) return;
    if (!/^image\/(png|svg\+xml|jpeg)$/.test(file.type)) {
      setError('Choose a PNG, SVG or JPG image');
      return;
    }
    setError('');
    // A data URL, so the logo survives a reload.
    const r = new FileReader();
    r.onload = () => update({ logo: String(r.result) });
    r.readAsDataURL(file);
  };

  return (
    <>
      <figure className="lk-preview" aria-label="Preview of your workspace">
        <div className="lk-bar">
          {a.logo ? (
            <img src={a.logo} alt="" className="lk-logo" />
          ) : (
            <span className="lk-mark" style={{ background: colour }} aria-hidden="true">
              {org.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="lk-org">{org}</span>
        </div>
        <div className="lk-body">
          <span className="lk-line" />
          <span className="lk-line is-short" />
          <span className="lk-btn" style={{ background: colour }} aria-hidden="true" />
        </div>
        <figcaption className="ux-visually-hidden">
          {org}, {a.logo ? 'with your logo' : 'no logo yet'},{' '}
          {BRAND_COLOURS.find((c) => c.value === colour)?.label ?? ''} colour
        </figcaption>
      </figure>

      <div className={`sf-field${error ? ' has-error' : ''}`}>
        <span className="sf-label" id={`${uid}-logo`}>
          Logo <span className="sf-optional">(optional)</span>
        </span>
        <p className="sf-hint" id={`${uid}-logo-hint`}>
          PNG, SVG or JPG, at least 128 pixels square.
        </p>
        {error && <ErrorText id={`${uid}-logo-err`}>{error}</ErrorText>}
        <label
          className={`lk-drop${over ? ' is-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            take(e.dataTransfer.files[0]);
          }}
        >
          <input
            type="file"
            accept="image/png,image/svg+xml,image/jpeg"
            aria-labelledby={`${uid}-logo`}
            aria-describedby={`${uid}-logo-hint${error ? ` ${uid}-logo-err` : ''}`}
            onChange={(e) => take(e.target.files?.[0])}
          />
          <span className="lk-drop-icon" aria-hidden="true">
            <Icon name="CloudUpload" size={22} />
          </span>
          <span>
            <strong>{a.logo ? 'Replace logo' : 'Upload your logo'}</strong>
            <span className="lk-drop-sub">or drag it here</span>
          </span>
        </label>
        {a.logo && (
          <button type="button" className="sf-link lk-remove" onClick={() => update({ logo: '' })}>
            Remove logo
          </button>
        )}
      </div>

      <fieldset className="sf-field lk-colours">
        <legend className="sf-label">
          Colour <span className="sf-optional">(optional)</span>
        </legend>
        <div className="lk-swatches">
          {BRAND_COLOURS.map((c) => (
            <label key={c.value} className={`lk-swatch${a.colour === c.value ? ' is-on' : ''}`}>
              <input
                type="radio"
                name={`${uid}-colour`}
                value={c.value}
                checked={a.colour === c.value}
                onChange={() => update({ colour: c.value })}
              />
              <span className="lk-dot" style={{ background: c.value }} aria-hidden="true" />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

/* ---------------------------------------------------------------- */

function describe(uid: string, hint?: string, error?: string) {
  return (
    [error ? `${uid}-f-err` : '', hint ? `${uid}-f-hint` : ''].filter(Boolean).join(' ') ||
    undefined
  );
}

function Field({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={`sf-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {optional && <span className="sf-optional"> (optional)</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="sf-hint">
          {hint}
        </p>
      )}
      {error && <ErrorText id={`${id}-err`}>{error}</ErrorText>}
      {children}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="sf-error">
      <span className="ux-visually-hidden">Error: </span>
      {children}
    </p>
  );
}

/* Brand marks for the sign-in buttons (decorative; the text names them). */
function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true" focusable="false">
      <rect x="0" y="0" width="10" height="10" fill="#F25022" />
      <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
      <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
      <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}
