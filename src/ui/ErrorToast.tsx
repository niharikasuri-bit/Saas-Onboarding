import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../components/Icon';

/**
 * Errors that don't belong to one input field (a file that can't be read, rows with gaps,
 * nothing uploaded yet) show as a red toast. Errors for a field stay under that field.
 *
 * showError(message) from anywhere; <ErrorToastHost /> is mounted once in the app.
 */
export function showError(message: string) {
  window.dispatchEvent(new CustomEvent<string>('ux-error', { detail: message }));
}

export function ErrorToastHost() {
  const [msg, setMsg] = useState<{ text: string; n: number; at: Element | null }>({ text: '', n: 0, at: null });
  useEffect(() => {
    const on = (e: Event) => {
      // Inside an open popup, the toast goes in it: everything outside a modal popup is inert
      const open = document.querySelectorAll('dialog[open]');
      setMsg((m) => ({ text: (e as CustomEvent<string>).detail, n: m.n + 1, at: open[open.length - 1] ?? null }));
    };
    window.addEventListener('ux-error', on);
    return () => window.removeEventListener('ux-error', on);
  }, []);
  useEffect(() => {
    if (!msg.text) return;
    const t = setTimeout(() => setMsg((m) => ({ ...m, text: '' })), 6000);
    return () => clearTimeout(t);
  }, [msg.n, msg.text]);
  const toast = (
    <div className="err-toast-host" role="alert">
      {msg.text && (
        <div className="err-toast" key={msg.n}>
          <Icon name="ErrorOutline" size={22} />
          <span className="err-toast-text">
            <span className="ux-visually-hidden">Error: </span>
            {msg.text}
          </span>
          <button type="button" className="err-toast-x" aria-label="Dismiss error" onClick={() => setMsg((m) => ({ ...m, text: '' }))}>
            <Icon name="Close" size={20} />
          </button>
        </div>
      )}
    </div>
  );
  return msg.at && msg.at.isConnected ? createPortal(toast, msg.at) : toast;
}
