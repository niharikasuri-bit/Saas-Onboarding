/**
 * Four design-system themes to compare: DIGIT (the library default) and the Teal, Blue and Black/Orange
 * drafts (from the DIGIT theme specification documents). A theme overrides the library's colour variables,
 * our own brand-tint variables, the font, and (where the spec says so) makes buttons pill-shaped.
 * The choice is kept in the browser.
 */

export type ThemeId = 'digit' | 'teal' | 'blue' | 'black-orange';

type Theme = { id: ThemeId; label: string; font: string; pill: boolean; vars: Record<string, string> };

const ALERTS = {
  '--digitv2-lightTheme-alert-error': '#B91900',
  '--digitv2-lightTheme-alert-errorbg': '#FFF5F4',
  '--digitv2-lightTheme-alert-success': '#00703C',
  '--digitv2-lightTheme-alert-successbg': '#F1FFF8',
  '--digitv2-lightTheme-alert-warning': '#9E5F00',
  '--digitv2-lightTheme-alert-warning-bg': '#FFF9F0',
};
const COOL_NEUTRALS = {
  '--digitv2-lightTheme-text-primary': '#363636',
  '--digitv2-lightTheme-text-secondary': '#787878',
  '--digitv2-lightTheme-text-disabled': '#C5C5C5',
  '--digitv2-lightTheme-generic-background': '#EEEEEE',
  '--digitv2-lightTheme-generic-divider': '#D6D5D4',
  '--digitv2-lightTheme-generic-inputborder': '#505A5F',
  '--digitv2-lightTheme-paper-primary': '#FFFFFF',
  '--digitv2-lightTheme-paper-secondary': '#FAFAFA',
};
/** Brand tints our own styles use, derived per theme: ink (brand text on light), soft, tint, and RGB triples. */
const tints = (primary: string, ink: string, rgb: string, bgRgb: string, soft: string, tint: string) => ({
  '--c-primary-ink': ink,
  '--c-primary-rgb': rgb,
  '--c-primary-bg-rgb': bgRgb,
  '--c-primary-soft': soft,
  '--c-primary-tint': tint,
  '--digitv2-lightTheme-primary-1': primary,
});

export const THEMES: Theme[] = [
  { id: 'digit', label: 'DIGIT Classic', font: "'Roboto', sans-serif", pill: false, vars: {} },
  {
    id: 'teal',
    label: 'Lagoon',
    font: "'DM Sans', sans-serif",
    pill: true,
    vars: {
      ...ALERTS,
      ...COOL_NEUTRALS,
      ...tints('#047575', '#036464', '4 117 117', '232 240 240', '#B8D6D6', '#F4F9F9'),
      '--digitv2-lightTheme-primary-bg': '#E8F0F0',
      '--digitv2-lightTheme-primary-2': '#505A5F',
      '--digitv2-lightTheme-alert-info': '#0057BD',
      '--digitv2-lightTheme-alert-infobg': '#DEEFFF',
    },
  },
  {
    id: 'blue',
    label: 'Horizon',
    font: "'Public Sans', sans-serif",
    pill: false,
    vars: {
      ...ALERTS,
      ...COOL_NEUTRALS,
      ...tints('#0B5FD7', '#0A52BA', '11 95 215', '226 234 246', '#BCD0EE', '#F5F8FD'),
      '--digitv2-lightTheme-primary-bg': '#E2EAF6',
      '--digitv2-lightTheme-primary-2': '#363636',
      '--digitv2-lightTheme-alert-info': '#193C74',
      '--digitv2-lightTheme-alert-infobg': '#E0ECFF',
    },
  },
  {
    id: 'black-orange',
    label: 'Ember',
    font: "'Inter', sans-serif",
    pill: true,
    vars: {
      ...ALERTS,
      ...tints('#B94C1C', '#A34318', '185 76 28', '251 238 232', '#EFCDBD', '#FFFAF7'),
      '--digitv2-lightTheme-primary-bg': '#FBEEE8',
      '--digitv2-lightTheme-primary-2': '#0F172A',
      '--digitv2-lightTheme-alert-info': '#0057BD',
      '--digitv2-lightTheme-alert-infobg': '#DEEFFF',
      '--digitv2-lightTheme-text-primary': '#3D3430',
      '--digitv2-lightTheme-text-secondary': '#817672',
      '--digitv2-lightTheme-text-disabled': '#CEC2BE',
      '--digitv2-lightTheme-generic-divider': '#DFD3CE',
      '--digitv2-lightTheme-generic-background': '#F8EBE7',
      '--digitv2-lightTheme-generic-inputborder': '#605652',
    },
  },
];

