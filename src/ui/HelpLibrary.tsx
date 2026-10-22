import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Chip } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { Select } from '../components/Select';
import { DOCS, FAQS, TOPICS, TUTORIALS, topicLabel, type HelpTopic } from '../lib/helpContent';
import { usePageToast } from './PageToast';
import { HelpArt } from './HelpPanel';

/**
 * The Help Center. A header with the illustration and search; then the type of resource (All, Documents,
 * Videos, FAQs) and a Filters button that opens advanced filters, like Drive's advanced search
 * (topic, document type, words in it, words in its name, popular only). Active filters show as chips you
 * can remove. Results are equal cards, a page at a time; a question opens its answer in its card.
 */
export type HelpKind = 'documents' | 'tutorials' | 'faq';
type Res = 'all' | 'documents' | 'videos' | 'faq';
type Filters = { topic: HelpTopic | 'all'; words: string; name: string; popular: boolean };
const NO_FILTERS: Filters = { topic: 'all', words: '', name: '', popular: false };

const RES: { id: Res; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: 'Apps' },
  { id: 'documents', label: 'Documents', icon: 'Article' },
  { id: 'videos', label: 'Videos', icon: 'PlayVideo' },
  { id: 'faq', label: 'FAQs', icon: 'Faq' },
];
const PAGE = 15;

type Item = {
  id: string;
  res: Exclude<Res, 'all'>;
  title: string;
  sub: string;
  answer?: string;
  topic: HelpTopic;
  type: string;
  details: string;
  format?: string;
  popular?: boolean;
};
const ITEMS: Item[] = [
  ...DOCS.map((d): Item => ({ id: d.id, res: 'documents', title: d.title, sub: d.desc, topic: d.topic, type: 'Document', details: `${d.format} · ${d.size}`, format: d.format })),
  ...TUTORIALS.map((t): Item => ({ id: t.id, res: 'videos', title: t.title, sub: t.desc, topic: t.topic, type: 'Video', details: t.length, popular: t.popular })),
  ...FAQS.map((f): Item => ({ id: f.id, res: 'faq', title: f.q, sub: '', answer: f.a, topic: f.topic, type: 'Question', details: '' })),
];

