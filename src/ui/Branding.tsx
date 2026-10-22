import { useId, useRef, useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { PRODUCT_FULL_NAME, enabledProducts, type BrandTheme } from '../lib/model';
import { usePageToast } from './PageToast';
import { THEMES, applyTheme, savedTheme as consoleTheme, type ThemeId } from '../lib/theme';
import { showError } from './ErrorToast';

/**
 * Branding: how their app looks to citizens and staff. Three columns, like a theme editor:
 * the sections on the left, the settings for one section in the middle, and a live phone
 * preview of their app's landing screen on the right. Ready-made themes change every
 * colour at once; each colour can then be fine-tuned. Nothing is saved until Save.
 */

/** The four design-system themes (DIGIT and the Teal, Blue and Black/Orange specs). Picking one sets its
 *  colours, font and corners; Save also applies it to the whole console (src/lib/theme.ts). */
const PRESETS: { id: ThemeId; name: string; primary: string; header: string; background: string; font: BrandTheme['font']; radius: BrandTheme['radius'] }[] = [
  { id: 'digit', name: 'DIGIT Classic', primary: '#C84C0E', header: '#0B4B66', background: '#F5F7F8', font: 'roboto', radius: 'rounded' },
  { id: 'teal', name: 'Lagoon', primary: '#047575', header: '#505A5F', background: '#EEEEEE', font: 'dm-sans', radius: 'pill' },
  { id: 'blue', name: 'Horizon', primary: '#0B5FD7', header: '#363636', background: '#EEEEEE', font: 'public-sans', radius: 'rounded' },
  { id: 'black-orange', name: 'Ember', primary: '#B94C1C', header: '#0F172A', background: '#F8EBE7', font: 'inter', radius: 'pill' },
];

const FONTS: { id: BrandTheme['font']; name: string; stack: string }[] = [
  { id: 'roboto', name: 'Roboto', stack: "'Roboto', system-ui, sans-serif" },
  { id: 'dm-sans', name: 'DM Sans', stack: "'DM Sans', system-ui, sans-serif" },
  { id: 'public-sans', name: 'Public Sans', stack: "'Public Sans', system-ui, sans-serif" },
  { id: 'inter', name: 'Inter', stack: "'Inter', system-ui, sans-serif" },
];
/** The theme corner styles only: DIGIT Classic rounded, Horizon subtle, Lagoon and Ember pill. */
const RADII: { id: BrandTheme['radius']; name: string; px: number }[] = [
  { id: 'sharp', name: 'Sharp', px: 2 },
  { id: 'rounded', name: 'Rounded', px: 10 },
  { id: 'soft', name: 'Soft', px: 18 },
  { id: 'pill', name: 'Pill', px: 999 },
];
/** The colour names shown under each swatch. */
const COLOUR_NAME: Record<string, string> = {
  '#C84C0E': 'Burnt orange',
  '#047575': 'Teal',
  '#0B5FD7': 'Bright blue',
  '#B94C1C': 'Rust',
  '#0B4B66': 'Deep teal',
  '#505A5F': 'Slate grey',
  '#363636': 'Charcoal',
  '#0F172A': 'Midnight',
  '#F5F7F8': 'Cool white',
  '#EEEEEE': 'Light grey',
};
/** A few words on each theme, under its name. */
const THEME_NOTE: Record<string, string> = {
  digit: 'Warm orange with deep teal',
  teal: 'Calm teal with soft greys',
  blue: 'Bright blue with crisp neutrals',
  'black-orange': 'Bold orange on near-black',
};
/** The console mix for a Branding theme: each part from the theme it matches. */
const mixOf = (t: BrandTheme) => ({
  primary: themeFor('primary', t.primary),
  heading: themeFor('header', t.header),
  background: themeFor('background', t.background),
  font: themeFor('font', t.font),
  radius: t.radius,
});
/** Which theme a value came from (for the console mix and the labels). */
const themeFor = (key: 'primary' | 'header' | 'background' | 'font' | 'radius', value: string) => PRESETS.find((x) => x[key] === value)?.id;

export const DEFAULT_THEME: BrandTheme = {
  preset: 'digit',
  primary: '#C84C0E',
  header: '#0B4B66',
  background: '#F5F7F8',
  font: 'roboto',
  scale: 'default',
  radius: 'rounded',
  footer: '',
  poweredBy: true,
};

type Section = 'themes' | 'typography' | 'color' | 'radius' | 'header' | 'footer';
const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'themes', label: 'Themes', icon: 'ViewQuilt' },
  { id: 'typography', label: 'Typography', icon: 'Typography' },
  { id: 'color', label: 'Colour', icon: 'InvertColors' },
  { id: 'radius', label: 'Radius', icon: 'RoundedCorner' },
  { id: 'header', label: 'Header', icon: 'CalendarViewDay' },
  { id: 'footer', label: 'Footer', icon: 'HorizontalSplit' },
];


