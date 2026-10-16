import { useEffect, useRef } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { PRODUCTS, ROWS, blocked, blockingChecks, stepsLeft } from '../lib/model';
import { Page } from './StepFrame';

/**
 * The review before going live: blocking checks, then what's being
 * launched, each part with an Edit link. Confirming switches Not live to
 * Live; the checklist gives way to Health.
 */
export function GoLive() {
  const { account, params, update, openModal, go } = useAccount();
  const p = params.product!;
  const st = account.products[p];
  const ok = useRef<HTMLDivElement>(null);
  const wasLive = useRef(st.live);
  useEffect(() => {
    if (st.live && !wasLive.current) ok.current?.focus();
    wasLive.current = st.live;
  }, [st.live]);

  const name = PRODUCTS[p].name;

  if (st.live)
    return (
      <div className="sf2">
        <div className="ms" ref={ok} tabIndex={-1} role="status">
          <span className="ms-badge" aria-hidden="true">
            <Icon name="CheckCircle" size={32} />
          </span>
          <div>
            <p className="ms-eyebrow">Live</p>
            <h1 className="ms-title">{name} is live</h1>
            <p>Its card on Home now shows how it’s doing. Health takes over from the checklist.</p>
          </div>
        </div>
        <div className="form-foot">
          <Button variation="primary" label="Open Health" onClick={() => go('product', { product: p, section: 'health' })} />
          <Button variation="link" label="Back to Home" onClick={() => go('home')} />
        </div>
      </div>
    );

  const checks = blockingChecks(p, account);
  const left = stepsLeft(p, account);
  const stop = blocked(p, account);

  return (
    <Page title={`Go live with ${name}`} lead="Check nothing is blocking you, look over what you’re launching, then confirm.">
      <section className="card" aria-labelledby="gl-ex">
        <h2 id="gl-ex">Blocking checks</h2>
        <ul className="gl-ex">
          {left > 0 && (
            <li className="has-issue">
              <span className="gl-mark" aria-hidden="true">
                <Icon name="Info" size={20} />
              </span>
              <span className="gl-label">
                Checklist steps not done
                <strong className="gl-count">{left}</strong>
              </span>
            </li>
          )}
          {checks.map((c) => (
            <li key={c.label} className={c.count ? 'has-issue' : undefined}>
              <span className="gl-mark" aria-hidden="true">
                <Icon name={c.count ? 'Info' : 'CheckCircle'} size={20} />
              </span>
              <span className="gl-label">
                {c.label}
                <strong className="gl-count">{c.count ? c.count.toLocaleString('en') : 'None'}</strong>
              </span>
              {c.count > 0 && (
                <span className="gl-actions">
                  <Button
                    variation="secondary"
                    size="small"
                    label="Fix"
                    onClick={() => openModal({ kind: 'row', product: p, row: c.row })}
                  />
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="gl-what">
        <h2 id="gl-what">What you’re launching</h2>
        <dl className="launch">
          {ROWS[p].map((r) => (
            <div key={r.id} className="launch-row">
              <dt>{r.label}</dt>
              <dd>{st.done[r.id] || 'Not done yet'}</dd>
              <dd className="launch-edit">
                <button
                  type="button"
                  className="lnk"
                  aria-label={`Edit ${r.label}`}
                  onClick={() => openModal({ kind: 'row', product: p, row: r.id })}
                >
                  Edit
                </button>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="gl-go">
        <Button
          variation="primary"
          label={`Go Live with ${name}`}
          isDisabled={stop}
          onClick={() =>
            !stop &&
            update((a) => ({ ...a, products: { ...a.products, [p]: { ...a.products[p], live: true } } }))
          }
        />
        {stop && <p className="golive-note">Clear the blocking checks first.</p>}
      </div>
    </Page>
  );
}
