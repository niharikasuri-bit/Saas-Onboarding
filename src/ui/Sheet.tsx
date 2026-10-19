import { Icon } from '../components/Icon';

/** Shared pieces for every bulk upload: the three-step guide, and the spreadsheet look. */

/** "How to proceed with upload?": download, fill in, upload and check. `thing` is one row's noun. */
export function UploadSteps({ thing }: { thing: string }) {
  const steps: [string, string, React.ReactNode][] = [
    [
      'FileDownload',
      'Download the template',
      <>
        Select <strong>Download template</strong> to get a file with the right columns.
      </>,
    ],
    [
      'Edit',
      'Fill it in',
      <>
        Add one row per {thing} in Excel or any spreadsheet. Keep the column headers and the <strong>.csv</strong> format.
      </>,
    ],
    [
      'FileUpload',
      'Upload and check',
      <>
        Drop the file below. You’ll see every row and can fix anything before you <strong>save</strong>.
      </>,
    ],
  ];
  return (
    <section className="us" aria-labelledby="us-h">
      <h2 id="us-h">How to proceed with upload?</h2>
      <ol className="us-list">
        {steps.map(([icon, title, text], i) => (
          <li key={title} className="us-step">
            <span className="us-icon" aria-hidden="true">
              <Icon name={icon} size={20} />
            </span>
            <span className="us-text">
              <strong className="us-title">
                <span className="ux-visually-hidden">Step {i + 1}: </span>
                {title}
              </strong>
              <span>{text}</span>
            </span>
            {i < steps.length - 1 && (
              <span className="us-arrow" aria-hidden="true">
                <Icon name="ArrowForward" size={16} />
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Above an editable sheet: what you can do here, and what the column colours mean. */
export function SheetIntro() {
  return (
    <div className="sh-intro">
      <p className="sh-note">
        <Icon name="Edit" size={18} />
        <span>
          <strong>Editable</strong>
          <span>Click any cell to change it. Nothing is saved until you finish.</span>
        </span>
      </p>
      <ul className="sh-legend" aria-label="Column key">
        <li>
          <span className="sh-key is-req" aria-hidden="true" />
          Required
        </li>
        <li>
          <span className="sh-key is-opt" aria-hidden="true" />
          Optional
        </li>
      </ul>
    </div>
  );
}

/** Spreadsheet column letters: A, B, … Z, AA, AB … */
export const colLetter = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : colLetter(Math.floor(i / 26) - 1) + colLetter(i % 26));
