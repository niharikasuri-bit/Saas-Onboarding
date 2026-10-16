import type { ReactNode } from 'react';

/** A plain page: heading, one-line lead, content. */
export function Page({ title, lead, children }: { title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className="sf2">
      <h1 tabIndex={-1}>{title}</h1>
      {lead && <p className="sf2-lead">{lead}</p>}
      {children}
    </div>
  );
}

export const STATE_TONE: Record<string, string> = {
  locked: 'is-locked',
  'not-started': 'is-not-started',
  'in-progress': 'is-in-progress',
  done: 'is-completed',
};

/** A labelled field with optional hint and error, in GOV.UK order. */
export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`fld${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {optional && <span className="fld-opt"> (optional)</span>}
      </label>
      {hint && (
        <p className="fld-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="fld-error" id={`${id}-err`}>
          <span className="ux-visually-hidden">Error: </span>
          {error}
        </p>
      )}
      {children}
    </div>
  );
}

export const describedBy = (id: string, hint?: string, error?: string) =>
  [error ? `${id}-err` : '', hint ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined;
