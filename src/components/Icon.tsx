import { SVG } from '@egovernments/digit-ui-components';
import type { ReactElement } from 'react';

type IconComponent = (p: { width?: number; height?: number; fill?: string }) => ReactElement;

/**
 * Library icons, always decorative: every control using one also has a text
 * label, so the glyph is hidden from assistive tech rather than read twice.
 */
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  // The library's icon set has no keyboard glyph.
  if (name === 'Keyboard') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-9 3h2v2h-2V8Zm0 3h2v2h-2v-2ZM8 8h2v2H8V8Zm0 3h2v2H8v-2Zm-1 2H5v-2h2v2Zm0-3H5V8h2v2Zm9 7H8v-2h8v2Zm0-4h-2v-2h2v2Zm0-3h-2V8h2v2Zm3 3h-2v-2h2v2Zm0-3h-2V8h2v2Z" />
        </svg>
      </span>
    );
  }
  // A filled WhatsApp mark, to match the solid Email and SMS glyphs.
  if (name === 'WhatsAppFilled') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15L2 22l5.2-1.4A9.9 9.9 0 1 0 12.04 2Zm5.8 14.1c-.25.7-1.45 1.35-2 1.4-.5.05-1 .25-3.4-.7-2.9-1.15-4.7-4.1-4.85-4.3-.15-.2-1.15-1.55-1.15-2.95s.75-2.1 1-2.4c.25-.3.55-.35.75-.35h.55c.15 0 .4-.05.6.45l.85 2.05c.05.15.1.35 0 .55-.1.2-.15.35-.3.5l-.45.55c-.15.15-.3.3-.15.6.2.3.8 1.3 1.7 2.1 1.15 1 2.15 1.35 2.45 1.5.3.15.5.1.65-.05l.95-1.15c.2-.3.4-.25.65-.15l2 .95c.3.15.5.2.55.35.1.1.1.65-.15 1.35Z" />
        </svg>
      </span>
    );
  }
  // An outlined info glyph (the library's Info is filled), for tooltips next to field titles.
  if (name === 'InfoOutline') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <circle cx="12" cy="7.8" r="0.6" fill="currentColor" />
        </svg>
      </span>
    );
  }
  // Up and down chevrons, for moving items in a list.
  if (name === 'MoveUp' || name === 'MoveDown') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d={name === 'MoveUp' ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
        </svg>
      </span>
    );
  }
  // Sliders, for Customize home.
  if (name === 'Tune') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="10" cy="17" r="2" />
        </svg>
      </span>
    );
  }
  // A filled clock, to sit with the library's filled icons (its Schedule clock is an outline).
  if (name === 'ClockFilled') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm.9 5v4.6l3.8 2.3-.9 1.5-4.7-2.8V7h1.8Z" />
        </svg>
      </span>
    );
  }
  // A revert arrow (restart), the same as the side nav's Restart.
  if (name === 'Revert') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  // A play button (Videos) and a question in a bubble (FAQ), for the Help panel.
  if (name === 'PlayVideo') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M10 9.5v5l4.5-2.5z" fill="currentColor" />
        </svg>
      </span>
    );
  }
  if (name === 'Faq') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          <path d="M9.8 8.6a2.3 2.3 0 0 1 4.4.9c0 1.5-2.2 1.7-2.2 3" />
          <circle cx="12" cy="14.6" r="0.4" fill="currentColor" />
        </svg>
      </span>
    );
  }
  // Nor a sparkle (AI translation).
  if (name === 'AutoAwesome') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 3l1.8 4.9L16.7 9.7l-4.9 1.8L10 16.4l-1.8-4.9L3.3 9.7l4.9-1.8L10 3Zm8 9l.9 2.3 2.3.9-2.3.9L18 18.4l-.9-2.3-2.3-.9 2.3-.9L18 12Zm-1.5-9l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
        </svg>
      </span>
    );
  }
  // Nor a lightning bolt (Quick actions).
  if (name === 'Bolt') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M13 6.5 8.5 13h3.5l-1 4.5 4.5-6.5H12l1-4.5Z" fill="currentColor" stroke="none" />
        </svg>
      </span>
    );
  }
  // Nor a type glyph: "Aa" for typography.
  if (name === 'Typography') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.6 5h2l4.6 13h-2.2l-1.1-3.2H5.6L4.5 18H2.3L7.6 5Zm-1.4 8h4.2L8.6 7.6 6.2 13Zm12.3-4.2c2.1 0 3.4 1.1 3.4 3.1V18h-1.9l-.1-1.1c-.6.8-1.6 1.3-2.8 1.3-1.8 0-3-1-3-2.6 0-1.8 1.5-2.8 4-2.8h1.7v-.6c0-1-.6-1.6-1.6-1.6-.9 0-1.6.4-1.8 1.2l-1.8-.4c.4-1.6 1.9-2.6 3.9-2.6Zm1.4 5.3h-1.6c-1.4 0-2.1.5-2.1 1.3 0 .7.5 1.1 1.4 1.1 1.3 0 2.3-.8 2.3-2.1v-.3Z" />
        </svg>
      </span>
    );
  }
  // Nor a plus in a circle.
  if (name === 'AddCircle') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2Z" />
        </svg>
      </span>
    );
  }
  // Nor a plain plus.
  if (name === 'Add') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z" />
        </svg>
      </span>
    );
  }
  // Nor a plus in a box.
  if (name === 'AddBox') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2Z" />
        </svg>
      </span>
    );
  }
  // Nor a tree.
  if (name === 'AccountTree') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7Z" />
        </svg>
      </span>
    );
  }
  // Nor a play button.
  if (name === 'PlayCircle') {
    return (
      <span className="ux-icon" aria-hidden="true">
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-2 14.5v-9l6 4.5-6 4.5Z" />
        </svg>
      </span>
    );
  }
  const Glyph = (SVG as Record<string, IconComponent | undefined>)[name];
  if (!Glyph) return null;
  return (
    <span className="ux-icon" aria-hidden="true">
      <Glyph width={size} height={size} fill="currentColor" />
    </span>
  );
}
