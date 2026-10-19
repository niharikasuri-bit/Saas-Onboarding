import { Button, Card } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { todoDone, todoResult, todosFor, type PageId, type TodoId } from '../lib/model';

/**
 * The account to-do, leading Home until it's done. A centred column: a header,
 * the progress, then one DIGIT Card per step with its number, title and status
 * tag, what to do, why it matters, the time it takes and a primary button.
 */

const TASK: Record<
  TodoId,
  { title: string; what: string; why: string; minutes: number; icon: string; page: PageId; action: string }
> = {
  geography: {
    title: 'Add your geographies',
    what: 'Add the places where you work.',
    why: 'Every product uses your geographies to know where things happen.',
    minutes: 5,
    icon: 'Public',
    page: 'geographies',
    action: 'Add geographies',
  },
  sender: {
    title: 'Set up notification channels',
    what: 'Connect your SMS and email services, and choose who messages come from.',
    why: 'Set it up once here, and every product can send messages to citizens and staff.',
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
  const next = todos.find((t) => !todoDone(t.id, account))?.id;

  return (
    <div className="as">
      <header className="as-head">
        <div className="as-wrap">
          <p className="as-eyebrow">
            <span aria-hidden="true" />
            Welcome aboard
          </p>
          <h1 tabIndex={-1}>
            Let’s complete <em>account setup</em>
          </h1>
          <p className="as-lead">Finish these {COUNT[todos.length] ?? todos.length} things to unlock your products.</p>
        </div>
      </header>

      <section className="as-wrap" aria-labelledby="as-panel-h">
        <div className="as-progress">
          <h2 id="as-panel-h">What you need to do</h2>
          <p className="as-count">
            <strong>{done}</strong> of {todos.length} done
          </p>
        </div>
        <div
          className="as-bar"
          role="progressbar"
          aria-label="Account setup"
          aria-valuemin={0}
          aria-valuemax={todos.length}
          aria-valuenow={done}
        >
          <span style={{ width: `${(done / todos.length) * 100}%` }} />
        </div>

        <ol className="as-list">
          {todos.map((t, i) => {
            const isDone = todoDone(t.id, account);
            const task = TASK[t.id];
            return (
              <li key={t.id}>
                <Card className={`as-card${isDone ? ' is-done' : ''}${t.id === next ? ' is-next' : ''}`}>
                  <div className="as-side" aria-hidden="true">
                    <span className="as-icon">
                      <Icon name={isDone ? 'Check' : task.icon} size={22} />
                    </span>
                    <span className="as-num">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="as-body">
                    <h3>
                      {task.title}
                      <span className={`as-tag${isDone ? ' is-done' : ''}`}>{isDone ? 'Done' : 'To do'}</span>
                    </h3>
                    {isDone ? (
                      <p className="as-result">{todoResult(t.id, account)}</p>
                    ) : (
                      <>
                        <p className="as-what">{task.what}</p>
                        <p className="as-why">{task.why}</p>
                      </>
                    )}
                    <div className="as-foot">
                      {isDone ? (
                        <span />
                      ) : (
                        <span className="as-time">
                          <Icon name="Schedule" size={16} />
                          {task.minutes} min
                        </span>
                      )}
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
