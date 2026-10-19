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

/** A note above a table or tree: an icon, a short title, one line of help. Light blue, or `grey` (#FAFAFA). */
export function InfoNote({ icon, title, grey, children }: { icon: string; title: string; grey?: boolean; children: React.ReactNode }) {
  return (
    <div className="sh-intro">
      <p className={`sh-note${grey ? ' is-grey' : ''}`}>
        <Icon name={icon} size={18} />
        <span>
          <strong>{title}</strong>
          <span>{children}</span>
        </span>
      </p>
    </div>
  );
}

/**
 * Above an editable sheet or tree: what you can do here. `action` is the button that
 * saves it; `tree` words it for the tree view.
 */
export function SheetIntro({ action, tree }: { action: string; tree?: boolean }) {
  return (
    <InfoNote icon="Edit" title={tree ? 'Editable tree' : 'Editable table'}>
      {tree ? 'Click any geography to edit it.' : 'Click any cell to edit it.'} Your edits are not saved until you click {action}.
    </InfoNote>
  );
}

/** Spreadsheet column letters: A, B, … Z, AA, AB … */
export const colLetter = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : colLetter(Math.floor(i / 26) - 1) + colLetter(i % 26));
