import { useEffect, useRef } from 'react';
import { Icon } from '../components/Icon';
import type { PageId } from '../lib/model';

type Props = {
  id: string;
  onClose: () => void;
  onGo: (p: PageId) => void;
};

const LINKS: {
  group: string;
  items: { page: PageId; label: string; hint: string; icon: string; tone: string }[];
}[] = [
  {
    group: 'Learn',
    items: [
      {
        page: 'tutorials',
        label: 'Tutorials and Guides',
        hint: 'Step-by-step walkthroughs',
        icon: 'MenuBook',
        tone: 'is-tutorials',
      },
      {
        page: 'documents',
        label: 'Documents',
        hint: 'Reference and downloads',
        icon: 'Article',
        tone: 'is-documents',
      },
    ],
  },
  {
    group: 'Still stuck?',
    items: [
      {
        page: 'helpcenter',
        label: 'Help Center',
        hint: 'Answers and ways to contact us',
        icon: 'LiveHelp',
        tone: 'is-help',
      },
    ],
  },
];

/** Help, beside the page, only when asked. Escape closes it. */
export function HelpPanel({ id, onClose, onGo }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus(), []);

  return (
    <aside
      id={id}
      className="ux-hp"
      aria-labelledby={`${id}-title`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="ux-hp-top">
        <h2 id={`${id}-title`} ref={titleRef} tabIndex={-1}>
          Help
        </h2>
        <button type="button" className="ux-hp-close" aria-label="Close help" onClick={onClose}>
          <Icon name="Close" size={20} />
        </button>
      </div>
      <div className="ux-hp-body">
        {LINKS.map((g) => (
          <section key={g.group} aria-label={g.group}>
            <h3 className="ux-hp-h">{g.group}</h3>
            <ul className="ux-hp-links">
              {g.items.map((l) => (
                <li key={l.label}>
                  <button
                    type="button"
                    className="ux-hp-link"
                    onClick={() => onGo(l.page)}
                  >
                    <span className={`ux-hp-link-icon ${l.tone}`} aria-hidden="true">
                      <Icon name={l.icon} size={20} />
                    </span>
                    <span className="ux-hp-link-text">
                      <span className="ux-hp-link-label">{l.label}</span>
                      <span className="ux-hp-link-hint">{l.hint}</span>
                    </span>
                    <Icon name="ChevronRight" size={20} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
