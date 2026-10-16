import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount, type Modal } from '../lib/store';
import { PRODUCTS, ROWS, geoMode, hasGeography, rowDef, rowLocked } from '../lib/model';
import { GeographyBody } from './GeographyPage';
import { SenderBody } from './Sender';
import { UsersBody } from './Users';
import { RowBody } from './Rows';

/**
 * Everything that opens over the page: the geography gate, the account
 * to-dos and each checklist row. Closing returns them where they were.
 */
export function Modals() {
  const { modal, closeModal } = useAccount();
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const key = modal ? JSON.stringify(modal) : '';

  useEffect(() => {
    if (!modal) {
      if (ref.current?.open) ref.current.close();
      return;
    }
    if (!ref.current?.open) {
      opener.current = document.activeElement as HTMLElement;
      ref.current?.showModal();
    }
    requestAnimationFrame(() => head.current?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!modal) return null;
  const close = () => {
    ref.current?.close();
    closeModal();
    requestAnimationFrame(() => opener.current?.isConnected && opener.current.focus());
  };

  return (
    <dialog
      ref={ref}
      className="dlg sm"
      aria-labelledby="sm-h"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <Content modal={modal} head={head} close={close} />
    </dialog>
  );
}

function Top({
  eyebrow,
  title,
  lead,
  tag,
  head,
  close,
  closeLabel = 'Close',
}: {
  eyebrow?: string;
  title: string;
  lead: string;
  tag?: ReactNode;
  head: React.RefObject<HTMLHeadingElement | null>;
  close: () => void;
  closeLabel?: string;
}) {
  return (
    <div className="sm-top">
      <div>
        {eyebrow && <p className="it-eyebrow">{eyebrow}</p>}
        <div className="it-head">
          <h2 id="sm-h" ref={head} tabIndex={-1}>
            {title}
          </h2>
          {tag}
        </div>
        <p className="sm-lead">{lead}</p>
      </div>
      <button type="button" className="dlg-x" aria-label={closeLabel} onClick={close}>
        <Icon name="Close" size={22} />
      </button>
    </div>
  );
}

function Content({
  modal,
  head,
  close,
}: {
  modal: Modal;
  head: React.RefObject<HTMLHeadingElement | null>;
  close: () => void;
}) {
  const { account, go } = useAccount();

  if (modal.kind === 'gate') {
    const name = PRODUCTS[modal.product].name;
    const ready = hasGeography(account);
    const admin = account.ui.viewAs === 'admin';
    return (
      <>
        <Top
          eyebrow={`Before you open ${name}`}
          title="Define your geography"
          lead={`${name} needs at least one area, so work reaches the right place. Add one to continue. You can add the rest later from Geographies.`}
          head={head}
          close={close}
          closeLabel="Back to Home"
        />
        <div className="sm-body">
          {admin ? (
            <GeoBody />
          ) : (
            <p className="locked">
              <span className="locked-icon" aria-hidden="true">
                <Icon name="Schedule" size={18} />
              </span>
              Waiting for an admin to define geography.
            </p>
          )}
        </div>
        {admin && (
          <div className="sm-foot-bar">
            <p role="status">{ready ? `${account.geography.areas.length} areas added.` : 'Add at least one area to continue.'}</p>
            <Button
              variation="primary"
              label={`Open ${name}`}
              isDisabled={!ready}
              onClick={() => ready && go('product', { product: modal.product, section: 'overview' })}
            />
          </div>
        )}
      </>
    );
  }

  if (modal.kind === 'geography')
    return (
      <>
        <Top
          eyebrow="Account"
          title="Geographies"
          lead="The areas you work in. Every product uses them."
          head={head}
          close={close}
        />
        <div className="sm-body">
          <GeoBody />
        </div>
      </>
    );

  if (modal.kind === 'users')
    return (
      <>
        <Top
          eyebrow="Account"
          title="Invite users"
          lead="The people who’ll work with you. Once they’re invited, you can assign them inside each product."
          head={head}
          close={close}
        />
        <div className="sm-body">
          <UsersBody />
        </div>
      </>
    );

  if (modal.kind === 'sender')
    return (
      <>
        <Top
          eyebrow="Account"
          title="Sender details"
          lead="Who your messages come from. Submit early: approvals take days, and messages can be turned on once one is submitted."
          head={head}
          close={close}
        />
        <div className="sm-body">
          <SenderBody />
        </div>
      </>
    );

  const p = modal.product;
  const r = rowDef(p, modal.row);
  const n = ROWS[p].findIndex((x) => x.id === r.id) + 1;
  const locked = rowLocked(p, r, account);
  const done = !!account.products[p].done[r.id];
  return (
    <>
      <Top
        eyebrow={`${PRODUCTS[p].name} · ${n} of ${ROWS[p].length}`}
        title={r.label}
        lead={r.what}
        tag={
          <>
            {r.account && <span className="tag acct">Account</span>}
            {done && <span className="tag is-completed">Done</span>}
          </>
        }
        head={head}
        close={close}
      />
      <div className="sm-body">
        {locked ? (
          <p className="locked">
            <span className="locked-icon" aria-hidden="true">
              <Icon name="Lock" size={18} />
            </span>
            {locked}
          </p>
        ) : (
          <RowBody p={p} row={r.id} />
        )}
      </div>
    </>
  );
}

function GeoBody() {
  const { account } = useAccount();
  return geoMode(account) === 'search' ? <GeographyBody /> : <GeographyBody create />;
}
