import { useEffect, useId, useRef, useState } from 'react';
import { Button, Toast } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { Crumbs } from './Crumbs';
import type { LanguageState } from '../lib/model';

/**
 * Languages: the languages citizens and staff can use DIGIT in. Laid out like Geographies and Integrations:
 * a band with Add languages, your languages as cards, and an add flow. Adding offers AI translation (drafts
 * every screen, then you review), uploading your own file, or translating by hand. Prototype: the AI run and
 * the review are simulated.
 */

type Lang = { code: string; name: string; native: string; region: string };
const CATALOGUE: Lang[] = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', region: 'India' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', region: 'India, Bangladesh' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', region: 'India, Sri Lanka' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', region: 'India' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', region: 'India' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', region: 'India' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili', region: 'Kenya, Tanzania' },
  { code: 'fr', name: 'French', native: 'Français', region: 'Global' },
  { code: 'pt', name: 'Portuguese', native: 'Português', region: 'Mozambique, Brazil' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ', region: 'Ethiopia' },
  { code: 'ha', name: 'Hausa', native: 'Hausa', region: 'Nigeria' },
  { code: 'es', name: 'Spanish', native: 'Español', region: 'Global' },
];
const ENGLISH: Lang = { code: 'en', name: 'English', native: 'English', region: 'Default' };
const STRINGS = 1240;
const STATUS: Record<LanguageState['state'], string> = { translating: 'Translating', review: 'Ready to review', live: 'Live' };

/** Sample strings for the review step: English, and an AI draft per language. */
const SAMPLE: { en: string; draft: Record<string, string> }[] = [
  { en: 'Register a complaint', draft: { hi: 'शिकायत दर्ज करें', sw: 'Sajili malalamiko', fr: 'Enregistrer une plainte', pt: 'Registrar uma reclamação' } },
  { en: 'Your complaint has been resolved', draft: { hi: 'आपकी शिकायत का समाधान हो गया है', sw: 'Malalamiko yako yametatuliwa', fr: 'Votre plainte a été résolue', pt: 'Sua reclamação foi resolvida' } },
  { en: 'Choose your ward', draft: { hi: 'अपना वार्ड चुनें', sw: 'Chagua kata yako', fr: 'Choisissez votre quartier', pt: 'Escolha o seu bairro' } },
  { en: 'Pay licence fee', draft: { hi: 'लाइसेंस शुल्क का भुगतान करें', sw: 'Lipa ada ya leseni', fr: 'Payer les frais de licence', pt: 'Pagar a taxa de licença' } },
  { en: 'Track your request', draft: { hi: 'अपने अनुरोध को ट्रैक करें', sw: 'Fuatilia ombi lako', fr: 'Suivez votre demande', pt: 'Acompanhe seu pedido' } },
];
const findLang = (code: string) => CATALOGUE.find((l) => l.code === code) ?? ENGLISH;

