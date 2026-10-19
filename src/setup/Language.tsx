import type { RefObject } from 'react';
import { Button, Dropdown } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { Backdrop } from './Backdrop';
import { LANGUAGES, type Answers } from './steps';

/**
 * Before the five steps: which language they're most comfortable with, from
 * a DIGIT dropdown. A single narrow card: no illustration, no stepper.
 */

const ENGLISH_NAME: Record<string, string> = { en: 'English', fr: 'French', pt: 'Portuguese', sw: 'Swahili' };
/** Dropdown options: the language's own name, then its English name. */
const OPTIONS = LANGUAGES.map((l) => ({
  code: l.value,
  name: ENGLISH_NAME[l.value] === l.label ? l.label : `${l.label} (${ENGLISH_NAME[l.value]})`,
}));

export function Language({
  a,
  headingRef,
  update,
  onBack,
  onNext,
}: {
  a: Answers;
  headingRef: RefObject<HTMLHeadingElement | null>;
  update: (p: Partial<Answers>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const chosen = a.language || 'en';
  return (
    <div className="sf su qz">
      <Backdrop />
      <header className="su-top">
        <img className="sf-logo" src="/digit-logo.png" alt="DIGIT" width={528} height={124} />
      </header>
      <main className="qz-main is-centred">
        <div className="qz-card is-single">
          <div className="qz-form">
            <div className="qz-top">
              <div className="qz-head">
                <button type="button" className="sf-back" onClick={onBack}>
                  <Icon name="ArrowBack" size={18} />
                  Back
                </button>
              </div>
            </div>
            <h1 ref={headingRef} tabIndex={-1}>
              Select your language
            </h1>
            <p className="qz-lead">Choose the language you’re comfortable with, and we’ll use it with you from now on.</p>
            <form
              className="qz-fields"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                onNext();
              }}
            >
              {/* DIGIT dropdown; each language named in its own language, with English after */}
              <div className="su-field qz-field lg-field">
                <label id="lg-label">Language</label>
                <div aria-labelledby="lg-label">
                  <Dropdown
                    option={OPTIONS}
                    optionKey="name"
                    selected={OPTIONS.find((o) => o.code === chosen)}
                    select={(o: { code: string }) => update({ language: o.code })}
                    isSearchable={false}
                    ariaLabel="Language"
                    t={(x: string) => x}
                  />
                </div>
              </div>
              <div className="qz-actions">
                <Button variation="primary" label="Continue" submit onClick={() => {}} />
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
