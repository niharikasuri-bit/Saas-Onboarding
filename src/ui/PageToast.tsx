import { useEffect, useState } from 'react';
import { Toast } from '@egovernments/digit-ui-components';

/**
 * A success toast for a page: show(message) puts it up for five seconds.
 * It lives in a polite live region, so screen readers hear it too.
 */
export function usePageToast(initial = '') {
  const [text, setText] = useState(initial);
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => setText(''), 5000);
    return () => clearTimeout(t);
  }, [text]);
  const el = (
    <div className="cg-toast" role="status" aria-live="polite">
      {text && <Toast type="success" label={text} onClose={() => setText('')} />}
    </div>
  );
  return [el, setText] as const;
}