export function Languages() {
  const { account, update, go } = useAccount();
  const langs = account.languages ?? {};
  const added = Object.keys(langs);
  const [adding, setAdding] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  // AI translation runs in the background: move each translating language along until it's ready to review
  useEffect(() => {
    const running = added.filter((c) => langs[c].state === 'translating');
    if (!running.length) return;
    const t = window.setTimeout(() => {
      update((a) => {
        const next = { ...(a.languages ?? {}) };
        for (const c of running) {
          const p = Math.min(100, (next[c].progress ?? 0) + 34);
          next[c] = { ...next[c], progress: p, state: p >= 100 ? 'review' : 'translating' };
        }
        return { ...a, languages: next };
      });
    }, 900);
    return () => window.clearTimeout(t);
  }, [langs, added, update]);

  const toastEl = (
    <div className="cg-toast" role="status" aria-live="polite">
      {toast && <Toast type="success" label={toast} onClose={() => setToast('')} />}
    </div>
  );
  const trail = [{ label: 'Home', onClick: () => go('home') }, { label: 'Languages', onClick: () => { setAdding(false); setReviewing(null); } }];

  if (adding)
    return (
      <div className="geo is-creating">
        <AddLanguages
          trail={trail}
          taken={added}
          onClose={(m) => {
            setAdding(false);
            if (m) setToast(m);
          }}
        />
        {toastEl}
      </div>
    );
  if (reviewing)
    return (
      <div className="geo is-creating">
        <Review
          trail={trail}
          code={reviewing}
          onClose={(m) => {
            setReviewing(null);
            if (m) setToast(m);
          }}
        />
        {toastEl}
      </div>
    );

  return (
    <div className="geo is-overview">
      <header className="geo-head geo-band">
        <div className="geo-band-text">
          <h1 ref={heading} tabIndex={-1}>
            Languages
          </h1>
          <p className="geo-lead">
            Languages are what citizens and staff see DIGIT in. English is always there. Add more and DIGIT’s AI drafts the
            translations for every screen and message, then you review them before they go live.
          </p>
        </div>
        <Button variation="primary" icon="Add" label="Add language" onClick={() => setAdding(true)} />
      </header>
      <div className="geo-bar">
        <h2 className="geo-section-h">
          Your languages <span className="geo-section-n">{added.length + 1}</span>
        </h2>
      </div>
      <ul className="lg-cards">
        {[ENGLISH.code, ...added].map((c) => {
          const l = findLang(c);
          const st = c === 'en' ? null : langs[c];
          return (
            <li key={c} className="lg-card">
              <div className="lg-card-top">
                <span className="lg-native-big" lang={c}>
                  {l.native}
                </span>
                {st ? (
                  <span className={`geo-status${st.state === 'live' ? ' is-active' : st.state === 'review' ? ' is-pending' : ''}`}>{STATUS[st.state]}</span>
                ) : (
                  <span className="geo-status is-active">Default</span>
                )}
              </div>
              <strong className="lg-card-name">{l.name}</strong>
              {/* What's done: how much is translated, and whether a person has checked it */}
              {st?.state !== 'translating' && (
                <dl className="ch-fields lg-facts">
                  <div>
                    <dt>Translated</dt>
                    <dd>
                      {st?.method === 'manual' && st.state !== 'live' ? '0' : STRINGS.toLocaleString('en')} of {STRINGS.toLocaleString('en')} texts
                    </dd>
                  </div>
                  {c === 'en' && (
                    <div>
                      <dt>Role</dt>
                      <dd>Source for translations</dd>
                    </div>
                  )}
                  {st && (
                    <div>
                      <dt>Translated by</dt>
                      <dd>{st.method === 'ai' ? 'DIGIT AI' : st.method === 'upload' ? 'Your file' : 'Your team'}</dd>
                    </div>
                  )}
                </dl>
              )}
              {st?.state === 'translating' && (
                <div className="lg-sample">
                  <span className="lg-sample-wait">
                    <Icon name="AutoAwesome" size={14} />
                    Translating… {st.progress ?? 0}%
                  </span>
                  <span className="lg-bar" role="progressbar" aria-label={`${l.name} translation`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={st.progress ?? 0}>
                    <i style={{ width: `${st.progress ?? 0}%` }} />
                  </span>
                </div>
              )}
              {st && st.state !== 'translating' && (
                <Button
                  variation="secondary"
                  icon="Edit"
                  label="Edit translations"
                  ariaLabel={`Edit ${l.name} translations`}
                  onClick={() => setReviewing(c)}
                />
              )}
            </li>
          );
        })}
      </ul>
      {toastEl}
    </div>
  );
}

/** Add: pick languages (searchable cards), then how to translate them. */
function AddLanguages({ trail, taken, onClose }: { trail: { label: string; onClick?: () => void }[]; taken: string[]; onClose: (m?: string) => void }) {
  const { update } = useAccount();
  const uid = useId();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [method, setMethod] = useState<LanguageState['method']>('ai');
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const term = q.trim().toLowerCase();
  const list = CATALOGUE.filter((l) => !taken.includes(l.code) && (!term || `${l.name} ${l.native} ${l.region}`.toLowerCase().includes(term)));

  const next = () => {
    if (step === 0) {
      if (!picked.length) {
        setError('Choose a language');
        return;
      }
      setError('');
      return setStep(1);
    }
    update((a) => {
      const langs = { ...(a.languages ?? {}) };
      for (const c of picked) langs[c] = { state: method === 'ai' ? 'translating' : 'review', method, progress: method === 'ai' ? 0 : 100 };
      return { ...a, languages: langs };
    });
    const n = findLang(picked[0]).name;
    onClose(method === 'ai' ? `AI is translating ${n}` : `${n} added`);
  };

  return (
    <div className="cg-page">
      <Crumbs items={[...trail, { label: 'Add language' }]} />
      <section className="cg" aria-labelledby={`${uid}-h`}>
        <h1 id={`${uid}-h`} ref={heading} tabIndex={-1}>
          {step === 0 ? 'Which language do you want to add?' : `How do you want to translate ${findLang(picked[0] ?? '').name}?`}
        </h1>
        <div className="cg-sub">
          <p>{step === 0 ? 'Choose a language your citizens and staff use. You can add more later.' : 'Pick how the screens and messages get translated. Nothing reaches citizens until you publish it.'}</p>
        </div>
        {step === 0 ? (
          <>
            <div className="geo-search lg-search">
              <label htmlFor={`${uid}-q`} className="ux-visually-hidden">
                Search languages
              </label>
              <Icon name="Search" size={20} />
              <input id={`${uid}-q`} type="search" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {error && (
              <p className="fld-error" role="alert">
                {error}
              </p>
            )}
            <fieldset className="lg-pick">
              <legend className="ux-visually-hidden">Languages</legend>
              {list.map((l) => {
                const on = picked.includes(l.code);
                return (
                  <label key={l.code} className={`lg-pick-card${on ? ' is-on' : ''}`}>
                    <input type="radio" name={`${uid}-lang`} checked={on} onChange={() => setPicked([l.code])} />
                    <span className="lg-native-big" lang={l.code}>
                      {l.native}
                    </span>
                    <strong>{l.name}</strong>
                    <span className={`lg-check${on ? ' is-on' : ''}`} aria-hidden="true">
                      {on && <Icon name="Check" size={14} />}
                    </span>
                  </label>
                );
              })}
              {!list.length && <p className="lg-empty">No languages match “{q.trim()}”.</p>}
            </fieldset>
          </>
        ) : (
          <fieldset className="qz-tiles cg-tiles lg-method-tiles">
            <legend className="ux-visually-hidden">How to translate</legend>
            <div className="qz-tile-row">
              {(
                [
                  ['ai', 'AutoAwesome', 'Translate with AI', 'Needs your review'],
                  ['manual', 'Edit', 'Translate manually', ''],
                  ['upload', 'FileUpload', 'Bulk upload translation', ''],
                ] as const
              ).map(([id, icon, title, tag]) => {
                const on = method === id;
                return (
                  <label key={id} className={`qz-tile${on ? ' is-on' : ''}`}>
                    <input type="radio" name={`${uid}-m`} checked={on} onChange={() => setMethod(id)} />
                    <span className="cg-tile-icon" aria-hidden="true">
                      <Icon name={icon} size={28} />
                    </span>
                    <span className="qz-tile-label">{title}</span>
                    {tag && <span className="lg-tag lg-tile-tag">{tag}</span>}
                    {on && (
                      <span className="qz-tile-tick" aria-hidden="true">
                        <Icon name="Check" size={12} />
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      </section>
      <footer className="cg-bar">
        <Button variation="secondary" icon="ArrowBack" label="Back" onClick={() => (step === 0 ? onClose() : setStep(0))} />
        <Button
          variation="primary"
          label={step === 0 ? 'Next' : method === 'ai' ? 'Translate with AI' : 'Add language'}
          icon={step === 0 ? 'ArrowForward' : undefined}
          isSuffix
          onClick={next}
        />
      </footer>
    </div>
  );
}

/** Review: each text in English beside its translation, editable, then publish. */
function Review({ trail, code, onClose }: { trail: { label: string; onClick?: () => void }[]; code: string; onClose: (m?: string) => void }) {
  const { account, update } = useAccount();
  const uid = useId();
  const l = findLang(code);
  const st = account.languages?.[code];
  const [rows, setRows] = useState(() => SAMPLE.map((r) => ({ en: r.en, value: st?.method === 'manual' ? '' : r.draft[code] ?? `${r.en} (${l.name})` })));
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const publish = () => {
    update((a) => ({ ...a, languages: { ...(a.languages ?? {}), [code]: { ...(a.languages ?? {})[code], state: 'live', progress: 100 } } }));
    onClose(`${l.name} is live`);
  };
  return (
    <div className="cg-page">
      <Crumbs items={[...trail, { label: `${st?.state === 'live' ? 'Edit' : 'Review'} ${l.name}` }]} />
      <section className="cg" aria-labelledby={`${uid}-h`}>
        <h1 id={`${uid}-h`} ref={heading} tabIndex={-1}>
          {st?.state === 'live' ? `Edit ${l.name} translations` : `Review ${l.name} translations`}
        </h1>
        <div className="cg-sub">
          <p>
            {st?.method === 'ai' ? 'DIGIT AI drafted these. Check each one and change anything that reads wrong. ' : ''}
            Showing {rows.length} of {STRINGS.toLocaleString('en')} texts.
          </p>
        </div>
        <div className="geo-table-wrap">
          <table className="geo-table lg-table">
            <thead>
              <tr>
                <th scope="col">English</th>
                <th scope="col">{l.name}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.en}>
                  <th scope="row">{r.en}</th>
                  <td>
                    <label className="ux-visually-hidden" htmlFor={`${uid}-${i}`}>
                      {l.name} for “{r.en}”
                    </label>
                    <input
                      id={`${uid}-${i}`}
                      lang={code}
                      value={r.value}
                      placeholder={`Enter the ${l.name} text`}
                      onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <footer className="cg-bar">
        <Button variation="secondary" icon="ArrowBack" label="Back" onClick={() => onClose()} />
        <Button variation="primary" label={st?.state === 'live' ? 'Save changes' : `Publish ${l.name}`} onClick={publish} />
      </footer>
    </div>
  );
}
