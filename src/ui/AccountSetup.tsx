import { Button, Card } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { todoDone, todoResult, todosFor, type PageId, type TodoId } from '../lib/model';

/**
 * The account to-do, leading Home until it's done. A centred column: a header,
 * the welcome, the progress, then one DIGIT Card per step: its icon, title and
 * time, then what to do, why it matters (an info box) and a primary button.
 */

const TASK: Record<
  TodoId,
  { title: string; what: string; why: string; minutes: number; icon: string; page: PageId; action: string }
> = {
  geography: {
    title: 'Add your geographies',
    what: 'Add the places where you work, from the largest area down to the smallest.',
    why: 'Every product uses your geographies to know where things happen.',
    minutes: 5,
    icon: 'Public',
    page: 'geographies',
    action: 'Add geographies',
  },
  sender: {
    title: 'Set up notification channels',
    what: 'Connect your SMS and email services, and choose who messages come from.',
    why: 'Updates go out in your organisation’s name, so your products need your services and sender details.',
    minutes: 5,
    icon: 'Email',
    page: 'sender',
    action: 'Set up channels',
  },
  users: {
    title: 'Invite your team',
    what: 'Add the emails of the people who’ll work with you.',
    why: 'Once your team is in, you can give each person a role and assign them work.',
    minutes: 2,
    icon: 'Group',
    page: 'team',
    action: 'Add emails',
  },
};

const COUNT = ['no', 'one', 'two', 'three', 'four', 'five'];

export function AccountSetup() {
  const { account, go } = useAccount();
  const todos = todosFor(account);
  const done = todos.filter((t) => todoDone(t.id, account)).length;

  return (
    <div className="as">
      <header className="as-head">
        <div className="as-wrap">
          <p className="as-eyebrow">Welcome aboard</p>
          <h1 tabIndex={-1}>
            Let’s complete <em>account setup</em>
          </h1>
          <p className="as-lead">Finish these {COUNT[todos.length] ?? todos.length} things to unlock your products.</p>
          <div className="as-progress">
            <p id="as-progress-l">Your account setup</p>
            <p className="as-count">
              <strong>{done}</strong> of {todos.length} done
            </p>
          </div>
          <div
            className="as-bar"
            role="progressbar"
            aria-labelledby="as-progress-l"
            aria-valuemin={0}
            aria-valuemax={todos.length}
            aria-valuenow={done}
            aria-valuetext={`${done} of ${todos.length} done`}
          >
            <span style={{ width: `${(done / todos.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <section className="as-wrap" aria-label="What you need to do">
        <ol className="as-list">
          {todos.map((t) => {
            const isDone = todoDone(t.id, account);
            const task = TASK[t.id];
            return (
              <li key={t.id}>
                <Card className={`as-card${isDone ? ' is-done' : ''}`}>
                  <div className="as-top">
                    <h3>
                      <span className="as-icon" aria-hidden="true">
                        <Icon name={isDone ? 'Check' : task.icon} size={18} />
                      </span>
                      {task.title}
                    </h3>
                    {!isDone && (
                      <p className="as-time">
                        <Icon name="Schedule" size={16} />
                        {task.minutes} min
                      </p>
                    )}
                  </div>
                  <div className="as-body">
                    {isDone ? (
                      <p className="as-result">{todoResult(t.id, account)}</p>
                    ) : (
                      <>
                        <p className="as-what">{task.what}</p>
                        <p className="as-why">
                          <Icon name="Info" size={18} />
                          <span>{task.why}</span>
                        </p>
                      </>
                    )}
                    <div className="as-foot">
                      <Button
                        variation={isDone ? 'secondary' : 'primary'}
                        label={isDone ? 'View' : task.action}
                        title={isDone ? `View: ${task.title}` : undefined}
                        icon="ArrowForward"
                        isSuffix
                        onClick={() => go(task.page)}
                      />
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