export function Branding() {
  const { account, update } = useAccount();
  const uid = useId();
  // A fresh account starts from the console's current theme
  const current = PRESETS.find((x) => x.id === consoleTheme()) ?? PRESETS[0];
  const savedTheme: BrandTheme = account.branding.theme
    ? { ...DEFAULT_THEME, ...account.branding.theme }
    : { ...DEFAULT_THEME, preset: current.id, primary: current.primary, header: current.header, background: current.background, font: current.font, radius: current.radius };
  const [theme, setTheme] = useState<BrandTheme>(savedTheme);
  const [name, setName] = useState(account.branding.name);
  const [logo, setLogo] = useState(account.branding.logo);
  const [section, setSection] = useState<Section>('themes');
  const [toastEl, showToast] = usePageToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const set = (t: Partial<BrandTheme>) => setTheme((x) => ({ ...x, ...t }));
  // Picking only changes the preview; Apply theme applies it to the whole console
  const pickTheme = (p: (typeof PRESETS)[number]) => set({ preset: p.id, primary: p.primary, header: p.header, background: p.background, font: p.font, radius: p.radius });
  // The chosen theme, and whether any part now comes from another theme
  const base = PRESETS.find((x) => x.id === theme.preset);
  const differs = (k: 'primary' | 'header' | 'background' | 'font' | 'radius') => !!base && String(theme[k]).toUpperCase() !== String(base[k]).toUpperCase();
  const dirty = JSON.stringify(theme) !== JSON.stringify(savedTheme) || name !== account.branding.name || logo !== account.branding.logo;

  const pickFile = (f?: File) => {
    if (!f) return;
    if (!/image\/(png|svg\+xml|jpeg)/.test(f.type)) return showError('Choose a PNG, SVG or JPG file');
    const r = new FileReader();
    r.onload = () => setLogo(String(r.result));
    r.readAsDataURL(f);
  };
  const save = () => {
    update((a) => ({ ...a, branding: { ...a.branding, name: name.trim() || a.branding.name, logo, colour: theme.primary, saved: true, theme } }));
    // The chosen design-system theme applies to the whole console as well
    // The chosen theme, with any parts mixed in from the other themes, applies to the whole console
    if (THEMES.some((t) => t.id === theme.preset)) applyTheme(theme.preset as ThemeId, mixOf(theme));
    showToast('Theme applied');
  };
  const reset = () => {
    setTheme(savedTheme);
    setName(account.branding.name);
    setLogo(account.branding.logo);
  };

  const label = SECTIONS.find((s) => s.id === section)!.label;
  return (
    <div className="br">
      {toastEl}

      <div className="br-grid">
        <nav className="br-nav" aria-label="Branding sections">
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button type="button" aria-current={section === s.id ? 'true' : undefined} onClick={() => setSection(s.id)}>
                  <Icon name={s.icon} size={20} />
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section className="br-panel" aria-labelledby={`${uid}-sec`}>
          <div className="br-panel-head">
            <h2 id={`${uid}-sec`}>{label}</h2>
          </div>
          <div className="br-panel-card">
          {section === 'themes' && (
            <fieldset className="br-fs is-bare">
              <legend className="ux-visually-hidden">Themes</legend>
              <div className="br-fonts">
                {PRESETS.map((p) => (
                  <label key={p.id} className={`br-font br-theme-card${theme.preset === p.id ? ' is-on' : ''}`}>
                    <input
                      type="radio"
                      name={`${uid}-preset`}
                      checked={theme.preset === p.id}
                      onChange={() => pickTheme(p)}
                    />
                    <span className="br-swatch" aria-hidden="true">
                      <span style={{ background: p.header }} />
                      <span style={{ background: p.primary }} />
                      <span style={{ background: p.background }} />
                    </span>
                    <span className="br-font-name">
                      {p.name}
                    </span>
                    <span className="br-font-from">{THEME_NOTE[p.id]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {section === 'typography' && (
            <>
              <fieldset className="br-fs is-bare">
                <legend className="ux-visually-hidden">Font</legend>
                <div className="br-fonts">
                  {FONTS.map((f) => {
                    const on = theme.font === f.id;
                    return (
                      <label key={f.id} className={`br-font${on ? ' is-on' : ''}`}>
                        <input type="radio" name={`${uid}-font`} checked={on} onChange={() => set({ font: f.id })} />
                        <span className="br-font-aa" style={{ fontFamily: f.stack }} aria-hidden="true">
                          Aa
                        </span>
                        <span className="br-font-name">{f.name}</span>
                        <span className="br-font-from">{PRESETS.find((x) => x.font === f.id)?.name}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </>
          )}

          {section === 'color' && (
            <>
              {(
                [
                  ['primary', 'Primary 1', 'Buttons, links and highlights'],
                  ['header', 'Primary 2', 'Headings and navigation text'],
                  ['background', 'Background', 'Behind the cards on every page'],
                ] as const
              ).map(([key, lbl, hint]) => {
                // One swatch per distinct value, labelled with the theme(s) it comes from
                const opts = PRESETS.filter((x) => !(key === 'background' && x.id === 'black-orange')).reduce<{ value: string; from: string[] }[]>((acc, x) => {
                  const hit = acc.find((o) => o.value === x[key]);
                  if (hit) hit.from.push(x.name);
                  else acc.push({ value: x[key], from: [x.name] });
                  return acc;
                }, []);
                return (
                  <fieldset key={key} className="br-fs br-swatch-row" aria-describedby={hint ? `${uid}-${key}-hint` : undefined}>
                    <legend>{lbl}</legend>
                    {hint && (
                      <p className="br-hint" id={`${uid}-${key}-hint`}>
                        {hint}
                      </p>
                    )}
                    <div className="br-swatches">
                      {opts.map((o) => {
                        const on = theme[key].toUpperCase() === o.value.toUpperCase();
                        return (
                          <label key={o.value} className={`br-sw${on ? ' is-on' : ''}`}>
                            <input type="radio" name={`${uid}-${key}`} checked={on} onChange={() => set({ [key]: o.value } as Partial<BrandTheme>)} />
                            <span className="br-sw-dot" style={{ background: o.value }} aria-hidden="true">
                              {on && <Icon name="Check" size={16} />}
                            </span>
                            <span className="br-sw-name" title={`From ${o.from.join(', ')}`}>
                              {COLOUR_NAME[o.value.toUpperCase()] ?? o.value}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {base && differs(key) && (
                      <button type="button" className="br-part-reset" onClick={() => set({ [key]: base[key] } as Partial<BrandTheme>)}>
                        <Icon name="Refresh" size={14} />
                        Reset to {base.name} defaults
                      </button>
                    )}
                  </fieldset>
                );
              })}
            </>
          )}

          {section === 'radius' && (
            <fieldset className="br-fs is-bare">
              <legend className="ux-visually-hidden">Corners</legend>
              <div className="br-fonts">
                {RADII.map((r) => {
                  const on = theme.radius === r.id;
                  return (
                    <label key={r.id} className={`br-font${on ? ' is-on' : ''}`}>
                      <input type="radio" name={`${uid}-radius`} checked={on} onChange={() => set({ radius: r.id })} />
                      <span className="br-corner-eg" style={{ borderRadius: r.id === "pill" ? 999 : r.id === "soft" ? 9 : r.id === "rounded" ? 5 : 1 }} aria-hidden="true" />
                      <span className="br-font-name">{r.name}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {section === 'header' && (
            <>
              <div className="br-fld">
                <label htmlFor={`${uid}-name`}>Display name</label>
                <p className="br-hint" id={`${uid}-name-hint`}>
                  Shown in the header next to your logo. Your account name stays the same.
                </p>
                <input id={`${uid}-name`} value={name} aria-describedby={`${uid}-name-hint`} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="br-fld">
                <p className="br-label" id={`${uid}-logo-l`}>
                  Upload logo
                </p>
                <input
                  ref={fileInput}
                  className="ux-visually-hidden"
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <div
                  className="br-drop"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                >
                  {logo ? <img src={logo} alt="Your logo" /> : <Icon name="FileUpload" size={32} />}
                  <p>
                    Drag and drop your logo or{' '}
                    <button type="button" className="up-browse" aria-describedby={`${uid}-logo-l`} onClick={() => fileInput.current?.click()}>
                      Browse in my files
                    </button>
                  </p>
                  {logo && (
                    <button type="button" className="br-link" onClick={() => setLogo('')}>
                      Remove logo
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {section === 'footer' && (
            <>
              <div className="br-fld">
                <label htmlFor={`${uid}-footer`}>Footer text</label>
                <input
                  id={`${uid}-footer`}
                  value={theme.footer}
                  placeholder="Helpline 1800 123 456"
                  onChange={(e) => set({ footer: e.target.value })}
                />
              </div>
              <div className="br-fld">
                <label className="br-check">
                  <input type="checkbox" checked={theme.poweredBy} onChange={(e) => set({ poweredBy: e.target.checked })} />
                  Show “Powered by DIGIT”
                </label>
              </div>
            </>
          )}
              {/* Reset just this part to the chosen theme, shown only when it differs */}
            {base && (section === 'typography' || section === 'radius') && differs(section === 'typography' ? 'font' : 'radius') && (
              <button
                type="button"
                className="br-part-reset"
                onClick={() => set(section === 'typography' ? { font: base.font } : { radius: base.radius })}
              >
                <Icon name="Refresh" size={14} />
                Reset to {base.name} defaults
              </button>
            )}
          </div>
        </section>

        <div className="br-preview-col">

          <div className="br-preview-bar">

            <Button variation="secondary" label="Return to last saved" title="Go back to how your branding looked when you last saved it" onClick={reset} isDisabled={!dirty} />

          </div>

          <Preview theme={theme} name={name || account.branding.name} logo={logo} />

        </div>
      </div>

      <footer className="cg-bar br-bar">
        <Button variation="primary" label="Apply theme" onClick={save} />
      </footer>
    </div>
  );
}

/** Their app's home screen in a phone, drawn with the theme. Decorative: the settings carry the meaning. */
function Preview({ theme, name, logo }: { theme: BrandTheme; name: string; logo: string }) {
  const { account } = useAccount();
  const font = FONTS.find((f) => f.id === theme.font)!.stack;
  const radius = RADII.find((r) => r.id === theme.radius)!.px;
  const first = account.admin.name.trim().split(/\s+/)[0] || 'there';
  const products = enabledProducts(account).slice(0, 2);
  // Pill: buttons fully round, cards a soft corner
  const style = {
    '--br-p': theme.primary,
    '--br-h': theme.header,
    '--br-bg': theme.background,
    '--br-r': `${Math.min(radius, 14)}px`,
    '--br-rb': `${radius}px`,
    fontFamily: font,
  } as React.CSSProperties;
  return (
    <figure className="br-preview is-dash" aria-label={`Preview of ${name}’s console home`}>
      <div className="br-dash" style={style} aria-hidden="true">
        {/* Window bar */}
        <div className="br-dash-chrome">
          <span />
          <span />
          <span />
        </div>
        {/* Top bar */}
        <div className="br-dash-top">
          <span className="br-brand">
            {logo ? <img src={logo} alt="" /> : <span className="br-mark">{(name[0] ?? 'D').toUpperCase()}</span>}
            <span>{name}</span>
          </span>
          <img className="br-dash-digit" src="/digit-logo.png" alt="" />
        </div>
        <div className="br-dash-body">
          {/* Side nav */}
          <div className="br-dash-nav">
            {(
              [
                ['Home', 'Home'],
                ['Geographies', 'Public'],
                ['Team', 'Group'],
                ['Channels', 'Email'],
                ['Integrations', 'Extension'],
                ['Branding', 'InvertColors'],
              ] as const
            ).map(([t, ic], i) => (
              <span key={t} className={i === 0 ? 'is-on' : undefined}>
                <Icon name={ic} size={14} />
                {t}
              </span>
            ))}
          </div>
          {/* Home */}
          <div className="br-dash-main">
            <div className="br-dash-hero">
              <strong>
                Hi <em>{first}</em>
              </strong>
              <span>Your one stop to access your products for {name}.</span>
            </div>
            <div className="br-dash-setup">
              <div className="br-dash-setup-top">
                <span>Your account setup progress</span>
                <span className="br-dash-bar">
                  <i />
                </span>
              </div>
              <div className="br-dash-task">
                <span className="br-mod-ic">
                  <Icon name="Email" size={14} />
                </span>
                <span className="br-dash-task-text">
                  <strong>Set up notification channels</strong>
                  <span>Updates go out in your organisation’s name.</span>
                </span>
                <span className="br-dash-btn">Add channels</span>
              </div>
            </div>
            <div className="br-dash-products">
              {products.map((p) => (
                <div key={p} className="br-dash-product">
                  <strong>{PRODUCT_FULL_NAME[p]}</strong>
                  <span className="br-dash-stats">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="br-dash-art" />
                  <span className="br-dash-btn is-wide">View product</span>
                </div>
              ))}
            </div>
            {(theme.footer || theme.poweredBy) && (
              <p className="br-dash-foot">
                {theme.footer}
                {theme.footer && theme.poweredBy ? ' · ' : ''}
                {theme.poweredBy ? 'Powered by DIGIT' : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </figure>
  );
}
