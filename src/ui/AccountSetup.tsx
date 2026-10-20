import { useEffect, useRef, useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { Geographies } from './Geographies';
import { Channels } from './Channels';
import { Team } from './Team';
import { usePageToast } from './PageToast';
import { TaskBody } from './TaskCard';
import { firstName } from '../setup/steps';
import { todoDone, todosFor, type PageId, type TodoId } from '../lib/model';

/**
 * The account to-do, leading Home until it's done. A centred column: a header,
 * the welcome, the progress, then one DIGIT Card per step: its icon, title and
 * time (or, once done, a blue tag with what was done), then what to do and why it
 * matters as one description, and a button.
 */

const TASK: Record<
  TodoId,
  { title: string; what: string; why: string; minutes: number; icon: string; page: PageId; action: string; view: string }
> = {
  geography: {
    title: 'Add your geographies',
    what: 'Add the geographies you’ll serve, wherever your team sits.',
    why: 'Every product uses your geographies to know where things happen, so work reaches the right place.',
    minutes: 5,
    icon: 'Public',
    page: 'geographies',
    action: 'Add geographies',
    view: 'View geographies',
  },
  sender: {
    title: 'Set up notification channels',
    what: 'Connect your SMS and email services, and choose who messages come from.',
    why: 'Updates go out in your organisation’s name, so your products need your services and sender details.',
    minutes: 5,
    icon: 'Email',
    page: 'sender',
    action: 'Add notification channels',
    view: 'View channels',
  },
  users: {
    title: 'Invite your team',
    what: 'Add the emails of the people who’ll work with you.',
    why: 'Once your team is in, you can give each person a role and assign them work.',
    minutes: 2,
    icon: 'Group',
    page: 'team',
    action: 'Add team members',
    view: 'View team members',
  },
};

/**
 * The orange header on Home once they're past the first landing. The same words whatever's
 * done, so it reads as their account's starting point rather than a setup step.
 */
export function HomeHeader({ ref, children }: { ref?: React.Ref<HTMLHeadingElement>; children?: React.ReactNode }) {
  const { answers } = useAccount();
  const org = answers.org.trim() || 'your organisation';
  return (
    <header className="pk-head">
      <h1 ref={ref} tabIndex={-1}>
        Hi <em>{firstName(answers)}</em>
      </h1>
      <p>Your one stop to access your products for {org}, manage your account and its settings.</p>
      {children}
    </header>
  );
}

/** onFlow: tells Home when a setup flow takes over the page, so it can hide the products. */
export function AccountSetup({ onFlow }: { onFlow?: (open: boolean) => void } = {}) {
  const { account, answers } = useAccount();
  const todos = todosFor(account);
  // Only what's left: a finished step drops off, so they pick up where they left off.
  const open = todos.filter((t) => !todoDone(t.id, account));
  // They stay on the setup page until their geographies are in; only then does Home open up.
  const started = todoDone('geography', account);
  const doneCount = todos.length - open.length;
  // Adding geographies happens right here on Home, not on the Geographies page.
  const [addingGeo, setAddingGeo] = useState(false);
  const [addingSender, setAddingSender] = useState(false);
  const [addingTeam, setAddingTeam] = useState(false);
  const [toastEl, showToast] = usePageToast();
  const heading = useRef<HTMLHeadingElement>(null);
  const wasAdding = useRef(false);
  useEffect(() => {
    if (wasAdding.current && !addingGeo && !addingSender && !addingTeam) heading.current?.focus();
    wasAdding.current = addingGeo || addingSender || addingTeam;
    onFlow?.(addingGeo || addingSender || addingTeam);
  }, [addingGeo, addingSender, addingTeam, onFlow]);

  const back = (set: (v: boolean) => void) => (message?: string) => {
    set(false);
    if (message) showToast(message);
  };
  if (addingGeo) return <Geographies embedded onDone={back(setAddingGeo)} />;
  if (addingSender) return <Channels embedded onDone={back(setAddingSender)} />;
  if (addingTeam) return <Team embedded onDone={() => setAddingTeam(false)} />;

  const start = (id: TodoId) => (id === 'geography' ? setAddingGeo(true) : id === 'sender' ? setAddingSender(true) : setAddingTeam(true));

  // After the first step: the orange header greets them; what's left is its own section, the step as a card.
  if (started) {
    return (
      <div className="pk">
        {toastEl}
        <HomeHeader ref={heading} />
        {/* What's left: its own section under the header, like the product sections, the step as a card */}
        <section className="hm-sec pk-sec" aria-labelledby="pk-h">
            <h2 id="pk-h" className="geo-section-h pk-sec-h">
              Finish setting up your account <span className="geo-section-n">{open.length} left</span>
            </h2>
            <ul className="pk-next-list pk-next">
              {open.map((t) => {
                const task = TASK[t.id];
                return (
                  <li key={t.id} className="pk-next-row">
                    <span className="pk-icon" aria-hidden="true">
                      <Icon name={task.icon} size={22} />
                    </span>
                    <span className="pk-text">
                      <span className="pk-title-row">
                        <strong className="pk-title">{task.title}</strong>
                        <span className="pk-time">
                          <Icon name="Schedule" size={14} />
                          {task.minutes} min
                        </span>
                      </span>
                      <span className="pk-what">
                        {task.what} {task.why}
                      </span>
                    </span>
                    <Button variation="primary" label={task.action} icon="ArrowForward" isSuffix onClick={() => start(t.id)} />
                  </li>
                );
              })}
            </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="as">
      {toastEl}
      <header className="as-head">
        <div className="as-wrap">
          <p className="as-eyebrow">Welcome aboard, {firstName(answers)}</p>
          <h1 ref={heading} tabIndex={-1}>
            Let’s set up <em>your account</em>
          </h1>
          <p className="as-lead">Complete the following tasks to set up your account and get your products ready to use.</p>
          <div className="as-progress">
            <p id="as-prog-l">Your account setup progress</p>
            <p className="as-count">
              <strong>{doneCount}</strong> of {todos.length} done
            </p>
          </div>
          <div
            className="as-bar"
            role="progressbar"
            aria-labelledby="as-prog-l"
            aria-valuemin={0}
            aria-valuemax={todos.length}
            aria-valuenow={doneCount}
            aria-valuetext={`${doneCount} of ${todos.length} done`}
          >
            <span style={{ width: `${(doneCount / todos.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <section className="as-wrap" aria-label="What you need to do">
        <ol className="as-list">
          {open.map((t) => (
            <li key={t.id}>
              {/* The same card as Home's task, with its orange edge */}
              <section className="lp-task as-task" aria-labelledby={`as-t-${t.id}`}>
                <TaskBody id={t.id} headingId={`as-t-${t.id}`} onStart={() => start(t.id)} />
              </section>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
