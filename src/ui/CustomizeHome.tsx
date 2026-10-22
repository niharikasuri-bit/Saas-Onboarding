import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { Select } from '../components/Select';
import { useAccount } from '../lib/store';
import { DEFAULT_HOME, type HomeLayout, type HomeWidget, type IntegrationsLayout } from '../lib/model';

export const WIDGET_NAME: Record<HomeWidget, string> = {
  products: 'Your products',
  integrations: 'Your integrations',
  team: 'Your team',
};
const WIDGET_ABOUT: Record<HomeWidget, string> = {
  products: 'Each product in your account, with a way into it.',
  integrations: 'Connect DIGIT to the systems you already use.',
  team: 'Invite people by email and choose their role.',
};
const VIEW_NAME: Record<IntegrationsLayout, string> = { cards: 'Cards', list: 'List', connections: 'Connections' };

/**
 * Customize home: show or hide each section, move it up or down (buttons, no dragging), and choose how
 * integrations show. Nothing changes until Save.
 */
export function CustomizeHome({ onClose }: { onClose: (saved?: boolean) => void }) {
  const { account, update } = useAccount();
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const [draft, setDraft] = useState<HomeLayout>(() => account.ui.home ?? DEFAULT_HOME);
  const [moved, setMoved] = useState('');
  useEffect(() => {
    ref.current?.showModal();
    requestAnimationFrame(() => head.current?.focus());
  }, []);
  const close = (saved?: boolean) => {
    ref.current?.close();
    onClose(saved);
  };
  const move = (w: HomeWidget, d: -1 | 1) => {
    const order = [...draft.order];
    const i = order.indexOf(w);
    [order[i], order[i + d]] = [order[i + d], order[i]];
    setDraft({ ...draft, order });
    setMoved(`${WIDGET_NAME[w]} moved to position ${i + d + 1} of ${order.length}`);
    // Keep focus on the same button; if it's now disabled (at an end), use the other one
    requestAnimationFrame(() => {
      const same = document.getElementById(`${uid}-${w}-${d < 0 ? 'up' : 'down'}`) as HTMLButtonElement | null;
      (same && !same.disabled ? same : (document.getElementById(`${uid}-${w}-${d < 0 ? 'down' : 'up'}`) as HTMLButtonElement | null))?.focus();
    });
  };
  const save = () => {
    update((a) => ({ ...a, ui: { ...a.ui, home: draft } }));
    close(true);
  };

  return createPortal(
    <dialog
      ref={ref}
      className="ag ch-dlg"
      aria-labelledby={`${uid}-h`}
      aria-describedby={`${uid}-d`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="ag-top">
        <h2 id={`${uid}-h`} ref={head} tabIndex={-1}>
          Customize home
        </h2>
        <button type="button" className="ag-x" aria-label="Close" onClick={() => close()}>
          <Icon name="Close" size={22} />
        </button>
      </div>
      <div className="ag-body">
        <p id={`${uid}-d`} className="ch-lead">
          Choose which sections show on Home and in what order.
        </p>
        <ol className="ch-list">
          {draft.order.map((w, i) => {
            const shown = !draft.hidden.includes(w);
            return (
              <li key={w} className={`ch-item${shown ? '' : ' is-off'}`}>
                <div className="ch-item-main">
                  <label className="ch-check">
                    <input
                      type="checkbox"
                      checked={shown}
                      aria-describedby={`${uid}-${w}-about`}
                      onChange={() => setDraft({ ...draft, hidden: shown ? [...draft.hidden, w] : draft.hidden.filter((x) => x !== w) })}
                    />
                    <span>
                      <strong>{WIDGET_NAME[w]}</strong>
                      <span id={`${uid}-${w}-about`}>{WIDGET_ABOUT[w]}</span>
                    </span>
                  </label>
                  <div className="ch-move">
                    <button
                      type="button"
                      id={`${uid}-${w}-up`}
                      className="ag-x is-sm"
                      aria-label={`Move ${WIDGET_NAME[w]} up`}
                      disabled={i === 0}
                      onClick={() => move(w, -1)}
                    >
                      <Icon name="MoveUp" size={20} />
                    </button>
                    <button
                      type="button"
                      id={`${uid}-${w}-down`}
                      className="ag-x is-sm"
                      aria-label={`Move ${WIDGET_NAME[w]} down`}
                      disabled={i === draft.order.length - 1}
                      onClick={() => move(w, 1)}
                    >
                      <Icon name="MoveDown" size={20} />
                    </button>
                  </div>
                </div>
                {w === 'integrations' && shown && (
                  <div className="ch-opt">
                    <label htmlFor={`${uid}-view`}>Show as</label>
                    <Select id={`${uid}-view`} value={draft.integrationsView} onChange={(e) => setDraft({ ...draft, integrationsView: e.target.value as IntegrationsLayout })}>
                      {(Object.keys(VIEW_NAME) as IntegrationsLayout[]).map((v) => (
                        <option key={v} value={v}>
                          {VIEW_NAME[v]}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <p className="ux-visually-hidden" role="status">
          {moved}
        </p>
      </div>
      <div className="ag-foot ch-foot">
        <Button variation="secondary" label="Reset to default" onClick={() => setDraft(DEFAULT_HOME)} />
        <div className="ch-foot-end">
          <Button variation="secondary" label="Cancel" onClick={() => close()} />
          <Button variation="primary" label="Save" onClick={save} />
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
