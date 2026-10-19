import { useState } from 'react';
import { DOMAIN, accountSub, checkSub } from './link';
import type { Answers } from './steps';

/**
 * The sign-in link, set on the account step in its own #FAFAFA container.
 * It's suggested from the account name and follows it until someone edits it; ".digit.org"
 * stays fixed. Only invited people can sign in there.
 */
export function AccountLink({
  a,
  update,
  check,
}: {
  a: Answers;
  update: (p: Partial<Answers>) => void;
  check: boolean;
}) {
  const sub = accountSub(a);
  const [touched, setTouched] = useState(false);
  const error = touched || check ? checkSub(sub) : '';

  return (
    <div className={`su-field qz-field al${error ? ' has-error' : ''}`}>
      <label htmlFor="al-input">Account link</label>
      <div className="al-field">
        <input
          id="al-input"
          className="al-input"
          value={sub}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={`al-help${error ? ' al-err' : ''}`}
          onChange={(e) => update({ link: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
          onBlur={() => setTouched(true)}
        />
        <span className="al-domain" aria-hidden="true">
          .{DOMAIN}
        </span>
      </div>
      {error && (
        <p className="sf-error" id="al-err">
          <span className="ux-visually-hidden">Error: </span>
          {error}
        </p>
      )}
      <p className="qz-help" id="al-help">
        We’ve suggested one from your account name. You can change it. Only people you invite can sign in here.
      </p>
    </div>
  );
}