export function HelpLibrary({ kind }: { kind?: HelpKind }) {
  const uid = useId();
  const [toastEl, showToast] = usePageToast();
  const [res, setRes] = useState<Res>(kind === 'documents' ? 'documents' : kind === 'tutorials' ? 'videos' : kind === 'faq' ? 'faq' : 'all');
  const [q, setQ] = useState('');
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<string | null>(null);
  const [rated, setRated] = useState<Record<string, boolean>>({});

  const has = (hay: string, text: string) => text.trim().toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.toLowerCase().includes(w));
  // Everything but the resource type, so each type can show its count
  const matching = ITEMS.filter(
    (i) =>
      has(`${i.title} ${i.sub} ${i.answer ?? ''} ${i.type} ${topicLabel(i.topic)}`, q) &&
      (f.topic === 'all' || i.topic === f.topic) &&
      has(`${i.title} ${i.sub} ${i.answer ?? ''}`, f.words) &&
      has(i.title, f.name) &&
      (!f.popular || i.popular),
  );
  const rows = matching.filter((i) => res === 'all' || i.res === res);
  // When nothing shows, work out why: the words, the filters, or the type
  const bySearch = ITEMS.filter((i) => has(`${i.title} ${i.sub} ${i.answer ?? ''} ${i.type} ${topicLabel(i.topic)}`, q)).length;
  const why: 'search' | 'filters' | 'type' = q.trim() && !bySearch ? 'search' : !matching.length ? 'filters' : 'type';
  const cards = rows.filter((i) => i.res !== 'faq');
  const faqs = rows.filter((i) => i.res === 'faq');
  const [faqLimit, setFaqLimit] = useState(PAGE);
  const countOf = (r: Res) => (r === 'all' ? matching.length : matching.filter((i) => i.res === r).length);

  // Active filters as removable chips
  const chips: { key: keyof Filters; label: string }[] = [
    ...(f.topic !== 'all' ? [{ key: 'topic' as const, label: `Topic: ${topicLabel(f.topic)}` }] : []),
    ...(f.words.trim() ? [{ key: 'words' as const, label: `Has the words: ${f.words.trim()}` }] : []),
    ...(f.name.trim() ? [{ key: 'name' as const, label: `Name contains: ${f.name.trim()}` }] : []),
    ...(f.popular ? [{ key: 'popular' as const, label: 'Popular only' }] : []),
  ];
  const reset = () => {
    setLimit(PAGE);
    setFaqLimit(PAGE);
    setOpen(null);
  };
  const act = (i: Item) => {
    if (i.res === 'faq') setOpen(open === i.id ? null : i.id);
    else showToast(`${i.res === 'documents' ? 'Downloads' : 'Videos'} aren’t available in this prototype yet`);
  };

  return (
    <div className="hcv">
      {toastEl}
      <header className="hcv-head">
        <div className="hcv-hero is-compact">
          <HelpArt />
          <h1>How can we help you?</h1>
          <p>Find documents, short videos and answers to common questions about setting up and running your console.</p>
        </div>
      </header>

      <section className="hcx hcv-wrap" aria-labelledby={`${uid}-res`}>
        <h2 id={`${uid}-res`} className="ux-visually-hidden">
          Resources
        </h2>
        {/* Standard order: search and filters, then the type of resource with the count, then what's applied */}
        <div className="hcx-search-row">
          <div className="hcv-search hcx-search">
            <label htmlFor={`${uid}-q`} className="ux-visually-hidden">
              Search the Help Center
            </label>
            <Icon name="Search" size={20} />
            <input
              id={`${uid}-q`}
              type="search"
              placeholder="Search documents, videos and questions"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                reset();
              }}
            />
          </div>
          <button type="button" className={`hcx-filters-btn${chips.length ? ' is-on' : ''}`} aria-haspopup="dialog" onClick={() => setFiltersOpen(true)}>
            <Icon name="Tune" size={18} />
            Filters
            {chips.length > 0 && <span className="hcx-n">{chips.length}</span>}
          </button>
        </div>
        <div className="hcx-type-row">
          <div className="hcx-types" role="group" aria-label="Type of resource">
            {RES.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={res === r.id}
                onClick={() => {
                  setRes(r.id);
                  reset();
                }}
              >
                <Icon name={r.icon} size={18} />
                {r.label}
                <span className="hcx-n">{countOf(r.id)}</span>
              </button>
            ))}
          </div>
          <p className="hcx-count" role="status">
            {rows.length} {rows.length === 1 ? 'resource' : 'resources'}
          </p>
        </div>
        {/* Filters set in the Filters panel (they're hidden otherwise), as DIGIT chips with a cross to remove each.
            The type and the search already show above, so they don't repeat here. */}
        {chips.length > 0 && (
          <div className="digit-tag-container hcx-chips">
            {chips.map((c) => (
              <Chip
                key={c.key}
                text={c.label}
                onClick={() => {
                  setF({ ...f, [c.key]: NO_FILTERS[c.key] });
                  reset();
                }}
              />
            ))}
            <button
              type="button"
              className="hcd-clear"
              onClick={() => {
                setF(NO_FILTERS);
                reset();
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        {rows.length ? (
          <>
            {cards.length > 0 && (
              <>
                <ul className="hcd-grid">
                  {cards.slice(0, limit).map((i) => (
                    <li key={i.id} className={`hcd-card is-${i.res}`}>
                      <button type="button" className="hcd-card-btn" onClick={() => act(i)}>
                        <span className={`hcd-prev${i.res === 'documents' ? ` is-${i.format!.toLowerCase()}` : ' is-video'}`} aria-hidden="true">
                          {i.res === 'documents' ? <span className="hcd-prev-file">{i.format}</span> : <Icon name="PlayVideo" size={34} />}
                          {i.details && i.res !== 'documents' && <span className="hcd-prev-len">{i.details}</span>}
                          {i.popular && <span className="hcd-prev-pop">Popular</span>}
                        </span>
                        <span className="hcd-card-body">
                          <strong className="hcd-card-title">{i.title}</strong>
                          {i.sub && <span className="hcd-card-sub">{i.sub}</span>}
                          {/* Its type in a blue tag, its topic in a grey one (no file size) */}
                          <span className="hcd-card-tags">
                            <span className="hcd-tag is-type">{i.type}</span>
                            <span className="hcd-tag">{topicLabel(i.topic)}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {cards.length > limit && (
                  <div className="hcd-more">
                    <span>
                      Showing {limit} of {cards.length}
                    </span>
                    <button type="button" onClick={() => setLimit(limit + PAGE)}>
                      Show more
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Questions in the FAQ style: an accordion */}
            {faqs.length > 0 && (
              <section className={`hcx-faqs${cards.length ? ' is-below' : ''}`} aria-labelledby={`${uid}-faqh`}>
                <h2 id={`${uid}-faqh`}>
                  Frequently asked questions <span>{faqs.length}</span>
                </h2>
                <ul>
                  {faqs.slice(0, res === 'faq' ? faqLimit : 6).map((i) => {
                    const isOpen = open === i.id;
                    return (
                      <li key={i.id} className={`hcx-faq${isOpen ? ' is-open' : ''}`}>
                        <h3>
                          <button type="button" aria-expanded={isOpen} aria-controls={`${uid}-a-${i.id}`} onClick={() => act(i)}>
                            <span className="hcx-faq-q">{i.title}</span>
                            <span className="hcx-faq-topic">{topicLabel(i.topic)}</span>
                            <Icon name={isOpen ? 'MoveUp' : 'MoveDown'} size={20} />
                          </button>
                        </h3>
                        {isOpen && (
                          <div id={`${uid}-a-${i.id}`} className="hcx-faq-a">
                            <p>{i.answer}</p>
                            <div className="hcd-helpful">
                              {rated[i.id] ? (
                                <p role="status">Thanks for letting us know.</p>
                              ) : (
                                <>
                                  <span>Was this helpful?</span>
                                  <button type="button" onClick={() => setRated({ ...rated, [i.id]: true })}>
                                    Yes
                                  </button>
                                  <button type="button" onClick={() => setRated({ ...rated, [i.id]: true })}>
                                    No
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {res !== 'faq' && faqs.length > 6 && (
                  <button type="button" className="hcd-clear hcx-faq-all" onClick={() => (setRes('faq'), reset())}>
                    See all {faqs.length} questions
                  </button>
                )}
                {res === 'faq' && faqs.length > faqLimit && (
                  <div className="hcd-more">
                    <span>
                      Showing {faqLimit} of {faqs.length}
                    </span>
                    <button type="button" onClick={() => setFaqLimit(faqLimit + PAGE)}>
                      Show more
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        ) : (
          <div className={`hcx-empty is-${why}`}>
            <span className="hcx-empty-ic" aria-hidden="true">
              <Icon name={why === 'filters' ? 'Tune' : 'Search'} size={28} />
            </span>
            {why === 'search' && (
              <>
                <h3>No results for “{q.trim()}”</h3>
                <p>Nothing in the Help Center uses those words. Check the spelling, or try a shorter or more general word.</p>
                <div className="hcx-empty-try">
                  <span>Try:</span>
                  {['geographies', 'invite', 'sender', 'translate', 'integration'].map((w) => (
                    <button key={w} type="button" onClick={() => (setQ(w), reset())}>
                      {w}
                    </button>
                  ))}
                </div>
                <div className="hcx-empty-actions">
                  <Button variation="secondary" label="Clear search" onClick={() => (setQ(''), reset())} />
                </div>
              </>
            )}
            {why === 'filters' && (
              <>
                <h3>Your filters hide every result</h3>
                <p>
                  {q.trim() ? `“${q.trim()}” has ${bySearch} ${bySearch === 1 ? 'result' : 'results'}, ` : 'There are resources here, '}
                  but none match {chips.map((c) => c.label).join(' and ')}. Remove a filter to see them.
                </p>
                <div className="hcx-empty-actions">
                  <Button variation="secondary" label="Clear filters" onClick={() => (setF(NO_FILTERS), reset())} />
                  <Button variation="secondary" label="Change filters" onClick={() => setFiltersOpen(true)} />
                </div>
              </>
            )}
            {why === 'type' && (
              <>
                <h3>No {RES.find((r) => r.id === res)!.label.toLowerCase()} match</h3>
                <p>
                  There {matching.length === 1 ? 'is 1 result' : `are ${matching.length} results`} in other types
                  {q.trim() ? ` for “${q.trim()}”` : ''}.
                </p>
                <div className="hcx-empty-actions">
                  <Button variation="secondary" label="Show all types" onClick={() => (setRes('all'), reset())} />
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {filtersOpen && (
        <FiltersDialog
          value={f}
          onApply={(v) => {
            setF(v);
            reset();
            setFiltersOpen(false);
          }}
          onClose={() => setFiltersOpen(false)}
        />
      )}
    </div>
  );
}

/** Advanced filters in a dialog, laid out like Drive's advanced search: label on the left, field on the right. */
function FiltersDialog({ value, onApply, onClose }: { value: Filters; onApply: (f: Filters) => void; onClose: () => void }) {
  const uid = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const head = useRef<HTMLHeadingElement>(null);
  const [d, setD] = useState<Filters>(value);
  useEffect(() => {
    ref.current?.showModal();
    requestAnimationFrame(() => head.current?.focus());
  }, []);
  const close = () => {
    ref.current?.close();
    onClose();
  };
  return createPortal(
    <dialog
      ref={ref}
      className="ag hcx-dlg"
      aria-labelledby={`${uid}-h`}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ref.current?.close();
          onApply(d);
        }}
      >
        <div className="ag-top">
          <h2 id={`${uid}-h`} ref={head} tabIndex={-1}>
            Filters
          </h2>
          <button type="button" className="ag-x" aria-label="Close" onClick={close}>
            <Icon name="Close" size={22} />
          </button>
        </div>
        <div className="ag-body hcx-fields">
          <label htmlFor={`${uid}-topic`}>Topic</label>
          <Select id={`${uid}-topic`} value={d.topic} onChange={(e) => setD({ ...d, topic: e.target.value as HelpTopic | 'all' })}>
            <option value="all">Any topic</option>
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
          <label htmlFor={`${uid}-words`}>Has the words</label>
          <input id={`${uid}-words`} value={d.words} placeholder="Words found in the title, description or answer" onChange={(e) => setD({ ...d, words: e.target.value })} />
          <label htmlFor={`${uid}-name`}>Name contains</label>
          <input id={`${uid}-name`} value={d.name} placeholder="Part of the title" onChange={(e) => setD({ ...d, name: e.target.value })} />
          <span className="hcx-fields-l">Show</span>
          <label className="hcx-check">
            <input type="checkbox" checked={d.popular} onChange={(e) => setD({ ...d, popular: e.target.checked })} />
            Popular only
          </label>
        </div>
        <div className="ag-foot hcx-foot">
          <button type="button" className="hcd-clear" onClick={() => setD(NO_FILTERS)}>
            Reset
          </button>
          <Button variation="primary" label="Apply filters" submit onClick={() => {}} />
        </div>
      </form>
    </dialog>,
    document.body,
  );
}
