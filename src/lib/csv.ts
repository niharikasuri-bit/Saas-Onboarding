/** Tiny CSV helpers: enough for sample files, uploads and error files. */

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const clean = rows.filter((r) => r.some((x) => x.trim()));
  if (!clean.length) return [];
  const head = clean[0].map((h) => h.trim().toLowerCase());
  return clean.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function toCsv(cols: string[], rows: Record<string, string>[]) {
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c] ?? '')).join(','))].join('\n');
}

export function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function distance(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return d[m][n];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Exact match ignoring case and spacing, or ''. */
export function findName(name: string, candidates: string[]) {
  const k = norm(name);
  return candidates.find((c) => norm(c) === k) ?? '';
}

/** The closest candidate if it's close enough to be a typo, else ''. */
export function didYouMean(name: string, candidates: string[]) {
  const k = norm(name);
  if (!k) return '';
  let best = '';
  let score = Infinity;
  for (const c of candidates) {
    const n = norm(c);
    const d = n.startsWith(k) || k.startsWith(n) ? Math.abs(n.length - k.length) * 0.5 : distance(k, n);
    if (d < score) {
      score = d;
      best = c;
    }
  }
  return score <= Math.max(2, Math.floor(k.length / 4)) ? best : '';
}
