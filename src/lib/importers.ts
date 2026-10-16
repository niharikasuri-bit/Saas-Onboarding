/**
 * Bulk upload rules, the same for every data-heavy item:
 * sample files use the account's real names; every row is validated before
 * import; valid rows import, bad rows wait with row-level errors; uploads
 * merge with existing data and never replace it.
 */
import { didYouMean, findName } from './csv';
import {
  LEVELS,
  REFERENCE_AREAS,
  activeService,
  newId,
  typeById,
  type Account,
  type PendingRow,
  type RowError,
} from './model';

export type ImportKind = 'departments' | 'users' | 'areas';

export type Importer = {
  noun: string;
  cols: string[];
  /** Plain instructions that travel with the sample file. */
  instructions: (a: Account) => string[];
  sample: (a: Account) => Record<string, string>[];
  /** Validate one row against what exists plus the rest of the file. */
  check: (row: Record<string, string>, a: Account, file: Record<string, string>[]) => RowError[];
  /** Merge valid rows in. Returns the new account and how many were new. */
  apply: (a: Account, rows: Record<string, string>[]) => { account: Account; added: number };
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------------- Departments ---------------- */

const departments: Importer = {
  noun: 'departments',
  cols: ['department', 'parent'],
  instructions: (a) => [
    'One department per row. Leave “parent” empty for your top department.',
    'The parent must be another department in this file or one you already have.',
    a.departments.length
      ? `You already have: ${a.departments.map((d) => d.name).join(', ')}.`
      : 'You have no departments yet.',
  ],
  sample: (a) => {
    const s = activeService(a);
    const groups = [...new Set((s?.types ?? []).map((t) => typeById(t)?.group ?? ''))].filter(Boolean);
    const top = a.departments.find((d) => !d.parentId)?.name ?? 'City Services';
    return [
      ...(a.departments.length ? [] : [{ department: top, parent: '' }]),
      ...groups.map((g) => ({ department: g, parent: top })),
    ];
  },
  check: (row, a, file) => {
    const errs: RowError[] = [];
    if (!row.department) errs.push({ col: 'department', message: 'Department name is empty' });
    if (row.parent) {
      const known = [...a.departments.map((d) => d.name), ...file.map((r) => r.department).filter(Boolean)];
      if (!findName(row.parent, known)) {
        const s = didYouMean(row.parent, known);
        errs.push({
          col: 'parent',
          message: s ? `No department called “${row.parent}”. Did you mean ${s}?` : `No department called “${row.parent}”`,
          suggestion: s || undefined,
        });
      }
    }
    return errs;
  },
  apply: (a, rows) => {
    const depts = a.departments.map((d) => ({ ...d }));
    let added = 0;
    for (const r of rows) {
      if (findName(r.department, depts.map((d) => d.name))) continue;
      depts.push({ id: newId(), name: r.department, parentId: null });
      added++;
    }
    for (const r of rows) {
      if (!r.parent) continue;
      const me = depts.find((d) => d.name.toLowerCase() === r.department.toLowerCase());
      const p = findName(r.parent, depts.map((d) => d.name));
      const parent = depts.find((d) => d.name === p);
      if (me && parent && !me.parentId) me.parentId = parent.id;
    }
    return { account: { ...a, departments: depts }, added };
  },
};

/* ---------------- Geography ---------------- */

/** Add an area (and any reference ancestors it needs). */
export function addArea(a: Account, name: string, parentName: string): Account {
  const areas = [...a.geography.areas];
  const ensure = (n: string): string | null => {
    if (!n) return null;
    const have = areas.find((x) => x.name.toLowerCase() === n.toLowerCase());
    if (have) return have.id;
    const ref = REFERENCE_AREAS.find((x) => x.name.toLowerCase() === n.toLowerCase());
    if (!ref) return null;
    const pid = ensure(ref.parent);
    const parent = areas.find((x) => x.id === pid);
    const id = newId();
    areas.push({ id, name: ref.name, parentId: pid, level: parent ? parent.level + 1 : 0 });
    return id;
  };
  const pid = parentName ? ensure(parentName) : null;
  const parent = areas.find((x) => x.id === pid);
  const exists = areas.find(
    (x) => x.name.toLowerCase() === name.toLowerCase() && x.parentId === (pid ?? null),
  );
  if (!exists) {
    const ref = REFERENCE_AREAS.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (ref && !parentName) ensure(ref.name);
    else areas.push({ id: newId(), name, parentId: pid, level: parent ? parent.level + 1 : 0 });
  }
  return { ...a, geography: { areas } };
}

/* ---------------- Users ---------------- */

const users: Importer = {
  noun: 'users',
  cols: ['name', 'email'],
  instructions: (a) => [
    'One person per row: their name and work email.',
    'They get an invitation by email. You assign them inside each product.',
    a.users.length ? `Already invited: ${a.users.length}.` : 'Nobody is invited yet.',
  ],
  sample: () => [
    { name: 'John Otieno', email: 'john.otieno@nairobi.go.ke' },
    { name: 'Mary Chebet', email: 'mary.chebet@nairobi.go.ke' },
    { name: 'Peter Njoroge', email: 'peter.njoroge@nairobi.go.ke' },
  ],
  check: (row, a, file) => {
    const errs: RowError[] = [];
    if (!row.name) errs.push({ col: 'name', message: 'Name is empty' });
    const e = (row.email ?? '').toLowerCase();
    if (!EMAIL.test(e)) errs.push({ col: 'email', message: 'Not a valid email address' });
    else if (
      e === a.admin.email.toLowerCase() ||
      a.users.some((u) => u.email.toLowerCase() === e) ||
      file.filter((r) => r.email?.toLowerCase() === e).length > 1
    )
      errs.push({ col: 'email', message: 'This email is already used' });
    return errs;
  },
  apply: (a, rows) => {
    const list = [...a.users];
    let added = 0;
    for (const r of rows) {
      if (list.some((u) => u.email.toLowerCase() === r.email.toLowerCase())) continue;
      list.push({ id: newId(), name: r.name, email: r.email });
      added++;
    }
    return { account: { ...a, users: list }, added };
  },
};

/* ---------------- Areas (created, not predefined) ---------------- */

const areas: Importer = {
  noun: 'areas',
  cols: ['area', 'level', 'parent'],
  instructions: () => [
    `One area per row. Level is one of: ${LEVELS.join(', ')}.`,
    'Leave “parent” empty for a city. Every other area needs the area it sits inside.',
    'The parent can be another row in this file or an area you already have.',
  ],
  sample: (a) => {
    const top = a.geography.areas.find((x) => x.level === 0)?.name ?? 'Nairobi';
    return [
      ...(a.geography.areas.length ? [] : [{ area: top, level: 'City', parent: '' }]),
      { area: 'Westlands', level: 'District', parent: top },
      { area: 'Westlands Zone A', level: 'Zone', parent: 'Westlands' },
      { area: 'Parklands', level: 'Ward', parent: 'Westlands Zone A' },
    ];
  },
  check: (row, a, file) => {
    const errs: RowError[] = [];
    if (!row.area) errs.push({ col: 'area', message: 'Area name is empty' });
    if (!findName(row.level ?? '', LEVELS)) {
      const s = didYouMean(row.level ?? '', LEVELS);
      errs.push({
        col: 'level',
        message: s ? `No level called “${row.level}”. Did you mean ${s}?` : `Level must be one of: ${LEVELS.join(', ')}`,
        suggestion: s || undefined,
      });
    }
    const isTop = findName(row.level ?? '', LEVELS) === LEVELS[0];
    if (!isTop) {
      const known = [...a.geography.areas.map((x) => x.name), ...file.map((r) => r.area).filter(Boolean)];
      if (!row.parent) errs.push({ col: 'parent', message: 'Needs the area it sits inside' });
      else if (!findName(row.parent, known)) {
        const s = didYouMean(row.parent, known);
        errs.push({
          col: 'parent',
          message: s ? `No area called “${row.parent}”. Did you mean ${s}?` : `No area called “${row.parent}”`,
          suggestion: s || undefined,
        });
      }
    }
    return errs;
  },
  apply: (a, rows) => {
    const list = [...a.geography.areas];
    let added = 0;
    const sorted = [...rows].sort(
      (x, y) => LEVELS.indexOf(findName(x.level, LEVELS) ?? '') - LEVELS.indexOf(findName(y.level, LEVELS) ?? ''),
    );
    for (const r of sorted) {
      if (list.some((x) => x.name.toLowerCase() === r.area.toLowerCase())) continue;
      const parent = r.parent ? list.find((x) => x.name.toLowerCase() === r.parent.toLowerCase()) : undefined;
      list.push({ id: newId(), name: r.area, parentId: parent?.id ?? null, level: LEVELS.indexOf(findName(r.level, LEVELS)!) });
      added++;
    }
    return { account: { ...a, geography: { areas: list } }, added };
  },
};

export const IMPORTERS: Record<ImportKind, Importer> = { departments, users, areas };

/**
 * Validate a whole file: valid rows import, bad rows wait. Pending rows from
 * earlier uploads are kept; nothing is replaced.
 */
export function runImport(a: Account, kind: ImportKind, rows: Record<string, string>[]) {
  const imp = IMPORTERS[kind];
  const good: Record<string, string>[] = [];
  const bad: PendingRow[] = [];
  for (const r of rows) {
    const errors = imp.check(r, a, rows);
    if (errors.length) bad.push({ id: newId(), values: r, errors });
    else good.push(r);
  }
  const { account, added } = imp.apply(a, good);
  const meta = account.items[kind];
  return {
    account: {
      ...account,
      items: {
        ...account.items,
        [kind]: {
          ...meta,
          imported: meta.imported + added,
          pending: [...meta.pending, ...bad],
        },
      },
    },
    added,
    skipped: good.length - added,
    bad: bad.length,
  };
}

/** Re-check one pending row after a fix; import it if it now passes. */
export function retryRow(a: Account, kind: ImportKind, rowId: string, values: Record<string, string>) {
  const imp = IMPORTERS[kind];
  const meta = a.items[kind];
  const errors = imp.check(values, a, [values]);
  if (errors.length) {
    return {
      account: {
        ...a,
        items: {
          ...a.items,
          [kind]: { ...meta, pending: meta.pending.map((p) => (p.id === rowId ? { ...p, values, errors } : p)) },
        },
      },
      ok: false,
    };
  }
  const { account, added } = imp.apply(a, [values]);
  const m2 = account.items[kind];
  return {
    account: {
      ...account,
      items: {
        ...account.items,
        [kind]: { ...m2, imported: m2.imported + added, pending: m2.pending.filter((p) => p.id !== rowId) },
      },
    },
    ok: true,
  };
}
