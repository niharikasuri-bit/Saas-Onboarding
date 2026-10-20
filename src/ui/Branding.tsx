import { useId, useRef, useState } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { PRODUCTS, enabledProducts, type BrandTheme } from '../lib/model';
import { usePageToast } from './PageToast';

/**
 * Branding: how their app looks to citizens and staff. Three columns, like a theme editor:
 * the sections on the left, the settings for one section in the middle, and a live phone
 * preview of their app's landing screen on the right. Ready-made themes change every
 * colour at once; each colour can then be fine-tuned. Nothing is saved until Save.
 */

const PRESETS: { id: string; name: string; primary: string; header: string; background: string }[] = [
  { id: 'digit', name: 'DIGIT', primary: '#C84C0E', header: '#0B4B66', background: '#F5F7F8' },
  { id: 'ocean', name: 'Ocean', primary: '#0B63B5', header: '#0A3D6B', background: '#F3F7FB' },
  { id: 'forest', name: 'Forest', primary: '#2E7D32', header: '#1B4D3E', background: '#F3F8F4' },
  { id: 'royal', name: 'Royal', primary: '#6A3FA0', header: '#3B2163', background: '#F7F4FB' },
  { id: 'sunset', name: 'Sunset', primary: '#C2410C', header: '#7A2E0E', background: '#FFF7F2' },
  { id: 'slate', name: 'Slate', primary: '#334E68', header: '#102A43', background: '#F5F7FA' },
];

