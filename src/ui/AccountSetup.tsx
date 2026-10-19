import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { todoDone, todoResult, todosFor, type PageId, type TodoId } from '../lib/model';
import { firstName } from '../setup/steps';

/**
 * The account to-do, at the top of Home until it's done. A checklist: a
 * status circle per row, a segmented bar (one segment per row), what each
 * step unlocks, and one filled button only, on the next step.
 */

const TASK: Record<TodoId, { title: string; why: string; time: string; page: PageId; action: string }> = {
  geography: {
    title: 'Add the areas you work in',
    why: 'Products use them to know where things happen.',
    time: 'About 5 min · unlocks opening any product',
    page: 'geographies',
    action: 'Add areas',
  },
  sender: {
    title: 'Set up notification channels',
    why: 'So citizens get SMS and email updates.',
    time: 'About 5 min · then a few days to approve',
    page: 'sender',
    action: 'Set up',
  },
  users: {
    title: 'Invite your team',
    why: 'So you can give people roles and assign them work.',
    time: 'About 2 min · unlocks assigning people',
    page: 'team',
    action: 'Add emails',
  },
};

const COUNT = ['', 'One', 'Two', 'Three', 'Four', 'Five'];

export function AccountSetup() {
  const { account, answers, go } = useAccount();
  const todos = todosFor(account);
  const done = todos.filter((t) => todoDone(t.id, account)).length;
  const next = todos.find((t) => !todoDone(t.id, account))?.id;

  return (
    <div className="as">
      <header className="as-head">
        <h1 tabIndex={-1}>
          Hi {firstName(answers) || 'there'}{' '}
          <span className="as-wave" aria-hidden="true">
            👋
          </span>
        </h1>
        <p className="as-lead">{COUNT[todos.length] ?? todos.length} quick steps unlock your products.</p>
      </header>

      <section className="as-panel" aria-labelledby="as-panel-h">
        <div className="as-panel-head">
          <h2 id="as-panel-h">
            <span className="as-tag">Account</span>
            Your to-do
          </h2>
          <p className="as-count">
            {done} of {todos.length} done
          </p>
        </div>
        {/* one segment per step, filled as each is done */}
        <div
          className="as-segs"
          role="progressbar"
          aria-label="Account to-do"
          aria-valuemin={0}
          aria-valuemax={todos.length}
          aria-valuenow={done}
        >
          {todos.map((t) => (
            <span key={t.id} className={todoDone(t.id, account) ? 'is-on' : undefined} />
          ))}
        </div>

        <ul className="as-list">
          {todos.map((t) => {
            const isDone = todoDone(t.id, account);
            const isNext = t.id === next;
            const task = TASK[t.id];
            return (
              <li key={t.id} className={`as-row${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}`}>
                <span className="as-status" aria-hidden="true">
                  {isDone && <Icon name="Check" size={14} />}
                </span>
                <div className="as-body">
                  <h3>
                    {task.title}
                    <span className="ux-visually-hidden">{isDone ? ' (done)' : ' (to do)'}</span>
                  </h3>
                  <p className="as-why">{isDone ? todoResult(t.id, account) : task.why}</p>
                  {!isDone && <p className="as-time">{task.time}</p>}
                </div>
                <div className="as-cta">
                  {isNext ? (
                    <Button variation="primary" label={task.action} onClick={() => go(task.page)} />
                  ) : (
                    <button type="button" className="as-link" onClick={() => go(task.page)}>
                      {isDone ? 'View' : task.action}
                      <span aria-hidden="true"> →</span>
                      <span className="ux-visually-hidden">: {task.title}</span>
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
