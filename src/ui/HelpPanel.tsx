import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import type { PageId } from '../lib/model';
import { FAQS, PAGE_TOPIC } from '../lib/helpContent';

type Props = {
  id: string;
  onClose: () => void;
  onGo: (p: PageId) => void;
  onReplay: () => void;
  /** The page they're on, for the suggested articles */
  page: PageId;
};

/** A small scene for the top of the panel: someone at a laptop with a question bubble. Decorative. */
function HelpArt() {
  return (
    <svg className="ux-hp-art" viewBox="0 0 220 140" aria-hidden="true" focusable="false">
      <ellipse cx="112" cy="128" rx="92" ry="8" fill="rgb(var(--c-primary-rgb) / 0.12)" />
      <circle cx="58" cy="44" r="30" fill="rgb(var(--c-primary-rgb) / 0.10)" />
      <circle cx="176" cy="82" r="22" fill="rgb(var(--c-primary-rgb) / 0.08)" />
      {/* Desk and laptop */}
      <rect x="40" y="104" width="148" height="6" rx="3" fill="#3F3D56" />
      <rect x="98" y="72" width="62" height="32" rx="4" fill="#3F3D56" />
      <rect x="102" y="76" width="54" height="24" rx="2" fill="#fff" />
      <rect x="107" y="81" width="26" height="3" rx="1.5" fill="var(--c-primary)" />
      <rect x="107" y="87" width="40" height="3" rx="1.5" fill="#D6D6E3" />
      <rect x="107" y="93" width="32" height="3" rx="1.5" fill="#D6D6E3" />
      <path d="M92 104h74l-4 -4h-66z" fill="#2F2E41" />
      {/* Person */}
      <path d="M62 104c0-20 8-34 22-34s22 14 22 34z" fill="var(--c-primary)" />
      <circle cx="84" cy="56" r="11" fill="#FFB8A0" />
      <path d="M73 54c0-8 6-13 12-13 7 0 11 5 11 11-4-3-9-4-14-3-3 0-6 2-9 5z" fill="#2F2E41" />
      <path d="M96 86l14 6" stroke="#FFB8A0" strokeWidth="5" strokeLinecap="round" />
      {/* Question bubble */}
      <path d="M128 20h44a10 10 0 0 1 10 10v20a10 10 0 0 1-10 10h-26l-10 9v-9h-8a10 10 0 0 1-10-10V30a10 10 0 0 1 10-10z" fill="#fff" stroke="rgb(var(--c-primary-rgb) / 0.35)" strokeWidth="1.5" />
      <text x="150" y="48" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--c-primary)" fontFamily="inherit">?</text>
      <circle cx="196" cy="28" r="3" fill="var(--c-primary)" opacity="0.5" />
      <circle cx="30" cy="92" r="2.5" fill="var(--c-primary)" opacity="0.4" />
    </svg>
  );
}

/** Help, beside the page, only when asked: "How can we help you?" with search, articles suggested for the
 *  page they're on, quick links, and a way to contact us at the bottom. Search covers every article and link.
 *  Escape closes it. */
export function HelpPanel({ id, onClose, onGo, onReplay, page }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => titleRef.current?.focus(), []);
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const has = (x: string) => x.toLowerCase().includes(term);

  // Questions for the page they're on; searching covers every question and answer
  const suggested = FAQS.filter((f) => f.topic === (PAGE_TOPIC[page] ?? 'start')).slice(0, 4);
  const articles = term ? FAQS.filter((f) => has(`${f.q} ${f.a}`)) : suggested;
  const [open, setOpen] = useState<string | null>(null);
  const quick: { key: string; label: string; hint: string; icon: string; tone: string; page: PageId }[] = [
    { key: 'documents', label: 'Documents', hint: 'Reference and downloads', icon: 'Article', tone: 'is-documents', page: 'documents' },
    { key: 'tutorials', label: 'Tutorials', hint: 'Step-by-step guides and videos', icon: 'PlayVideo', tone: 'is-videos', page: 'tutorials' },
    { key: 'faq', label: 'FAQs', hint: 'Common questions', icon: 'Faq', tone: 'is-faq', page: 'faq' },
  ];
  const quickShown = quick.filter((x) => !term || has(`${x.label} ${x.hint}`));
  const count = articles.length + quickShown.length;

  return (
    <aside
      id={id}
      className="ux-hp is-v2 is-v3"
      aria-labelledby={`${id}-title`}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="ux-hp-scroll">
        <div className="ux-hp-hero">
          <button type="button" className="ux-hp-close" aria-label="Close help" onClick={onClose}>
            <Icon name="Close" size={20} />
          </button>
          <HelpArt />
          <h2 id={`${id}-title`} ref={titleRef} tabIndex={-1}>
            How can we help you?
          </h2>
          <p>Search help, or pick a topic below.</p>
          <div className="geo-search ux-hp-search">
            <label htmlFor={`${id}-q`} className="ux-visually-hidden">
              Search help
            </label>
            <Icon name="Search" size={20} />
            <input id={`${id}-q`} type="search" placeholder="Search help" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <p className="ux-visually-hidden" role="status">
          {term ? `${count} ${count === 1 ? 'result' : 'results'}` : ''}
        </p>

        <div className="ux-hp-body">
          {articles.length > 0 && (
            <section aria-labelledby={`${id}-a`}>
              <h3 id={`${id}-a`} className="ux-hp-h">
                {term ? 'Questions' : 'Suggested for this page'}
              </h3>
              <ul className="ux-hp-articles">
                {articles.map((f) => {
                  const isOpen = open === f.id;
                  return (
                    <li key={f.id} className={isOpen ? 'is-open' : undefined}>
                      <button type="button" aria-expanded={isOpen} aria-controls={`${id}-${f.id}`} onClick={() => setOpen(isOpen ? null : f.id)}>
                        <span className="ux-hp-article-t">{f.q}</span>
                        <Icon name={isOpen ? 'MoveUp' : 'MoveDown'} size={18} />
                      </button>
                      {isOpen && (
                        <div id={`${id}-${f.id}`} className="ux-hp-answer">
                          <p>{f.a}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="lp-link ux-hp-all" onClick={() => onGo('faq')}>
                See all FAQs
              </button>
            </section>
          )}

          {quickShown.length > 0 && (
            <section aria-labelledby={`${id}-k`}>
              <h3 id={`${id}-k`} className="ux-hp-h">
                Quick links
              </h3>
              <ul className="ux-hp-quick">
                {quickShown.map((x) => (
                  <li key={x.key}>
                    <button type="button" onClick={() => onGo(x.page)}>
                      <span className={`ux-hp-link-icon ${x.tone}`} aria-hidden="true">
                        <Icon name={x.icon} size={20} />
                      </span>
                      <span className="ux-hp-quick-text">
                        <strong>{x.label}</strong>
                        <span>{x.hint}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!count && (
            <div className="ux-hp-empty">
              <p>
                <strong>No results for “{q.trim()}”</strong>
              </p>
              <p>Try other words, or look through the FAQs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Always at the bottom: the onboarding tour, to see where everything is again */}
      <div className="ux-hp-foot">
        <button type="button" className="ux-hp-tour" onClick={onReplay}>
          <Icon name="AutoAwesome" size={18} />
          Restart onboarding tour
        </button>
      </div>
    </aside>
  );
}
