import { useEffect } from 'react';
import type { RefObject } from 'react';
import { Button } from '@egovernments/digit-ui-components';

type Props = {
  open: boolean;
  controls: string;
  onToggle: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
};

/** Library secondary Button that opens and closes the Help panel. */
export function HelpButton({ open, controls, onToggle, buttonRef }: Props) {
  // The library Button doesn't take ARIA props, so set them on its <button>.
  useEffect(() => {
    const b = buttonRef.current;
    if (!b) return;
    b.setAttribute('aria-expanded', String(open));
    b.setAttribute('aria-controls', controls);
  }, [open, controls, buttonRef]);

  return (
    <span className="ux-help-btn" data-tour="help">
      <Button
        ref={buttonRef}
        variation="secondary"
        size="medium"
        icon="HelpOutline"
        label="Help"
        onClick={onToggle}
      />
    </span>
  );
}