const FONTS: { id: BrandTheme['font']; name: string; stack: string }[] = [
  { id: 'roboto', name: 'Roboto', stack: "'Roboto', system-ui, sans-serif" },
  { id: 'system', name: 'System sans-serif', stack: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { id: 'serif', name: 'Serif', stack: "Georgia, 'Times New Roman', serif" },
];
const SCALES: { id: BrandTheme['scale']; name: string; px: number }[] = [
  { id: 'small', name: 'Small', px: 13 },
  { id: 'default', name: 'Default', px: 14 },
  { id: 'large', name: 'Large', px: 15.5 },
];
const RADII: { id: BrandTheme['radius']; name: string; px: number }[] = [
  { id: 'sharp', name: 'Sharp', px: 2 },
  { id: 'rounded', name: 'Rounded', px: 10 },
  { id: 'soft', name: 'Soft', px: 18 },
];

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

/** WCAG contrast ratio between two hex colours. */
function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const n = hex.replace('#', '');
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

export function Branding() {
  const { account, update } = useAccount();
  const uid = useId();
  const savedTheme = { ...DEFAULT_THEME, ...account.branding.theme };
  const [theme, setTheme] = useState<BrandTheme>(savedTheme);
  const [name, setName] = useState(account.branding.name);
  const [logo, setLogo] = useState(account.branding.logo);
  const [section, setSection] = useState<Section>('themes');
  const [fileError, setFileError] = useState('');
  const [toastEl, showToast] = usePageToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const set = (t: Partial<BrandTheme>) => setTheme((x) => ({ ...x, ...t }));
  const dirty = JSON.stringify(theme) !== JSON.stringify(savedTheme) || name !== account.branding.name || logo !== account.branding.logo;

  const pickFile = (f?: File) => {
    if (!f) return;
    if (!/image\/(png|svg\+xml|jpeg)/.test(f.type)) return setFileError('Choose a PNG, SVG or JPG file');
    setFileError('');
    const r = new FileReader();
    r.onload = () => setLogo(String(r.result));
    r.readAsDataURL(f);
  };
  const save = () => {
    update((a) => ({ ...a, branding: { ...a.branding, name: name.trim() || a.branding.name, logo, colour: theme.primary, saved: true, theme } }));
    showToast('Branding saved');
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
      <header className="br-head">
        <h1>Branding</h1>
        <p>Choose how your app looks to citizens and staff. Start from a theme, then adjust anything. The preview shows your app’s home screen.</p>
      </header>

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
          <h2 id={`${uid}-sec`}>{label}</h2>

          {section === 'themes' && (
            <fieldset className="br-fs">
              <legend className="br-hint">Pick a theme to change every colour at once. You can fine-tune them in Colour.</legend>
              <div className="br-themes">
                {PRESETS.map((p) => (
                  <label key={p.id} className={`br-theme${theme.preset === p.id ? ' is-on' : ''}`}>
                    <input
                      type="radio"
                      name={`${uid}-preset`}
                      checked={theme.preset === p.id}
                      onChange={() => set({ preset: p.id, primary: p.primary, header: p.header, background: p.background })}
                    />
                    <span className="br-swatch" aria-hidden="true">
                      <span style={{ background: p.header }} />
                      <span style={{ background: p.primary }} />
                      <span style={{ background: p.background }} />
                    </span>
                    <span className="br-theme-name">{p.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {section === 'typography' && (
            <>
              <div className="br-fld">
                <label htmlFor={`${uid}-font`}>Font</label>
                <select id={`${uid}-font`} value={theme.font} onChange={(e) => set({ font: e.target.value as BrandTheme['font'] })}>
                  {FONTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <fieldset className="br-fs">
                <legend>Text size</legend>
                <div className="br-seg">
                  {SCALES.map((s) => (
                    <label key={s.id} className={theme.scale === s.id ? 'is-on' : undefined}>
                      <input type="radio" name={`${uid}-scale`} checked={theme.scale === s.id} onChange={() => set({ scale: s.id })} />
                      {s.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {section === 'color' && (
            <>
              <p className="br-hint">Changing a colour switches the theme to Custom.</p>
              {(
                [
                  ['primary', 'Primary colour', 'Buttons, links and icons.'],
                  ['header', 'Header colour', 'The bar at the top of every screen.'],
                  ['background', 'Background colour', 'Behind the cards.'],
                ] as const
              ).map(([key, lbl, hint]) => {
                const value = theme[key];
                const low = key === 'background' ? contrast(value, '#1F2933') < 4.5 : contrast(value, '#FFFFFF') < 4.5;
                return (
                  <div key={key} className="br-fld">
                    <label htmlFor={`${uid}-${key}`}>{lbl}</label>
                    <p className="br-hint" id={`${uid}-${key}-hint`}>
                      {hint}
                    </p>
                    <div className="br-colour">
                      <input
                        id={`${uid}-${key}`}
                        type="color"
                        value={value}
                        aria-describedby={`${uid}-${key}-hint${low ? ` ${uid}-${key}-warn` : ''}`}
                        onChange={(e) => set({ [key]: e.target.value.toUpperCase(), preset: 'custom' } as Partial<BrandTheme>)}
                      />
                      <span className="br-hex">{value.toUpperCase()}</span>
                    </div>
                    {low && (
                      <p className="br-warn" id={`${uid}-${key}-warn`}>
                        <Icon name="Warning" size={16} />
                        {key === 'background' ? 'Dark text is hard to read on this colour.' : 'White text is hard to read on this colour.'}
                      </p>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {section === 'radius' && (
            <fieldset className="br-fs">
              <legend className="br-hint">How rounded cards and buttons are.</legend>
              <div className="br-seg">
                {RADII.map((r) => (
                  <label key={r.id} className={theme.radius === r.id ? 'is-on' : undefined}>
                    <input type="radio" name={`${uid}-radius`} checked={theme.radius === r.id} onChange={() => set({ radius: r.id })} />
                    <span className="br-radius-eg" style={{ borderRadius: r.px }} aria-hidden="true" />
                    {r.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {section === 'header' && (
            <>
              <div className="br-fld">
                <label htmlFor={`${uid}-name`}>App name</label>
                <input id={`${uid}-name`} value={name} onChange={(e) => setName(e.target.value)} />
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
                {fileError && (
                  <p className="fld-error" role="alert">
                    {fileError}
                  </p>
                )}
              </div>
            </>
          )}

          {section === 'footer' && (
            <>
              <div className="br-fld">
                <label htmlFor={`${uid}-footer`}>Footer text</label>
                <p className="br-hint" id={`${uid}-footer-hint`}>
                  For example your helpline or website.
                </p>
                <input
                  id={`${uid}-footer`}
                  value={theme.footer}
                  placeholder="Helpline 1800 123 456"
                  aria-describedby={`${uid}-footer-hint`}
                  onChange={(e) => set({ footer: e.target.value })}
                />
              </div>
              <label className="br-check">
                <input type="checkbox" checked={theme.poweredBy} onChange={(e) => set({ poweredBy: e.target.checked })} />
                Show “Powered by DIGIT”
              </label>
            </>
          )}
        </section>

        <Preview theme={theme} name={name || account.branding.name} logo={logo} />
      </div>

      <footer className="cg-bar">
        <Button variation="secondary" label="Reset" title="Undo changes since you last saved" onClick={reset} isDisabled={!dirty} />
        <Button variation="primary" label="Save" onClick={save} />
      </footer>
    </div>
  );
}

/** Their app's home screen in a phone, drawn with the theme. Decorative: the settings carry the meaning. */
function Preview({ theme, name, logo }: { theme: BrandTheme; name: string; logo: string }) {
  const { account } = useAccount();
  const font = FONTS.find((f) => f.id === theme.font)!.stack;
  const size = SCALES.find((s) => s.id === theme.scale)!.px;
  const radius = RADII.find((r) => r.id === theme.radius)!.px;
  const mine = enabledProducts(account).map((p) => ({ name: PRODUCTS[p].name, icon: PRODUCTS[p].icon, note: 'Open service' }));
  const modules = [...mine, { name: 'Surveys', icon: 'Assignment', note: 'Take part in surveys' }, { name: 'Requests', icon: 'Description', note: 'Raise and track requests' }, { name: 'Payments', icon: 'Receipt', note: 'Pay bills and fees' }].slice(0, 4);
  const style = { '--br-p': theme.primary, '--br-h': theme.header, '--br-bg': theme.background, '--br-r': `${radius}px`, fontFamily: font, fontSize: `${size}px` } as React.CSSProperties;
  return (
    <figure className="br-preview" aria-label={`Preview of ${name}’s app home screen`}>
      <div className="br-phone" style={style} aria-hidden="true">
        <div className="br-status">
          <span>9:41</span>
          <span>▮▮▮ ◔</span>
        </div>
        <div className="br-appbar">
          <span className="br-menu">
            <Icon name="Menu" size={20} />
          </span>
          <span className="br-brand">
            {logo ? <img src={logo} alt="" /> : <span className="br-mark">{(name[0] ?? 'D').toUpperCase()}</span>}
            <span>{name}</span>
          </span>
          <span className="br-bell">
            <Icon name="Notifications" size={20} />
          </span>
        </div>
        <div className="br-screen">
          <div className="br-card br-welcome">
            <span className="br-small">Welcome back,</span>
            <strong>Good morning!</strong>
          </div>
          <div className="br-row-h">
            <strong>My services</strong>
            <span className="br-link-p">View all</span>
          </div>
          <div className="br-mods">
            {modules.map((m) => (
              <div key={m.name} className="br-card br-mod">
                <span className="br-mod-ic">
                  <Icon name={m.icon} size={18} />
                </span>
                <strong>{m.name}</strong>
                <span className="br-small">{m.note}</span>
              </div>
            ))}
          </div>
          <div className="br-row-h">
            <strong>Recent activity</strong>
            <span className="br-link-p">View all</span>
          </div>
          <div className="br-card br-act">
            <span className="br-dot" />
            <span>
              <strong>Complaint registered</strong>
              <span className="br-small">CMP-2026-000123</span>
            </span>
            <span className="br-small">2h ago</span>
          </div>
          <button className="br-cta" tabIndex={-1}>
            Report a problem
          </button>
          {(theme.footer || theme.poweredBy) && (
            <p className="br-foot">
              {theme.footer}
              {theme.footer && theme.poweredBy ? ' · ' : ''}
              {theme.poweredBy ? 'Powered by DIGIT' : ''}
            </p>
          )}
        </div>
        <div className="br-tabs">
          {(
            [
              ['Home', 'Home'],
              ['My tasks', 'Assignment'],
              ['Create', 'AddCircle'],
              ['Alerts', 'Notifications'],
              ['Profile', 'Person'],
            ] as const
          ).map(([t, ic], i) => (
            <span key={t} className={i === 0 ? 'is-on' : undefined}>
              <Icon name={ic} size={18} />
              {t}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
