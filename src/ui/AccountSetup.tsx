import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { todoDone, todoResult, todosFor, type PageId, type TodoId } from '../lib/model';

/**
 * The account to-do, leading Home until it's done. Full width. Each step has
 * an icon, its title with the action on the right, what to do, an info note
 * on why it matters, and a time tag. Only the next step gets a filled button.
 */

const TASK: Record<
  TodoId,
  { title: string; what: string; why: string; minutes: number; icon: string; page: PageId; action: string }
> = {
  geography: {
    title: 'Add the areas you work in',
    what: 'Search for your areas, or create your own.',
    why: 'Products use them to know where people, complaints and campaigns are.',
    minutes: 5,
    icon: 'Public',
    page: 'geographies',
    action: 'Add areas',
  },
  sender: {
    title: 'Set up notification channels',
    what: 'Choose how citizens and staff get SMS and email.',
    why: 'Approval can take a few days, so start early.',
    minutes: 5,
    icon: 'Email',
    page: 'sender',
    action: 'Set up channels',
  },
  users: {
    title: 'Invite your team',
    what: 'Add the emails of the people who’ll work with you.',
    why: 'You’ll need them to give roles and assign work.',
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
        <h1 tabIndex={-1}>Let’s complete account setup</h1>
        <p className="as-lead">Finish these {COUNT[todos.length] ?? todos.length} things to unlock your products.</p>
      </header>

      <section className="as-panel" aria-labelledby="as-panel-h">
        <div className="as-panel-head">
          <h2 id="as-panel-h">What you need to do</h2>
          <p className="as-count">
            {done} of {todos.length} done
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

        <ul className="as-list">
          {todos.map((t) => {
            const isDone = todoDone(t.id, account);
            const isNext = t.id === next;
            const task = TASK[t.id];
            return (
              <li key={t.id} className={`as-row${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}`}>
                <span className="as-icon" aria-hidden="true">
                  <Icon name={isDone ? 'Check' : task.icon} size={20} />
                </span>
                <div className="as-body">
                  <div className="as-top">
                    <h3>
                      {task.title}
                      <span className="ux-visually-hidden">{isDone ? ' (done)' : ' (to do)'}</span>
                    </h3>
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
                  </div>
                  {isDone ? (
                    <p className="as-result">{todoResult(t.id, account)}</p>
                  ) : (
                    <>
                      <p className="as-what">{task.what}</p>
                      <p className="as-why">
                        <Icon name="Info" size={16} />
                        <span>{task.why}</span>
                      </p>
                      <span className="as-time">
                        <Icon name="Schedule" size={14} />
                        {task.minutes} min
                      </span>
                    </>
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
