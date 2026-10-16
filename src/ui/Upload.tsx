import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@egovernments/digit-ui-components';
import { Icon } from '../components/Icon';
import { useAccount } from '../lib/store';
import { download, parseCsv, toCsv } from '../lib/csv';
import { IMPORTERS, retryRow, runImport, type ImportKind } from '../lib/importers';
import type { Account } from '../lib/model';

/** Sample file with the account's real names, plus its instructions. */
export function downloadSample(kind: ImportKind, a: Account) {
  const imp = IMPORTERS[kind];
  download(`${imp.noun}-sample.csv`, toCsv(imp.cols, imp.sample(a)));
  download(
    `${imp.noun}-instructions.txt`,
    [`How to fill in the ${imp.noun} file`, '', ...imp.instructions(a).map((l) => `• ${l}`)].join('\n'),
  );
}

/**
 * The three proven ways in: upload a file, add manually, or download a
 * sample file to fill in.
 */
export function EntryChoice({
  kind,
  noun,
  manual,
  extra,
}: {
  kind: ImportKind;
  noun: string;
  manual: ReactNode;
  /** Another source, such as fetching from OpenStreetMap. */
  extra?: { label: string; icon: string; panel: ReactNode };
}) {
  const { account } = useAccount();
  const [mode, setMode] = useState<'upload' | 'manual' | 'extra' | ''>('');
  const [got, setGot] = useState(false);

  return (
    <section className="ec" aria-label={`Add ${noun}`}>
      <div className="ec-bar">
        {kind === 'areas' ? (
          <>
        <button
          type="button"
          className="ec-btn"
          aria-pressed={mode === 'manual'}
          onClick={() => setMode(mode === 'manual' ? '' : 'manual')}
        >
          <Icon name="Add" size={20} />
          Add manually
        </button>
        <button
          type="button"
          className="ec-btn"
          aria-pressed={mode === 'upload'}
          onClick={() => setMode(mode === 'upload' ? '' : 'upload')}
        >
          <Icon name="CloudUpload" size={20} />
          Upload file
        </button>
          </>
        ) : (
          <>
        <button
          type="button"
          className="ec-btn"
          aria-pressed={mode === 'upload'}
          onClick={() => setMode(mode === 'upload' ? '' : 'upload')}
        >
          <Icon name="CloudUpload" size={20} />
          Upload file
        </button>
        <button
          type="button"
          className="ec-btn"
          aria-pressed={mode === 'manual'}
          onClick={() => setMode(mode === 'manual' ? '' : 'manual')}
        >
          <Icon name="Add" size={20} />
          Add manually
        </button>
          </>
        )}
        {extra && (
          <button
            type="button"
            className="ec-btn"
            aria-pressed={mode === 'extra'}
            onClick={() => setMode(mode === 'extra' ? '' : 'extra')}
          >
            <Icon name={extra.icon} size={20} />
            {extra.label}
          </button>
        )}
        <button
          type="button"
          className="ec-btn"
          onClick={() => {
            downloadSample(kind, account);
            setGot(true);
          }}
        >
          <Icon name="FileDownload" size={20} />
          Download sample file
        </button>
      </div>
      {got && (
        <p className="form-note" role="status">
          Sample file and instructions downloaded. They use your real names. Fill it in, then upload it.
        </p>
      )}
      {mode === 'upload' && <UploadPanel kind={kind} />}
      {mode === 'manual' && <div className="ec-panel">{manual}</div>}
      {mode === 'extra' && extra && <div className="ec-panel">{extra.panel}</div>}
    </section>
  );
}

type Result = { added: number; skipped: number; bad: number };

/**
 * Every row is checked first; valid rows import, bad rows wait below to be
 * fixed. Uploads add to what's there and never replace it.
 */
