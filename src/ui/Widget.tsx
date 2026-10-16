import { useEffect, useId, useRef } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import {
  PRODUCTS,
  ROWS,
  blocked,
  doneRows,
  nextRow,
  percent,
  rowLocked,
  rowState,
  senderReady,
  stepsLeft,
  type Product,
} from '../lib/model';

/**
 * The product checklist: a floating widget, only inside a product. It opens
 * by itself once, then collapses to a pill with the percentage and next
 * step. One row is open at a time. Go live sits in the footer.
 */
export function Widget() {
  const { account, page, params, modal, widgetOpen: open, setWidgetOpen: setOpen, update } = useAccount();
  const p = params.product;
  const st = p ? account.products[p] : null;
  const visible =
    !!p && !!st && page === 'product' && !!st.templateId && !st.live && !modal && account.ui.viewAs === 'admin';

  // First time inside a started product: open by itself, once.
  useEffect(() => {
    if (!visible || !p || st!.introSeen) return;
    setOpen(true);
    update((a) => ({ ...a, products: { ...a.products, [p]: { ...a.products[p], introSeen: true } } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, p]);

  if (!visible || !p) return null;
  return <Panel p={p} open={open} setOpen={setOpen} />;
}

function Panel({ p, open, setOpen }: { p: Product; open: boolean; setOpen: (v: boolean) => void }) {
  const { account, expanded, setExpanded, openModal, go } = useAccount();
  const uid = useId();
  const wrap = useRef<HTMLElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const pct = percent(p, account);
  const next = nextRow(p, account);
  const left = stepsLeft(p, account);
  const ready = !blocked(p, account);
  // One row open at a time: the one they picked, or the next to do.
  const current = expanded ?? (next && rowState(p, next, account) === 'open' ? next.id : null);

  useEffect(() => {
    if (!open) return;
    head.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => pill.current?.focus());
  };

  return (
    <aside
      className="cl"
      aria-label={`${PRODUCTS[p].name} checklist`}
      ref={wrap}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          close();
        }
      }}
    >
      {open && (
        <section id={`${uid}-p`} className="cl-panel" aria-labelledby={`${uid}-t`}>
          <header className="cl-head">
            <div className="cl-head-top">
              <h2 id={`${uid}-t`} ref={head} tabIndex={-1}>
                Get {PRODUCTS[p].name} live
              </h2>
              <button type="button" className="cl-min" aria-label="Minimise checklist" onClick={close}>
                <Icon name="ExpandMore" size={22} />
              </button>
            </div>
            <div className="cl-meter">
              <span className="cl-bar" aria-hidden="true">
                <span style={{ width: `${pct}%` }} />
              </span>
              <span>
                {pct}% · {doneRows(p, account)} of {ROWS[p].length} done
              </span>
            </div>
          </header>

          <ol className="cl-list">
            {ROWS[p].map((r) => {
              const state = rowState(p, r, account);
              const isOpen = state === 'open' && current === r.id;
              const result = account.products[p].done[r.id];
              return (
                <li key={r.id} className={`cl-item is-${state}${isOpen ? ' is-expanded' : ''}`}>
                  <div className="cl-line">
                    <span className="cl-mark" aria-hidden="true">
                      {state === 'done' ? (
                        <Icon name="Check" size={14} />
                      ) : state === 'locked' ? (
                        <Icon name="Lock" size={12} />
                      ) : null}
                    </span>
                    {state === 'open' ? (
                      <button
                        type="button"
                        className="cl-toggle"
                        aria-expanded={isOpen}
                        aria-controls={`${uid}-${r.id}`}
                        onClick={() => setExpanded(isOpen ? '' : r.id)}
                      >
                        <span className="cl-name">{r.label}</span>
                        {r.account && <span className="tag acct">Account</span>}
                      </button>
                    ) : (
                      <span className="cl-text">
                        <span className="cl-name">
                          {r.label}
                          {r.account && state !== 'done' && <span className="tag acct">Account</span>}
                        </span>
                        <span className="cl-where">{state === 'done' ? result : rowLocked(p, r, account)}</span>
                      </span>
                    )}
                    {state === 'done' && (
                      <span className="cl-done">
                        <span className="tag is-completed">Done</span>
                        <button
                          type="button"
                          className="lnk"
                          aria-label={`View ${r.label}`}
                          onClick={() => openModal({ kind: 'row', product: p, row: r.id })}
                        >
                          View
                        </button>
                      </span>
                    )}
                  </div>
                  {isOpen && (
                    <div id={`${uid}-${r.id}`} className="cl-open">
                      <p>{r.what}</p>
                      {r.account && !senderReady(account) && (
                        <p className="cl-acct">
                          Messages can be edited now. Turning them on needs sender details.{' '}
                          <button type="button" className="lnk" onClick={() => go('home', { highlight: 'sender' })}>
                            Go to Home
                          </button>
                        </p>
                      )}
                      <Button
                        variation="primary"
                        size="medium"
                        label="Start"
                        onClick={() => openModal({ kind: 'row', product: p, row: r.id })}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <footer className="cl-golive">
            <p role="status">{ready ? 'You’re ready' : `${left} ${left === 1 ? 'step' : 'steps'} to go`}</p>
            <Button
              variation="primary"
              label="Go Live"
              icon={ready ? undefined : 'Lock'}
              isDisabled={!ready}
              onClick={() => ready && go('golive', { product: p })}
            />
          </footer>
        </section>
      )}

      <button
        ref={pill}
        type="button"
        className="cl-pill"
        aria-expanded={open}
        aria-controls={`${uid}-p`}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className="cl-pill-ring" aria-hidden="true" style={{ ['--pct' as string]: `${pct}%` }}>
          {pct}%
        </span>
        <span className="cl-pill-text">
          <span className="cl-pill-title">
            <span className="ux-visually-hidden">{PRODUCTS[p].name} checklist, </span>
            {pct}% set up
          </span>
          <span className="cl-pill-next">{ready ? 'You’re ready to go live' : next ? `Next: ${next.label}` : ''}</span>
        </span>
        <Icon name={open ? 'ExpandMore' : 'ExpandLess'} size={22} />
      </button>
    </aside>
  );
}