const KEY = 'digit-theme';
const applied = new Set<string>();

export function savedTheme(): ThemeId {
  const v = localStorage.getItem(KEY);
  return THEMES.some((t) => t.id === v) ? (v as ThemeId) : 'digit';
}

/** A mix: each part taken from one of the themes (only theme values are allowed). */
export type ThemeMix = { primary?: ThemeId; heading?: ThemeId; background?: ThemeId; font?: ThemeId; corners?: ThemeId; radius?: 'sharp' | 'rounded' | 'soft' | 'pill' };
const MIX_KEY = 'digit-theme-mix';

/** DIGIT Classic's values, spelt out (the theme itself relies on the library defaults). */
const DIGIT_PRIMARY: Record<string, string> = {
  '--digitv2-lightTheme-primary-1': '#C84C0E',
  '--digitv2-lightTheme-primary-bg': '#FBEEE8',
  '--c-primary-ink': '#B8460C',
  '--c-primary-rgb': '200 76 14',
  '--c-primary-bg-rgb': '251 238 232',
  '--c-primary-soft': '#F2CDB8',
  '--c-primary-tint': '#FFFAF7',
};
const PRIMARY_KEYS = Object.keys(DIGIT_PRIMARY);
const byId = (id: ThemeId) => THEMES.find((x) => x.id === id) ?? THEMES[0];
const primaryOf = (id: ThemeId) => (id === 'digit' ? DIGIT_PRIMARY : Object.fromEntries(PRIMARY_KEYS.map((k) => [k, byId(id).vars[k]])));
const headingOf = (id: ThemeId) => (id === 'digit' ? '#0B4B66' : byId(id).vars['--digitv2-lightTheme-primary-2']);
const backgroundOf = (id: ThemeId) => (id === 'digit' ? '#EEEEEE' : byId(id).vars['--digitv2-lightTheme-generic-background']);
/** Corner style per theme: Lagoon and Ember have pill buttons, Horizon is subtle (its scale starts at 0), DIGIT Classic is rounded. */
export const CORNERS: Record<ThemeId, 'rounded' | 'subtle' | 'pill'> = { digit: 'rounded', teal: 'pill', blue: 'rounded', 'black-orange': 'pill' };

export function savedMix(): ThemeMix {
  try {
    return JSON.parse(localStorage.getItem(MIX_KEY) || '{}') as ThemeMix;
  } catch {
    return {};
  }
}

/** Applies a theme to the page (plus any mixed-in parts from other themes) and remembers it. */
export function applyTheme(id: ThemeId, mix: ThemeMix = {}, persist = true) {
  const t = byId(id);
  const root = document.documentElement;
  // Clear what the previous theme set, so DIGIT falls back to the library defaults
  for (const k of applied) root.style.removeProperty(k);
  applied.clear();
  const vars: Record<string, string> = { ...t.vars };
  if (mix.primary && mix.primary !== id) Object.assign(vars, primaryOf(mix.primary));
  if (mix.heading && mix.heading !== id) vars['--digitv2-lightTheme-primary-2'] = headingOf(mix.heading);
  if (mix.background && mix.background !== id) vars['--digitv2-lightTheme-generic-background'] = backgroundOf(mix.background);
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
    applied.add(k);
  }
  root.style.setProperty('--c-font', byId(mix.font ?? id).font);
  applied.add('--c-font');
  const corners = mix.radius ?? CORNERS[mix.corners ?? id];
  root.dataset.theme = t.id;
  root.dataset.corners = corners;
  root.toggleAttribute('data-pill', corners === 'pill');
  if (persist) {
    localStorage.setItem(KEY, t.id);
    localStorage.setItem(MIX_KEY, JSON.stringify(mix));
  }
  window.dispatchEvent(new CustomEvent('digit-theme', { detail: t.id }));
}
