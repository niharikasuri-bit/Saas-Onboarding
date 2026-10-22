import { Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

/**
 * A single-choice dropdown that looks like the product-access multi-select (button with a caret, list panel),
 * without checkboxes. A drop-in for <select>: takes <option> children, and onChange gets { target: { value } }
 * so existing handlers keep working.
 *
 * Keyboard follows the select-only combobox pattern: Up/Down open and move, Enter/Space choose, Home/End jump,
 * typing a letter jumps to the next match, Escape closes, Tab chooses and moves on. Focus stays on the button.
 */
type Opt = { value: string; label: string; disabled?: boolean };

const text = (n: ReactNode): string =>
  Children.toArray(n)
    .map((c) => (typeof c === 'string' || typeof c === 'number' ? String(c) : isValidElement<{ children?: ReactNode }>(c) ? text(c.props.children) : ''))
    .join('');

/** <option>s, also inside fragments, maps and conditionals. */
const readOptions = (children: ReactNode): Opt[] =>
  Children.toArray(children).flatMap((c) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(c)) return [];
    if (c.type === 'option') {
      const label = text(c.props.children);
      return [{ value: c.props.value !== undefined ? String(c.props.value) : label, label, disabled: c.props.disabled }];
    }
    return readOptions(c.props.children);
  });

export function Select({
  id,
  onChange,
  children,
  className,
  disabled,
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  value: raw,
}: {
  id?: string;
  value: string | number;
  onChange: (e: { target: { value: string } }) => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
}) {
  const value = String(raw);
  const auto = useId();
  const bid = id ?? `${auto}-btn`;
  const lid = `${bid}-list`;
  const options = readOptions(children);
  const chosen = options.find((o) => o.value === value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<{ left: number; top: number; width: number; up: boolean } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ s: '', t: 0 });

  const enabled = (i: number) => i >= 0 && i < options.length && !options[i].disabled;
  const step = (from: number, d: 1 | -1) => {
    for (let i = from + d; i >= 0 && i < options.length; i += d) if (enabled(i)) return i;
    return from;
  };
  const show = () => {
    const i = options.findIndex((o) => o.value === value);
    setActive(enabled(i) ? i : step(-1, 1));
    setOpen(true);
  };
  const choose = (i: number) => {
    if (enabled(i) && options[i].value !== value) onChange({ target: { value: options[i].value } });
    setOpen(false);
  };

  // The panel is fixed to the viewport (so table cells and scroll boxes don't clip it), above the button if
  // there's no room below. It closes on scroll or resize rather than drifting.
  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const h = Math.min(320, options.length * 44 + 14);
    const up = r.bottom + h + 8 > window.innerHeight && r.top > h + 8;
    setPos({ left: r.left, top: up ? r.top - 4 : r.bottom + 4, width: Math.max(r.width, 160), up });
  }, [open, options.length]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !btn.current?.contains(e.target as Node) && !list.current?.contains(e.target as Node) && setOpen(false);
    const close = (e: Event) => !list.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', away);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', away);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);
  useEffect(() => {
    if (open && active >= 0) list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(k)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (k === 'ArrowDown') (e.preventDefault(), setActive((a) => step(a, 1)));
    else if (k === 'ArrowUp') (e.preventDefault(), setActive((a) => step(a, -1)));
    else if (k === 'Home') (e.preventDefault(), setActive(step(-1, 1)));
    else if (k === 'End') (e.preventDefault(), setActive(step(options.length, -1)));
    else if (k === 'Enter' || k === ' ') (e.preventDefault(), choose(active));
    else if (k === 'Escape') (e.preventDefault(), e.stopPropagation(), setOpen(false));
    else if (k === 'Tab') choose(active);
    else if (k.length === 1 && /\S/.test(k)) {
      const now = Date.now();
      typed.current = { s: (now - typed.current.t < 600 ? typed.current.s : '') + k.toLowerCase(), t: now };
      const q = typed.current.s;
      const n = options.length;
      for (let j = 1; j <= n; j++) {
        const i = (active + (q.length > 1 ? 0 : 1) + j - 1 + n) % n;
        if (enabled(i) && options[i].label.trim().toLowerCase().startsWith(q)) return setActive(i);
      }
    }
  };

  return (
    <div className={`msel ss${className ? ` ${className}` : ''}${invalid === true || invalid === 'true' ? ' has-error' : ''}`}>
      <button
        ref={btn}
        id={bid}
        type="button"
        role="combobox"
        className="msel-btn"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={lid}
        aria-activedescendant={open && active >= 0 ? `${lid}-${active}` : undefined}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
      >
        <span className={chosen && chosen.value !== '' ? '' : 'msel-placeholder'}>{chosen?.label.trim() || options[0]?.label.trim() || ''}</span>
        <Icon name={open ? 'ArrowDropUp' : 'ArrowDropDown'} size={22} />
      </button>
      {open &&
        pos &&
        createPortal(
          <ul
            ref={list}
            id={lid}
            role="listbox"
            aria-labelledby={bid}
            className={`msel-panel ss-panel${pos.up ? ' is-up' : ''}`}
            style={{ left: pos.left, top: pos.top, width: pos.width }}
          >
            {options.map((o, i) => (
              <li
                key={`${o.value}-${i}`}
                id={`${lid}-${i}`}
                data-i={i}
                role="option"
                aria-selected={o.value === value}
                aria-disabled={o.disabled || undefined}
                className={`msel-opt ss-opt${i === active ? ' is-active' : ''}${o.value === value ? ' is-on' : ''}${o.disabled ? ' is-disabled' : ''}`}
                onMouseEnter={() => enabled(i) && setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
              >
                {o.label}
              </li>
            ))}
          </ul>,
          // Inside a modal dialog, the rest of the page is inert, so the list has to live in the dialog
          btn.current?.closest('dialog') ?? document.body,
        )}
    </div>
  );
}
