import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { firstName } from '../setup/steps';

/**
 * The onboarding tour: a welcome card on first landing (take the tour or skip it), then five steps that
 * spotlight the side nav and Help. Each step is a small dialog beside what it describes: focus moves into
 * it, Tab stays inside, Escape ends the tour. Help can replay it any time.
 */
const STEPS: { target: string; title: string; text: string }[] = [
  {
    target: 'setup',
    title: 'Start with these two',
    text: 'Add your geographies and notification channels first. Your products need both before they can go live.',
  },
  {
    target: 'team',
    title: 'Bring in your team',
    text: 'Invite people, choose their role and the products they can use.',
  },
  {
    target: 'brand',
    title: 'Make it yours',
    text: 'Set your colours and logo in Branding, and add the languages your citizens and staff use in Language.',
  },
  {
    target: 'more',
    title: 'Connect your systems',
    text: 'Connect the systems you already use in Integrations, and see how your products are doing in Product Health.',
  },
  {
    target: 'help',
    title: 'Help is always here',
    text: 'Find guides and answers in Help. You can replay this tour from there any time.',
  },
];

type Rect = { top: number; left: number; width: number; height: number };

/** The box around every element marked data-tour="…" (a step can cover a group of nav items). */
function targetRect(name: string): Rect | null {
  const els = [...document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)].filter((e) => e.offsetParent !== null);
  if (!els.length) return null;
  const rs = els.map((e) => e.getBoundingClientRect());
  const top = Math.min(...rs.map((r) => r.top));
  const left = Math.min(...rs.map((r) => r.left));
  return { top, left, width: Math.max(...rs.map((r) => r.right)) - left, height: Math.max(...rs.map((r) => r.bottom)) - top };
}

/** Keeps Tab and Shift+Tab inside the card. */
function trapTab(e: React.KeyboardEvent, box: HTMLElement | null) {
  if (e.key !== 'Tab' || !box) return;
  const f = [...box.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]')];
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && (document.activeElement === first || document.activeElement === box.querySelector('h2'))) (e.preventDefault(), last.focus());
  else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
}

export function Tour({ start, onDone }: { start: 'welcome' | 'steps'; onDone: () => void }) {
  const { answers } = useAccount();
  const uid = useId();
  const [step, setStep] = useState(start === 'welcome' ? -1 : 0);
  const [rect, setRect] = useState<Rect | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const back = useRef<Element | null>(document.activeElement);

  // Where the current step's target is, kept up to date on resize and scroll
  useLayoutEffect(() => {
    if (step < 0) return;
    const place = () => setRect(targetRect(STEPS[step].target));
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [step]);
  useEffect(() => {
    requestAnimationFrame(() => head.current?.focus());
  }, [step]);
  const end = () => {
    onDone();
    (back.current as HTMLElement | null)?.focus?.();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      end();
    } else trapTab(e, card.current);
  };

  // Welcome
  if (step < 0)
    return createPortal(
      <div className="tour-scrim">
        <div ref={card} className="tour-welcome" role="dialog" aria-modal="true" aria-labelledby={`${uid}-h`} aria-describedby={`${uid}-d`} onKeyDown={onKey}>
          <span className="tour-welcome-mark" aria-hidden="true">
            <Icon name="AutoAwesome" size={28} />
          </span>
          <h2 id={`${uid}-h`} ref={head} tabIndex={-1}>
            Hi {firstName(answers)}, welcome to DIGIT
          </h2>
          <p id={`${uid}-d`}>Take a quick tour to see where everything is. It has five short steps.</p>
          <div className="tour-welcome-actions">
            <Button variation="secondary" label="Skip tour" onClick={end} />
            <Button variation="primary" label="Take a quick tour" onClick={() => setStep(0)} />
          </div>
        </div>
      </div>,
      document.body,
    );

  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  // Nav steps sit to the right of the nav; the Help step sits under the Help button
  const PAD = 6;
  const below = s.target === 'help';
  const W = 340;
  const pos = rect
    ? below
      ? { top: rect.top + rect.height + PAD + 14, left: Math.max(16, rect.left + rect.width - W) }
      : { top: Math.max(16, Math.min(window.innerHeight - 260, rect.top + rect.height / 2 - 90)), left: rect.left + rect.width + PAD + 16 }
    : { top: window.innerHeight / 2 - 120, left: window.innerWidth / 2 - W / 2 };
  const arrowTop = rect && !below ? Math.max(20, Math.min(220, rect.top + rect.height / 2 - pos.top)) : undefined;

  return createPortal(
    <div className="tour-layer">
      {/* The spotlight: a clear box over the target, everything else dimmed */}
      {rect ? (
        <div className="tour-spot" aria-hidden="true" style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }} />
      ) : (
        <div className="tour-scrim" aria-hidden="true" />
      )}
      <div
        ref={card}
        className={`tour-card${below ? ' is-below' : ' is-right'}`}
        style={{ top: pos.top, left: pos.left, width: W, ['--arrow-top' as string]: arrowTop !== undefined ? `${arrowTop}px` : undefined }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-h`}
        aria-describedby={`${uid}-d`}
        onKeyDown={onKey}
      >
        <div className="tour-card-top">
          <p className="tour-step">
            Step {step + 1} of {STEPS.length}
          </p>
          <button type="button" className="ag-x is-sm" aria-label="End tour" onClick={end}>
            <Icon name="Close" size={18} />
          </button>
        </div>
        <h2 id={`${uid}-h`} ref={head} tabIndex={-1}>
          {s.title}
        </h2>
        <p id={`${uid}-d`}>{s.text}</p>
        <div className="tour-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? 'is-on' : i < step ? 'is-done' : undefined} />
          ))}
        </div>
        <div className="tour-card-foot">
          <button type="button" className="lp-link tour-skip" onClick={end}>
            Skip tour
          </button>
          <div className="tour-card-nav">
            {step > 0 && <Button variation="secondary" size="medium" label="Back" onClick={() => setStep(step - 1)} />}
            <Button variation="primary" size="medium" label={last ? 'Finish' : 'Next'} onClick={() => (last ? end() : setStep(step + 1))} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