function UploadPanel({ kind }: { kind: ImportKind }) {
  const { update } = useAccount();
  const uid = useId();
  const imp = IMPORTERS[kind];
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);

  const load = (rows: Record<string, string>[]) => {
    const missing = imp.cols.filter((c) => !(c in (rows[0] ?? {})));
    if (!rows.length) return setError('That file has no rows.');
    if (missing.length && !(kind === 'areas' && missing.every((m) => m === 'parent')))
      return setError(`The file needs these columns: ${imp.cols.join(', ')}. Missing: ${missing.join(', ')}.`);
    setError('');
    let r: Result = { added: 0, skipped: 0, bad: 0 };
    update((a) => {
      const res = runImport(a, kind, rows);
      r = { added: res.added, skipped: res.skipped, bad: res.bad };
      return res.account;
    });
    setTimeout(() => setResult(r), 0);
  };

  const read = (f?: File) => {
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) return setError('Choose a CSV file. Excel can save as CSV.');
    f.text().then((t) => load(parseCsv(t)));
  };

  return (
    <div className="ec-panel">
      <p className="card-lead">Columns: {imp.cols.join(', ')}. Every row is checked before anything is imported.</p>
      <label
        className={`drop${over ? ' is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          read(e.dataTransfer.files[0]);
        }}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          aria-describedby={error ? `${uid}-err` : undefined}
          onChange={(e) => {
            read(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <span className="drop-icon" aria-hidden="true">
          <Icon name="CloudUpload" size={24} />
        </span>
        <span>
          <strong>Choose a CSV file</strong> or drag it here
          <span className="drop-sub">Adds to what you have. Nothing is replaced.</span>
        </span>
      </label>
      {error && (
        <p className="fld-error" id={`${uid}-err`} role="alert">
          {error}
        </p>
      )}
      {result && (
        <p className={`up-result${result.bad ? ' has-bad' : ''}`} role="status">
          <Icon name={result.bad ? 'Info' : 'CheckCircle'} size={18} />
          <span>
            <strong>{result.added.toLocaleString('en')} imported.</strong>
            {result.skipped > 0 && ` ${result.skipped} already there, skipped.`}
            {result.bad > 0 && ` ${result.bad} need fixing below. The rest are already in.`}
          </span>
        </p>
      )}
    </div>
  );
}

/** Rows that didn't pass, each with its reason and a fix right there. */
export function PendingFixes({ kind }: { kind: ImportKind }) {
  const { account, update } = useAccount();
  const uid = useId();
  const imp = IMPORTERS[kind];
  const meta = account.items[kind];
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});
  const [msg, setMsg] = useState('');

  if (!meta.pending.length) return null;

  const retry = (rowId: string, values: Record<string, string>) => {
    let ok = false;
    update((a) => {
      const r = retryRow(a, kind, rowId, values);
      ok = r.ok;
      return r.account;
    });
    setTimeout(() => setMsg(ok ? 'Fixed and imported.' : 'Still not right. See the reason.'), 0);
  };

  return (
    <section className="card fx" aria-labelledby={`${uid}-h`}>
      <div className="card-head">
        <div>
          <h3 id={`${uid}-h`} className="sm-h3">
            {meta.pending.length} {meta.pending.length === 1 ? 'row needs' : 'rows need'} fixing
          </h3>
          <p className="card-lead">
            Everything else is already imported. Fix these here, or download them, fix the file and
            upload it again.
          </p>
        </div>
        <Button
          variation="secondary"
          icon="FileDownload"
          label="Download Error File"
          onClick={() =>
            download(
              `${imp.noun}-errors.csv`,
              toCsv(
                [...imp.cols, 'what to fix'],
                meta.pending.map((p) => ({ ...p.values, 'what to fix': p.errors.map((e) => e.message).join('; ') })),
              ),
            )
          }
        />
      </div>
      <p className="ux-visually-hidden" role="status">
        {msg}
      </p>
      <ul className="fx-list">
        {meta.pending.map((p) => {
          const v = { ...p.values, ...(edits[p.id] ?? {}) };
          return (
            <li key={p.id} className="fx-row">
              <p className="fx-what">
                {imp.cols
                  .map((c) => p.values[c])
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {p.errors.map((e) => (
                <div key={e.col} className="fx-err">
                  <p>
                    <Icon name="Info" size={16} />
                    {e.message}
                  </p>
                  {e.suggestion ? (
                    <Button
                      variation="secondary"
                      size="small"
                      label={`Use ${e.suggestion}`}
                      onClick={() => retry(p.id, { ...v, [e.col]: e.suggestion! })}
                    />
                  ) : (
                    <span className="fx-edit">
                      <label className="ux-visually-hidden" htmlFor={`${uid}-${p.id}-${e.col}`}>
                        {e.col} for {p.values[imp.cols[0]] || 'this row'}
                      </label>
                      <input
                        id={`${uid}-${p.id}-${e.col}`}
                        value={v[e.col] ?? ''}
                        placeholder={e.col}
                        onChange={(ev) =>
                          setEdits({ ...edits, [p.id]: { ...(edits[p.id] ?? {}), [e.col]: ev.target.value } })
                        }
                      />
                      <Button variation="secondary" size="small" label="Recheck" onClick={() => retry(p.id, v)} />
                    </span>
                  )}
                </div>
              ))}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
