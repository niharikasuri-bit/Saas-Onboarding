import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import type { TodoId } from '../lib/model';

/**
 * An account setup task, the same everywhere it shows (the first landing and Home):
 * its icon, then the title, what you'll need and how long, Why complete this?, and its button.
 */
export const TASK: Record<TodoId, { title: string; needs: string; why: string; minutes: number; icon: string; action: string }> = {
  geography: {
    title: 'Add your geographies',
    needs: 'your country, its levels and the places in it',
    why: 'Every product uses your geographies to know where things happen, so work reaches the right place. Your products unlock once they’re in.',
    minutes: 5,
    icon: 'Public',
    action: 'Add geographies',
  },
  sender: {
    title: 'Set up notification channels',
    needs: 'SMS, email and sender details',
    why: 'Updates go out in your organisation’s name, so your products need your services and sender details before they go live.',
    minutes: 5,
    icon: 'Email',
    action: 'Add notification channels',
  },
  users: {
    title: 'Invite your team',
    needs: 'work emails and roles',
    why: 'Once your team is in, you can give each person a role and assign them work.',
    minutes: 2,
    icon: 'Group',
    action: 'Add team members',
  },
};

export function TaskBody({ id, headingId, onStart }: { id: TodoId; headingId: string; onStart: () => void }) {
  const [why, setWhy] = useState(false);
  const t = TASK[id];
  return (
    <div className="lp-task-body">
      <span className="lp-task-icon" aria-hidden="true">
        <Icon name={t.icon} size={24} />
      </span>
      <div className="lp-task-text">
        <h2 id={headingId}>{t.title}</h2>
        <p>
          You’ll need {t.needs}. About {t.minutes} minutes.
        </p>
        <button type="button" className="lp-link" onClick={() => setWhy(true)}>
          Why complete this?
        </button>
      </div>
      <Button variation="primary" label={t.action} icon="ArrowForward" isSuffix onClick={onStart} />
      {why && <WhyDialog title={t.title} text={t.why} onClose={() => setWhy(false)} />}
    </div>
  );
}

/** "Why complete this": a short popup with what the step is for. */
function WhyDialog({ title, text, onClose }: { title: string; text: string; onClose: () => void }) {
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const close = () => {
    ref.current?.close();
    onClose();
  };
  return createPortal(
    <dialog
      ref={ref}
      className="ag lp-why"
      aria-labelledby={`${uid}-h`}
      aria-describedby={`${uid}-d`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <span className="lp-why-icon" aria-hidden="true">
        <Icon name="Info" size={24} />
      </span>
      <h2 id={`${uid}-h`}>Why complete this</h2>
      <p className="lp-why-step">{title}</p>
      <p id={`${uid}-d`}>{text}</p>
      <Button variation="primary" label="Got it" onClick={close} />
    </dialog>,
    document.body,
  );
}
