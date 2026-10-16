/**
 * Ergonomic accessors for the published `--digitv2-*` custom properties.
 * Custom UI references these — never a raw hex or px value.
 */
export const color = {
  primary: 'var(--digitv2-lightTheme-primary-1)', // #c84c0e
  secondary: 'var(--digitv2-lightTheme-primary-2)', // #0b4b66
  primaryBg: 'var(--digitv2-lightTheme-primary-bg)', // #fbeee8
  surface: 'var(--digitv2-lightTheme-paper-primary)', // #ffffff
  surfaceMuted: 'var(--digitv2-lightTheme-paper-secondary)', // #fafafa
  appBg: 'var(--digitv2-lightTheme-generic-background)', // #eeeeee
  divider: 'var(--digitv2-lightTheme-generic-divider)', // #d6d5d4
  inputBorder: 'var(--digitv2-lightTheme-generic-inputborder)', // #505a5f
  textPrimary: 'var(--digitv2-lightTheme-text-primary)', // #363636
  textSecondary: 'var(--digitv2-lightTheme-text-secondary)', // #787878 — see note
  textDisabled: 'var(--digitv2-lightTheme-text-disabled)',
  error: 'var(--digitv2-lightTheme-alert-error)',
  errorBg: 'var(--digitv2-lightTheme-alert-errorbg)',
  success: 'var(--digitv2-lightTheme-alert-success)',
  successBg: 'var(--digitv2-lightTheme-alert-successbg)',
  warning: 'var(--digitv2-lightTheme-alert-warning)',
  warningBg: 'var(--digitv2-lightTheme-alert-warning-bg)',
  info: 'var(--digitv2-lightTheme-alert-info)',
  infoBg: 'var(--digitv2-lightTheme-alert-infobg)',
} as const;

/**
 * NOTE on `textSecondary` (#787878): on white it measures 4.41:1, just under the
 * 4.5:1 that WCAG 1.4.3 requires for normal-size text. It is only used here at
 * >=24px, or >=18.66px bold, where the 3:1 large-text threshold applies.
 * Small helper copy uses `textPrimary` instead.
 */

export const spacer = (n: number) => `var(--digitv2-spacers-spacer${n})`;
export const radius = (n: number) => `var(--digitv2-borderRadius-radius${n})`;
