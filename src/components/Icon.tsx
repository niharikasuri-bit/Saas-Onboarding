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
