import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode, RefObject } from 'react';
import { Button, TextInput } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import {
  DEFAULT_LOGIN,
  DEMO_ACCOUNT,
  EMPTY_ANSWERS,
  type Answers,
  type Provider,
} from './steps';
import { WelcomeArt } from './WelcomeArt';
import { Backdrop } from './Backdrop';
import { GROUPS, Questions } from './Questions';
import { Building } from './Building';
import { Language } from './Language';
import '../styles/setup.css';

type Props = { onDone: (a: Answers) => void };
type Stage = 'blank' | 'welcome' | 'signup' | 'login' | 'language' | 'questions' | 'building';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Welcome → sign up (email, then a password; or a work account) → choose a
 * language → a few questions → "Setting up your account" → Home. Log in is one click away from sign-up.
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

  if (stage === 'language')
    return (
      <Language
        a={a}
        headingRef={headingRef}
        update={update}
        onBack={() => setStage('signup')}
        onNext={() => {
          setQ(0);
          setStage('questions');
        }}
      />
    );

  if (stage === 'building') return <Building a={a} headingRef={headingRef} onDone={() => onDone(a)} />;

  if (stage === 'welcome') {
    return (
      <div className="sf wl">
        <main className="wl-grid">
          <div className="wl-copy">
            <h1 className="wl-title sf-rise">
              Welcome to <img src="/digit-logo.png" alt="DIGIT" width={528} height={124} />
            </h1>
            <p className="sf-lead wl-lead sf-rise sf-d2">
              Public services work better when the people who run them have the right tools.
            </p>
            <p className="wl-start sf-rise sf-d2">Let’s get you started.</p>
            <div className="sf-rise sf-d3 sf-full wl-cta">
              <Button variation="primary" label="Get Started" onClick={() => setStage('signup')} />
            </div>
          </div>
          <div className="wl-art sf-rise sf-d2">
            <WelcomeArt />
          </div>
        </main>
      </div>
    );
  }

  if (stage === 'signup') {
    return (
      <SignUp
        headingRef={headingRef}
        onLogin={() => setStage('login')}
        onDone={(via, email) => {
          update(
            via === 'email'
              ? { via, email }
              : { via, email: DEMO_ACCOUNT.email, name: DEMO_ACCOUNT.name },
          );
          // Signed up: straight into the first question, no email check.
          setQ(0);
          setStage('language');
        }}
      />
    );
  }

  if (stage === 'login') {
    return (
      <Login
        a={a}
        headingRef={headingRef}
        onSignUp={() => setStage('signup')}
        onDone={(patch) => {
          update(patch);
          setQ(0);
          setStage('language');
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
      onBack={() => (q === 0 ? setStage('language') : setQ(q - 1))}
      onNext={(patch) => {
        if (q < GROUPS.length - 1) setQ(q + 1);
        else {
          if (patch) update(patch);
          setStage('building');
        }
      }}
    />
  );
}

/* ---------------------------------------------------------------- */

/** The frame shared by sign-up and log-in: brand light behind one card, with an optional Back above it. */
function AuthFrame({
  back,
  children,
  foot,
}: {
  back?: () => void;
  children: ReactNode;
  foot: ReactNode;
}) {
  return (
    <div className="sf su">
      <Backdrop />
      <header className="su-top">
        <img className="sf-logo" src="/digit-logo.png" alt="DIGIT" width={528} height={124} />
      </header>
      <main className="su-main">
        <div className="su-stack">
          {/* The Back row keeps its space on every screen, so the card never jumps. */}
          {back ? (
            <button type="button" className="su-back" onClick={back}>
              <Icon name="ArrowBack" size={20} />
              Back
            </button>
          ) : (
            <span className="su-back is-empty" aria-hidden="true" />
          )}
          <div className="su-card">
            <div className="su-inner">{children}</div>
            <p className="su-foot">{foot}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

/** A labelled DIGIT TextInput with its error above it. */
function DigitField({
  id,
  label,
  type,
  value,
  error,
  inputRef,
  onChange,
}: {
  id: string;
  label: string;
  type: 'email' | 'password';
  value: string;
  error: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (v: string) => void;
}) {
  return (
    <div className={`su-field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
      <div className="text-input digit-text-input-field">
        <TextInput
          id={id}
          name={type}
          type={type}
          label={label}
          inputRef={inputRef}
          value={value}
          error={error || undefined}
          errorStyle={!!error}
          // The library passes the bare value back when the password eye is toggled.
          onChange={(e: string | { target: { value: string } }) => onChange(typeof e === 'string' ? e : e.target.value)}
        />
      </div>
    </div>
  );
}

/** Full-width work-account buttons, under an "or" divider. */
function SocialButtons({ onPick }: { onPick: (via: Provider) => void }) {
  return (
    <>
      <p className="sf-or">
        <span>or</span>
      </p>
      <div className="sf-sso">
        <button type="button" className="sf-sso-btn" onClick={() => onPick('google')}>
          <GoogleMark />
          Continue with Google
        </button>
        <button type="button" className="sf-sso-btn" onClick={() => onPick('microsoft')}>
          <MicrosoftMark />
          Continue with Microsoft
        </button>
      </div>
    </>
  );
}

/** Round icon-only work-account buttons, for the password step. */
function SocialIcons({ onPick }: { onPick: (via: Provider) => void }) {
  return (
    <>
      <p className="sf-or">
        <span>or sign up with</span>
      </p>
      <div className="su-icons">
        <button type="button" className="su-icon" aria-label="Sign up with Google" onClick={() => onPick('google')}>
          <GoogleMark />
        </button>
        <button type="button" className="su-icon" aria-label="Sign up with Microsoft" onClick={() => onPick('microsoft')}>
          <MicrosoftMark />
        </button>
      </div>
    </>
  );
}

const checkEmail = (v: string) =>
  !v.trim()
    ? 'Enter your email address'
    : !EMAIL_RE.test(v.trim())
      ? 'Enter an email address in the correct format, like name@example.com'
      : '';

const TERMS = 'By signing up, you agree to the DIGIT terms of use and acknowledge you’ve read the privacy policy.';

/**
 * Sign up, after Wix: first the email (or a work account); then a second
 * step, with Back, to choose a password and press Sign Up.
 */
function SignUp({
  headingRef,
  onLogin,
  onDone,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  onLogin: () => void;
  onDone: (via: Provider, email: string) => void;
}) {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const first = useRef(true);

  // Moving between the two steps: put the cursor where the next thing to type is.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    requestAnimationFrame(() => (step === 'password' ? passRef : emailRef).current?.focus());
  }, [step]);

  const continueWithEmail = (e?: FormEvent) => {
    e?.preventDefault();
    const err = checkEmail(email);
    if (err) {
      setErrors({ email: err });
      emailRef.current?.focus();
      return;
    }
    setErrors({});
    setStep('password');
  };

  const signUp = (e?: FormEvent) => {
    e?.preventDefault();
    const next = { email: checkEmail(email), password: password ? '' : 'Choose a password' };
    setErrors(next);
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passRef.current?.focus();
    onDone('email', email.trim());
  };

  const heading = (
    <>
      <h1 ref={headingRef} tabIndex={-1}>
        Sign up
      </h1>
      <p className="su-sub">
        Already have an account?{' '}
        <button type="button" className="ux-link su-login" onClick={onLogin}>
          Log in
        </button>
      </p>
    </>
  );

  if (step === 'password')
    return (
      <AuthFrame
        back={() => {
          setErrors({});
          setStep('email');
        }}
        foot={TERMS}
      >
        {heading}
        <form onSubmit={signUp} noValidate className="sf-form">
          <DigitField
            id={`${uid}-email`}
            label="Email"
            type="email"
            value={email}
            error={errors.email ?? ''}
            inputRef={emailRef}
            onChange={(v) => {
              setEmail(v);
              setErrors((x) => ({ ...x, email: '' }));
            }}
          />
          <DigitField
            id={`${uid}-pass`}
            label="Choose a password"
            type="password"
            value={password}
            error={errors.password ?? ''}
            inputRef={passRef}
            onChange={(v) => {
              setPassword(v);
              setErrors((x) => ({ ...x, password: '' }));
            }}
          />
          <div className="sf-full">
            <Button variation="primary" label="Sign Up" submit onClick={() => {}} />
          </div>
        </form>
        <SocialIcons onPick={(via) => onDone(via, '')} />
      </AuthFrame>
    );

  return (
    <AuthFrame foot={TERMS}>
      {heading}
      <form onSubmit={continueWithEmail} noValidate className="sf-form">
        <DigitField
          id={`${uid}-email`}
          label="Email"
          type="email"
          value={email}
          error={errors.email ?? ''}
          inputRef={emailRef}
          onChange={(v) => {
            setEmail(v);
            setErrors({});
          }}
        />
        <div className="sf-full">
          <Button variation="primary" label="Continue with Email" onClick={() => continueWithEmail()} />
        </div>
      </form>
      <SocialButtons onPick={(via) => onDone(via, '')} />
    </AuthFrame>
  );
}

/**
 * Log in, same frame as sign-up. For now any email and password are
 * accepted; it starts filled in with the account just made, or the demo one.
 */
function Login({
  a,
  headingRef,
  onSignUp,
  onDone,
}: {
  a: Answers;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onSignUp: () => void;
  onDone: (patch: Partial<Answers>) => void;
}) {
  const uid = useId();
  const [email, setEmail] = useState(a.email || DEFAULT_LOGIN.email);
  const [pass, setPass] = useState(DEFAULT_LOGIN.password);
  const [resetSent, setResetSent] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    onDone({ email: email.trim() || DEFAULT_LOGIN.email, via: a.via || 'email' });
  };

  return (
    <AuthFrame foot="DIGIT terms of use · Privacy policy">
      <h1 ref={headingRef} tabIndex={-1}>
        Log in
      </h1>
      <p className="su-sub">
        Don’t have an account?{' '}
        <button type="button" className="ux-link su-login" onClick={onSignUp}>
          Sign up
        </button>
      </p>
      <form onSubmit={submit} noValidate className="sf-form">
        <DigitField id={`${uid}-email`} label="Email" type="email" value={email} error="" inputRef={emailRef} onChange={setEmail} />
        <div className="su-pass">
          <DigitField id={`${uid}-pass`} label="Password" type="password" value={pass} error="" inputRef={passRef} onChange={setPass} />
          <button type="button" className="ux-link su-login su-forgot" onClick={() => setResetSent(true)}>
            Forgot password?
          </button>
          {resetSent && (
            <p className="su-note" role="status">
              We’ve sent a reset link to {email.trim() || 'your email'}.
            </p>
          )}
        </div>
        <div className="sf-full">
          <Button variation="primary" label="Log In" submit onClick={() => {}} />
        </div>
      </form>
      <SocialButtons onPick={(via) => onDone({ via, email: DEMO_ACCOUNT.email, name: a.name || DEMO_ACCOUNT.name })} />
    </AuthFrame>
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
