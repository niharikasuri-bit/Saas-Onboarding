import { useId, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { Select } from '../components/Select';
import { DOC_KINDS, DOCS, FAQS, TOPICS, TUTORIALS, topicLabel, type Doc, type Faq, type HelpTopic, type Tutorial } from '../lib/helpContent';
import { usePageToast } from './PageToast';

/**
 * The Help Center: one open page. A search header that covers everything, topics to browse by, then tabs
 * (All, Documents, Tutorials, FAQs) with counts. All shows the best of each; the other tabs show the full
 * list with their own filter. Content sits flat on the page: lists with dividers, not boxes.
 */
export type HelpKind = 'documents' | 'tutorials' | 'faq';
type Tab = 'all' | HelpKind;

const TOPIC_ICON: Record<HelpTopic, string> = {
  start: 'AutoAwesome',
  geographies: 'Public',
  notifications: 'Email',
  team: 'Group',
  integrations: 'Extension',
  branding: 'InvertColors',
  languages: 'Translate',
};
const POPULAR = ['Upload geographies', 'Invite team', 'Sender approval', 'Translate with AI'];

export function HelpLibrary({ kind }: { kind?: HelpKind }) {
  const uid = useId();
  const [toastEl, showToast] = usePageToast();
  const [tab, setTab] = useState<Tab>(kind ?? 'all');
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState<HelpTopic | 'all'>('all');
  const [docKind, setDocKind] = useState('all');
  const [format, setFormat] = useState('all');
  const [open, setOpen] = useState<string[]>([]);
  const [rated, setRated] = useState<Record<string, boolean>>({});
  const results = useRef<HTMLDivElement>(null);

  // Search: every word must appear somewhere in the item
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const match = (...xs: string[]) => {
    const hay = xs.join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  };
  const inTopic = (t: HelpTopic) => topic === 'all' || t === topic;
  const docs = DOCS.filter((d) => inTopic(d.topic) && match(d.title, d.desc, d.kind, d.format, topicLabel(d.topic)) && (docKind === 'all' || d.kind === docKind));
  const tuts = TUTORIALS.filter((t) => inTopic(t.topic) && match(t.title, t.desc, t.format, topicLabel(t.topic)) && (format === 'all' || t.format === format));
  const faqs = FAQS.filter((f) => inTopic(f.topic) && match(f.q, f.a, topicLabel(f.topic)));
  const topicCount = (t: HelpTopic) => DOCS.filter((d) => d.topic === t).length + TUTORIALS.filter((x) => x.topic === t).length + FAQS.filter((f) => f.topic === t).length;
  const filtered = words.length > 0 || topic !== 'all' || docKind !== 'all' || format !== 'all';
  const clear = () => {
    setQ('');
    setTopic('all');
    setDocKind('all');
    setFormat('all');
  };
  const total = docs.length + tuts.length + faqs.length;

  const docRow = (d: Doc) => (
    <li key={d.id} className="hlc-doc">
      <span className={`hlc-file is-${d.format.toLowerCase()}`} aria-hidden="true">
        {d.format}
      </span>
      <div className="hlc-doc-text">
        <h3>{d.title}</h3>
        <p>{d.desc}</p>
        <p className="hlc-meta">
          {d.kind} · {topicLabel(d.topic)} · {d.size} · Updated {d.updated}
        </p>
      </div>
      <button type="button" className="hlc-dl" aria-label={`Download ${d.title}`} onClick={() => showToast('Downloads aren’t available in this prototype yet')}>
        <Icon name="FileDownload" size={18} />
        Download
      </button>
    </li>
  );
  const tutCard = (t: Tutorial) => (
    <li key={t.id} className="hlc-tut">
      <button type="button" onClick={() => showToast(`${t.format === 'Video' ? 'Videos' : 'Guides'} aren’t available in this prototype yet`)}>
        <span className={`hlc-thumb is-${t.format.toLowerCase()}`} aria-hidden="true">
          <span className="hlc-thumb-ic">
            <Icon name={t.format === 'Video' ? 'PlayVideo' : 'MenuBook'} size={26} />
          </span>
          <span className="hlc-len">{t.length}</span>
        </span>
        <span className="hlc-tut-kind">
          {t.format === 'Video' ? 'Video' : 'Step-by-step'} · {topicLabel(t.topic)}
          {t.popular && <em>Popular</em>}
        </span>
        <strong>{t.title}</strong>
        <span className="hlc-tut-desc">{t.desc}</span>
      </button>
    </li>
  );
  const faqRow = (f: Faq) => {
    const isOpen = open.includes(f.id);
    return (
      <li key={f.id} className={`hlc-faq${isOpen ? ' is-open' : ''}`}>
        <h3>
          <button type="button" aria-expanded={isOpen} aria-controls={`${uid}-${f.id}`} onClick={() => setOpen(isOpen ? open.filter((x) => x !== f.id) : [...open, f.id])}>
            <span>{f.q}</span>
            <span className="hlc-faq-ic" aria-hidden="true">
              <Icon name={isOpen ? 'MoveUp' : 'MoveDown'} size={18} />
            </span>
          </button>
        </h3>
        {isOpen && (
          <div id={`${uid}-${f.id}`} className="hlc-faq-a">
            <p>{f.a}</p>
            <div className="hlc-helpful">
              {rated[f.id] ? (
                <p role="status">Thanks for letting us know.</p>
              ) : (
                <>
                  <span>Was this helpful?</span>
                  <button type="button" onClick={() => setRated({ ...rated, [f.id]: true })}>
                    Yes
                  </button>
                  <button type="button" onClick={() => setRated({ ...rated, [f.id]: true })}>
                    No
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </li>
    );
  };
  const section = (title: string, n: number, to: HelpKind, body: ReactNode) => (
    <section className="hlc-sec" aria-labelledby={`${uid}-${to}-h`}>
      <div className="hlc-sec-head">
        <h2 id={`${uid}-${to}-h`}>{title}</h2>
        <button type="button" className="hlc-see" onClick={() => setTab(to)}>
          See all {n}
          <Icon name="ArrowForward" size={16} />
        </button>
      </div>
      {body}
    </section>
  );
  const empty = (
    <div className="hlc-empty">
      <p>
        <strong>Nothing matches{words.length ? ` “${q.trim()}”` : ''}</strong>
      </p>
      <p>Try other words or another topic.</p>
      <button type="button" className="lp-link" onClick={clear}>
        Clear filters
      </button>
    </div>
  );

  return (
    <div className="hlc">
      {toastEl}
      <header className="hlc-hero">
        <h1>Help Center</h1>
        <p>Guides, videos and answers for everything in your console.</p>
        <div className="hlc-search">
          <label htmlFor={`${uid}-q`} className="ux-visually-hidden">
            Search the Help Center
          </label>
          <Icon name="Search" size={22} />
          <input id={`${uid}-q`} type="search" placeholder="Search for answers, guides and documents" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <p className="hlc-popular">
          <span>Popular:</span>
          {POPULAR.map((p) => (
            <button key={p} type="button" onClick={() => setQ(p)}>
              {p}
            </button>
          ))}
        </p>
      </header>

      <div className="hlc-wrap">
        {/* Browse by topic */}
        <section aria-labelledby={`${uid}-topics`}>
          <h2 id={`${uid}-topics`} className="hlc-label">
            Browse by topic
          </h2>
          <ul className="hlc-topics">
            {TOPICS.map((t) => {
              const on = topic === t.id;
              return (
                <li key={t.id}>
                  <button type="button" aria-pressed={on} onClick={() => setTopic(on ? 'all' : t.id)}>
                    <span className="hlc-topic-ic" aria-hidden="true">
                      <Icon name={TOPIC_ICON[t.id]} size={20} />
                    </span>
                    <span className="hlc-topic-name">{t.label}</span>
                    <span className="hlc-topic-n">{topicCount(t.id)} articles</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* What to show */}
        <div className="hlc-tabbar">
          <div className="hlc-tabs" role="group" aria-label="Show">
            {(
              [
                ['all', 'All', total],
                ['documents', 'Documents', docs.length],
                ['tutorials', 'Tutorials', tuts.length],
                ['faq', 'FAQs', faqs.length],
              ] as const
            ).map(([id, label, n]) => (
              <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>
                {label}
                <span>{n}</span>
              </button>
            ))}
          </div>
          <div className="hlc-tab-tools">
            {tab === 'documents' && (
              <>
                <label htmlFor={`${uid}-type`}>Type</label>
                <Select id={`${uid}-type`} value={docKind} onChange={(e) => setDocKind(e.target.value)}>
                  <option value="all">All types</option>
                  {DOC_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}s
                    </option>
                  ))}
                </Select>
              </>
            )}
            {tab === 'tutorials' && (
              <>
                <label htmlFor={`${uid}-fmt`}>Format</label>
                <Select id={`${uid}-fmt`} value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="all">All formats</option>
                  <option value="Video">Videos</option>
                  <option value="Guide">Step-by-step</option>
                </Select>
              </>
            )}
            {filtered && (
              <button type="button" className="lp-link" onClick={clear}>
                Clear filters
              </button>
            )}
          </div>
        </div>
        <p className="ux-visually-hidden" role="status">
          {filtered ? `${tab === 'all' ? total : tab === 'documents' ? docs.length : tab === 'tutorials' ? tuts.length : faqs.length} results` : ''}
        </p>
        {topic !== 'all' && (
          <p className="hlc-topic-note">
            Showing <strong>{topicLabel(topic)}</strong>
          </p>
        )}

        <div ref={results} className="hlc-results">
          {tab === 'all' &&
            (total ? (
              <>
                {tuts.length > 0 && section('Tutorials', tuts.length, 'tutorials', <ul className="hlc-tuts">{tuts.slice(0, 3).map(tutCard)}</ul>)}
                {faqs.length > 0 && section('Frequently asked questions', faqs.length, 'faq', <ul className="hlc-faqs">{faqs.slice(0, 5).map(faqRow)}</ul>)}
                {docs.length > 0 && section('Documents', docs.length, 'documents', <ul className="hlc-docs">{docs.slice(0, 4).map(docRow)}</ul>)}
              </>
            ) : (
              empty
            ))}
          {tab === 'documents' && (docs.length ? <ul className="hlc-docs">{docs.map(docRow)}</ul> : empty)}
          {tab === 'tutorials' && (tuts.length ? <ul className="hlc-tuts">{tuts.map(tutCard)}</ul> : empty)}
          {tab === 'faq' &&
            (faqs.length
              ? TOPICS.filter((t) => faqs.some((f) => f.topic === t.id)).map((t) => (
                  <section key={t.id} className="hlc-faq-group" aria-labelledby={`${uid}-g-${t.id}`}>
                    <h2 id={`${uid}-g-${t.id}`}>{t.label}</h2>
                    <ul className="hlc-faqs">{faqs.filter((f) => f.topic === t.id).map(faqRow)}</ul>
                  </section>
                ))
              : empty)}
        </div>
      </div>
    </div>
  );
}
