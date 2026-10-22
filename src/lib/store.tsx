import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Answers } from '../setup/steps';
import {
  hasGeography,
  nameFromEmail,
  newAccount,
  newId,
  type Account,
  type PageId,
  type Product,
  type Section,
  type TodoId,
} from './model';

/**
 * One place for account state, saved in the browser so a returning admin
 * lands where they left off.
 */
const KEY = 'digit-console-v4';

type Saved = { answers: Answers; account: Account };

/** Which product and section is open; which Home to-do to point at. */
export type Params = { product?: Product; section?: Section; highlight?: TodoId; setup?: string };

/** Everything that opens over the page and returns them to where they were. */
export type Modal =
  | { kind: 'geography' }
  | { kind: 'gate'; product: Product }
  | { kind: 'users' }
  | { kind: 'sender' }
  | { kind: 'row'; product: Product; row: string };

type Ctx = {
  answers: Answers;
  account: Account;
  page: PageId;
  params: Params;
  go: (p: PageId, params?: Params) => void;
  update: (fn: (a: Account) => Account) => void;
  restart: () => void;
  modal: Modal | null;
  openModal: (m: Modal) => void;
  closeModal: () => void;
  /** Open a product: the geography gate first if there's no geography. */
  openProduct: (p: Product) => void;
  /** Save a row's one-line result, close its modal and show the checklist. */
  finishRow: (p: Product, row: string, result: string) => void;
  /** The product checklist: open or a pill, and which row is open. */
  widgetOpen: boolean;
  setWidgetOpen: (v: boolean) => void;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
};

const AccountCtx = createContext<Ctx | null>(null);

export const useAccount = () => {
  const c = useContext(AccountCtx);
  if (!c) throw new Error('useAccount outside provider');
  return c;
};

export function loadSaved(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

export function freshAccount(answers: Answers): Account {
  const users = answers.invites
    .split(/[\s,;]+/)
    .map((e) => e.trim())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    .map((email) => ({ id: newId(), email, name: nameFromEmail(email) }));
  const a = newAccount(
    { name: answers.name.trim(), email: answers.email },
    answers.org.trim(),
    users,
    answers.products,
  );
  a.branding = {
    ...a.branding,
    logo: answers.logo ?? '',
    colour: answers.colour ?? '',
    saved: !!(answers.logo || answers.colour),
  };
  return a;
}

export function AccountProvider({
  answers,
  initial,
  onRestart,
  children,
}: {
  answers: Answers;
  initial?: Account;
  onRestart: () => void;
  children: ReactNode;
}) {
  const [account, setAccount] = useState<Account>(() => initial ?? freshAccount(answers));
  const [page, setPage] = useState<PageId>('home');
  const [params, setParams] = useState<Params>({});
  const [modal, setModal] = useState<Modal | null>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const first = useRef(true);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ answers, account }));
  }, [answers, account]);

  // New page: focus its heading so screen readers announce it.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Arriving to fix a Home to-do: focus that to-do, not the heading.
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(params.highlight ? '.todo-row.is-lit button' : 'main h1')?.focus(),
    );
    window.scrollTo(0, 0);
  }, [page, params.product, params.section]);

  const go = (p: PageId, ps: Params = {}) => {
    setPage(p);
    setParams(ps);
    setModal(null);
    if (ps.product !== params.product) {
      setWidgetOpen(false);
      setExpanded(null);
    }
  };

  const openProduct = (p: Product) => {
    if (!hasGeography(account)) return setModal({ kind: 'gate', product: p });
    go('product', { product: p, section: 'overview' });
  };

  const finishRow = (p: Product, row: string, result: string) => {
    setAccount((a) => ({
      ...a,
      products: { ...a.products, [p]: { ...a.products[p], done: { ...a.products[p].done, [row]: result } } },
    }));
    setModal(null);
    setExpanded(null);
    setWidgetOpen(true);
  };

  const restart = () => {
    localStorage.removeItem(KEY);
    onRestart();
  };

  return (
    <AccountCtx.Provider
      value={{
        answers,
        account,
        page,
        params,
        go,
        update: (fn) => setAccount((a) => fn(a)),
        restart,
        modal,
        openModal: (m) => {
          setWidgetOpen(false);
          setModal(m);
        },
        closeModal: () => setModal(null),
        openProduct,
        finishRow,
        widgetOpen,
        setWidgetOpen,
        expanded,
        setExpanded,
      }}
    >
      {children}
    </AccountCtx.Provider>
  );
}

/** Update one product's saved data. */
export const patchData =
  (p: Product, patch: Partial<Account['products'][Product]['data']>) =>
  (a: Account): Account => ({
    ...a,
    products: { ...a.products, [p]: { ...a.products[p], data: { ...a.products[p].data, ...patch } } },
  });
