/**
 * Account data and the rules for getting each product live.
 *
 * The account holds what every product shares: geography, users, sender
 * details, branding. Geography gates opening any product. Inside a product,
 * a checklist of rows leads to Go live; locked rows open after an earlier
 * row, and rows that need sender details point back to Home.
 */

export type PageId =
  | 'home'
  | 'dashboard'
  | 'geographies'
  | 'sender'
  | 'team'
  | 'integrations'
  | 'branding'
  | 'product'
  | 'golive'
  | 'tutorials'
  | 'documents'
  | 'helpcenter';

export const newId = () => Math.random().toString(36).slice(2, 9);
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------------------------------------------------------------- */
/* Products                                                          */
/* ---------------------------------------------------------------- */

export type Product = 'hcm' | 'cms' | 'lnp';
export const PRODUCT_ORDER: Product[] = ['hcm', 'cms', 'lnp'];

export const PRODUCTS: Record<Product, { name: string; icon: string; about: string; data: string }> = {
  hcm: {
    name: 'Health Campaigns',
    icon: 'Public',
    about: 'Plan, deliver and track health campaigns in the field.',
    data: 'Campaign data',
  },
  cms: {
    name: 'Complaints',
    icon: 'Feedback',
    about: 'Take complaints from citizens and send each one to the right team.',
    data: 'Complaints data',
  },
  lnp: {
    name: 'Licences and Permits',
    icon: 'Assignment',
    about: 'Take applications, collect fees and issue licences.',
    data: 'Licence data',
  },
};

export type Section = 'overview' | 'data' | 'departments' | 'users' | 'notifications' | 'translations' | 'health';

export const NAVS: Record<Product, Section[]> = {
  cms: ['overview', 'data', 'departments', 'users', 'notifications', 'translations', 'health'],
  hcm: ['overview', 'data', 'users', 'notifications', 'translations', 'health'],
  lnp: ['overview', 'data', 'users', 'notifications', 'translations', 'health'],
};

export const sectionLabel = (p: Product, s: Section) =>
  s === 'data'
    ? PRODUCTS[p].data
    : { overview: 'Overview', departments: 'Departments', users: 'Users', notifications: 'Notifications', translations: 'Translations', health: 'Health' }[s];

export const SECTION_ICON: Record<Section, string> = {
  overview: 'Dashboard',
  data: 'Description',
  departments: 'Business',
  users: 'Group',
  notifications: 'Notifications',
  translations: 'Translate',
  health: 'Analytics',
};

/* ---------------------------------------------------------------- */
/* Complaints templates                                              */
/* ---------------------------------------------------------------- */

export type ComplaintType = { id: string; label: string; group: string };
export type Template = {
  id: string;
  name: string;
  about: string;
  goodFor: string;
  icon: string;
  types: ComplaintType[];
  formFields: string[];
  workflow: string[];
  metrics: string[];
};

const T = (id: string, label: string, group: string): ComplaintType => ({ id, label, group });

const FORM = ['Complaint type', 'Location', 'Photo', 'Description', 'Your contact details'];
const FLOW = ['Submitted', 'Assigned', 'In progress', 'Resolved', 'Rated by citizen'];
const TEMPLATE_METRICS = ['Open complaints', 'Overdue', 'Complaints by area', 'Average time to resolve'];

export const TEMPLATES: Template[] = [
  {
    id: 'potholes',
    name: 'Pothole Reports',
    about: 'Potholes, damaged roads and open manholes, sent to the roads team for the area.',
    goodFor: 'Road and public works departments',
    icon: 'LocationCity',
    types: [
      T('pothole', 'Pothole', 'Roads'),
      T('damaged-road', 'Damaged road surface', 'Roads'),
      T('waterlogging', 'Waterlogged road', 'Roads'),
      T('manhole', 'Open or missing manhole cover', 'Roads'),
      T('footpath', 'Broken footpath', 'Roads'),
    ],
    formFields: FORM,
    workflow: FLOW,
    metrics: TEMPLATE_METRICS,
  },
  {
    id: 'streetlights',
    name: 'Streetlight Faults',
    about: 'Lights that are out, flickering or damaged, sent to the electrical team.',
    goodFor: 'Municipal electrical and lighting teams',
    icon: 'Lightbulb',
    types: [
      T('light-out', 'Streetlight not working', 'Streetlights'),
      T('light-day', 'Light on during the day', 'Streetlights'),
      T('pole', 'Damaged or leaning pole', 'Streetlights'),
      T('no-light', 'No streetlight on the road', 'Streetlights'),
    ],
    formFields: FORM,
    workflow: FLOW,
    metrics: TEMPLATE_METRICS,
  },
  {
    id: 'sanitation',
    name: 'Waste and Sanitation',
    about: 'Missed collections, dumping, burning, blocked drains and sewage.',
    goodFor: 'Sanitation and environment departments',
    icon: 'Delete',
    types: [
      T('missed-bin', 'Garbage not collected', 'Garbage'),
      T('dumping', 'Illegal dumping', 'Garbage'),
      T('burning', 'Garbage being burned', 'Garbage'),
      T('drain', 'Blocked drain', 'Drains and sewage'),
      T('sewage', 'Sewage overflow', 'Drains and sewage'),
    ],
    formFields: FORM,
    workflow: FLOW,
    metrics: TEMPLATE_METRICS,
  },
  {
    id: 'civic',
    name: 'Civic Complaints',
    about: 'Every everyday city problem in one service: roads, lights, water, waste and animals.',
    goodFor: 'City and municipal corporations',
    icon: 'AccountBalance',
    types: [
      T('pothole', 'Pothole', 'Roads'),
      T('manhole', 'Open or missing manhole cover', 'Roads'),
      T('light-out', 'Streetlight not working', 'Streetlights'),
      T('no-water', 'No water supply', 'Water'),
      T('dirty-water', 'Dirty water', 'Water'),
      T('leak', 'Broken pipe or leak', 'Water'),
      T('missed-bin', 'Garbage not collected', 'Garbage'),
      T('burning', 'Garbage being burned', 'Garbage'),
      T('drain', 'Blocked drain', 'Drains and sewage'),
      T('stray', 'Stray animals', 'Public health'),
    ],
    formFields: FORM,
    workflow: FLOW,
    metrics: TEMPLATE_METRICS,
  },
];

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);
export const ALL_TYPES: ComplaintType[] = [
  ...new Map(TEMPLATES.flatMap((t) => t.types).map((t) => [t.id, t])).values(),
];
export const typeById = (id: string) => ALL_TYPES.find((t) => t.id === id);

/* ---------------------------------------------------------------- */
/* Licences and permits templates                                    */
/* ---------------------------------------------------------------- */

export type LicenceType = { id: string; label: string; fee: number };
export type LnpTemplate = { id: string; name: string; about: string; icon: string; types: LicenceType[] };

export const LNP_TEMPLATES: LnpTemplate[] = [
  {
    id: 'trade',
    name: 'Trade Licence',
    about: 'Yearly licences for shops, restaurants, workshops and market stalls.',
    icon: 'Business',
    types: [
      { id: 'shop', label: 'Retail shop', fee: 5000 },
      { id: 'restaurant', label: 'Restaurant or café', fee: 8000 },
      { id: 'workshop', label: 'Workshop or garage', fee: 7500 },
      { id: 'stall', label: 'Market stall', fee: 1500 },
    ],
  },
  {
    id: 'building',
    name: 'Building Permit',
    about: 'Permits to build, extend or demolish, with plan checks before approval.',
    icon: 'LocationCity',
    types: [
      { id: 'new', label: 'New building', fee: 25000 },
      { id: 'extension', label: 'Extension', fee: 12000 },
      { id: 'demolition', label: 'Demolition', fee: 8000 },
    ],
  },
  {
    id: 'food',
    name: 'Food Business Licence',
    about: 'Licences for anyone who cooks, sells or serves food, after a hygiene check.',
    icon: 'Restaurant',
    types: [
      { id: 'kitchen', label: 'Restaurant kitchen', fee: 6000 },
      { id: 'truck', label: 'Food truck', fee: 4000 },
      { id: 'catering', label: 'Catering', fee: 5000 },
    ],
  },
];

/* ---------------------------------------------------------------- */
/* Health campaign templates                                         */
/* ---------------------------------------------------------------- */

export type HcmTemplate = {
  id: string;
  name: string;
  about: string;
  icon: string;
  target: string;
  strategy: string;
  checklists: string[];
};

export const HCM_TEMPLATES: HcmTemplate[] = [
  {
    id: 'bednet',
    name: 'Bed Net Distribution',
    about: 'Register households and hand out bed nets, door to door.',
    icon: 'Home',
    target: 'Households',
    strategy: 'door',
    checklists: ['Household registration', 'Net hang-up check'],
  },
  {
    id: 'polio',
    name: 'Polio Vaccination',
    about: 'Vaccinate children under five at home and at fixed posts.',
    icon: 'MedicalServices',
    target: 'Children under 5',
    strategy: 'mixed',
    checklists: ['Child eligibility', 'Adverse event check'],
  },
  {
    id: 'smc',
    name: 'Seasonal Malaria Chemoprevention',
    about: 'Give monthly malaria medicine to children over the rainy season.',
    icon: 'LocalHospital',
    target: 'Children 3 to 59 months',
    strategy: 'door',
    checklists: ['Child eligibility', 'Dose given', 'Referral'],
  },
];

export const STRATEGIES = [
  { id: 'door', label: 'Door to door', hint: 'Field workers visit every household.' },
  { id: 'fixed', label: 'Fixed posts', hint: 'People come to a health post or school.' },
  { id: 'mixed', label: 'Both', hint: 'Door to door, with fixed posts for anyone missed.' },
];

export const APK_MODULES = ['Registration', 'Delivery', 'Stock', 'Referrals', 'Checklists', 'Sync status'];
export const FIELD_CHECKLISTS = [
  'Household registration',
  'Net hang-up check',
  'Child eligibility',
  'Dose given',
  'Adverse event check',
  'Referral',
  'Supervisor visit',
];

/** What each product's dashboard can track. */
export const METRICS: Record<Product, string[]> = {
  cms: ['Open complaints', 'Overdue complaints', 'Complaints by area', 'Average time to resolve', 'Citizen rating'],
  hcm: ['Coverage', 'Households reached', 'Stock left', 'Field workers active', 'Referrals'],
  lnp: ['Applications received', 'Approved', 'Average time to approve', 'Fees collected', 'Renewals due'],
};

/** Messages a product sends, ready to edit. */
export const MESSAGES: Record<'cms' | 'lnp', { id: string; when: string; text: string }[]> = {
  cms: [
    { id: 'received', when: 'When a complaint is made', text: 'We’ve got your complaint {ref}. We’ll keep you updated.' },
    { id: 'assigned', when: 'When it’s assigned', text: 'Your complaint {ref} is with {department}.' },
    { id: 'resolved', when: 'When it’s resolved', text: 'Your complaint {ref} is resolved. Tell us how we did: {link}' },
  ],
  lnp: [
    { id: 'received', when: 'When an application is made', text: 'We’ve got your application {ref}. Pay {fee} to continue: {link}' },
    { id: 'approved', when: 'When it’s approved', text: 'Your {licence} is approved. Download it here: {link}' },
    { id: 'renewal', when: 'Before it expires', text: 'Your {licence} expires on {date}. Renew here: {link}' },
  ],
};

export const LNP_FLOW = ['Applied', 'Fee paid', 'Documents checked', 'Inspected', 'Approved', 'Licence issued'];

/* ---------------------------------------------------------------- */
/* Account                                                           */
/* ---------------------------------------------------------------- */

export type Dept = { id: string; name: string; parentId: string | null };
export type Area = { id: string; name: string; parentId: string | null; level: number };
export type User = { id: string; name: string; email: string };
export type Channel = 'sms' | 'email' | 'whatsapp';
export type SenderState = 'none' | 'submitted' | 'approved';

/** A complaints service, made from a template. */
export type Service = { id: string; templateId: string; name: string; types: string[] };

/** Items with uploads: valid rows import, bad rows wait. */
export type DataItem = 'departments' | 'users' | 'areas';
export type PendingRow = { id: string; values: Record<string, string>; errors: RowError[] };
export type RowError = { col: string; message: string; suggestion?: string };
export type ItemMeta = { imported: number; pending: PendingRow[] };

/** What each product's rows have saved. Only the fields its rows use are set. */
export type ProductData = {
  /** LnP: licence types on, and their fees. */
  types: string[];
  fees: Record<string, number>;
  payments: string[];
  /** CMS: department → user. LnP: licence type → user. */
  owners: Record<string, string>;
  flowConfirmed: boolean;
  sla: { days: number; alert: string };
  messages: Record<string, string>;
  messagesOn: boolean;
  metrics: string[];
  /** HCM */
  basics: { name: string; start: string; end: string; target: string };
  areaIds: string[];
  strategy: { mode: string; rounds: number };
  apk: { appName: string; modules: string[] };
  plan: { file: string; rows: number };
  checklists: string[];
};

export type ProductState = {
  enabled: boolean;
  /** '' until a template is chosen. HCM may be 'own'. */
  templateId: string;
  /** Row id → the one-line result shown once it's done. */
  done: Record<string, string>;
  live: boolean;
  /** The checklist opens by itself once, then collapses to a pill. */
  introSeen: boolean;
  data: ProductData;
};

export type Account = {
  admin: { name: string; email: string };
  branding: { name: string; logo: string; colour: string; saved: boolean };
  users: User[];
  geography: { areas: Area[] };
  sender: Record<Channel, { state: SenderState; fields: Record<string, string> }>;
  products: Record<Product, ProductState>;
  /** Complaints: the service, its departments and type → department map. */
  services: Service[];
  departments: Dept[];
  mapping: Record<string, string>;
  items: Record<DataItem, ItemMeta>;
  ui: { viewAs: 'admin' | 'member' };
};

const META = (): ItemMeta => ({ imported: 0, pending: [] });

const emptyData = (): ProductData => ({
  types: [],
  fees: {},
  payments: [],
  owners: {},
  flowConfirmed: false,
  sla: { days: 3, alert: 'supervisor' },
  messages: {},
  messagesOn: false,
  metrics: [],
  basics: { name: '', start: '', end: '', target: '' },
  areaIds: [],
  strategy: { mode: '', rounds: 1 },
  apk: { appName: '', modules: [] },
  plan: { file: '', rows: 0 },
  checklists: [],
});

const productState = (enabled: boolean): ProductState => ({
  enabled,
  templateId: '',
  done: {},
  live: false,
  introSeen: false,
  data: emptyData(),
});

export const newAccount = (
  admin: { name: string; email: string },
  org: string,
  users: User[],
  products: Product[],
): Account => ({
  admin,
  branding: { name: org, logo: '', colour: '', saved: false },
  users,
  geography: { areas: [] },
  sender: {
    sms: { state: 'none', fields: {} },
    email: { state: 'none', fields: {} },
    whatsapp: { state: 'none', fields: {} },
  },
  products: {
    hcm: productState(products.includes('hcm')),
    cms: productState(products.includes('cms')),
    lnp: productState(products.includes('lnp')),
  },
  services: [],
  departments: [],
  mapping: {},
  items: { departments: META(), users: META(), areas: META() },
  ui: { viewAs: 'admin' },
});

export const activeService = (a: Account) => a.services[a.services.length - 1];

/** “priya.shah@x.gov” → “Priya Shah”. */
export function nameFromEmail(email: string) {
  const local = email.split('@')[0] ?? '';
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => cap(p.toLowerCase()))
    .join(' ');
}

/* ---------------------------------------------------------------- */
/* Geography, branding, sender                                       */
/* ---------------------------------------------------------------- */

export const LEVELS = ['City', 'District', 'Zone', 'Ward'];
/** Levels complaints can be assigned at. */
export const ASSIGN_LEVELS = ['District', 'Zone', 'Ward'];

/** Areas DIGIT already holds (prototype: Nairobi). Search, then add. */
const NAIROBI: [string, string[]][] = [
  ['Westlands', ['Parklands', 'Karura', 'Kangemi', 'Mountain View', 'Kitisuru']],
  ['Dagoretti North', ['Kilimani', 'Kawangware', 'Gatina', 'Kileleshwa', 'Kabiro']],
  ['Dagoretti South', ['Mutu-ini', 'Ngando', 'Riruta', 'Uthiru', 'Waithaka']],
  ['Langata', ['Karen', 'Nairobi West', 'Mugumo-ini', 'South C', 'Nyayo Highrise']],
  ['Kibra', ['Laini Saba', 'Lindi', 'Makina', 'Woodley', 'Sarang’ombe']],
  ['Embakasi East', ['Upper Savanna', 'Lower Savanna', 'Embakasi', 'Utawala', 'Mihango']],
  ['Kasarani', ['Clay City', 'Mwiki', 'Kasarani', 'Njiru', 'Ruai']],
  ['Starehe', ['Nairobi Central', 'Ngara', 'Pangani', 'Ziwani', 'Landimawe']],
];
export const REFERENCE_AREAS: { name: string; parent: string; level: number }[] = [
  { name: 'Nairobi', parent: '', level: 0 },
  ...NAIROBI.flatMap(([district, wards]) => {
    const zones = [`${district} Zone A`, `${district} Zone B`];
    return [
      { name: district, parent: 'Nairobi', level: 1 },
      ...zones.map((z) => ({ name: z, parent: district, level: 2 })),
      ...wards.map((w, i) => ({ name: w, parent: zones[i < 3 ? 0 : 1], level: 3 })),
    ];
  }),
];

export const BRAND_COLOURS = [
  { value: '#C84C0E', label: 'Orange' },
  { value: '#0B4B66', label: 'Teal blue' },
  { value: '#1D4ED8', label: 'Blue' },
  { value: '#00703C', label: 'Green' },
  { value: '#6D28D9', label: 'Purple' },
  { value: '#B91C1C', label: 'Red' },
];

export const CHANNELS: {
  id: Channel;
  label: string;
  note: string;
  fields: { key: string; label: string; hint?: string }[];
}[] = [
  {
    id: 'sms',
    label: 'SMS sender ID',
    note: 'Telecom approval usually takes 3 to 5 working days.',
    fields: [
      { key: 'senderId', label: 'Sender ID', hint: 'Up to 11 letters, for example NAIROBICC.' },
      { key: 'purpose', label: 'What the messages are for', hint: 'Regulators ask for this.' },
    ],
  },
  {
    id: 'email',
    label: 'Email sender',
    note: 'We verify the domain. Usually within a day.',
    fields: [
      { key: 'from', label: 'Send from (email address)' },
      { key: 'name', label: 'Sender name' },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Business',
    note: 'Meta reviews the number. Usually 2 to 7 days.',
    fields: [{ key: 'number', label: 'WhatsApp Business number' }],
  },
];

/* ---------------------------------------------------------------- */
/* Account to-do (Home hero, admins only)                            */
/* ---------------------------------------------------------------- */

export const hasGeography = (a: Account) => a.geography.areas.length > 0;
export const senderReady = (a: Account) => Object.values(a.sender).some((c) => c.state !== 'none');
export const enabledProducts = (a: Account) => PRODUCT_ORDER.filter((p) => a.products[p].enabled);
/** Complaints uses DIGIT's predefined areas; the others start by creating. */
export const geoMode = (a: Account): 'search' | 'create' => (a.products.cms.enabled ? 'search' : 'create');

export type TodoId = 'geography' | 'users' | 'sender';
export const TODOS: { id: TodoId; label: string; unlocks: string }[] = [
  { id: 'geography', label: 'Add geographies', unlocks: 'This unlocks opening any product.' },
  { id: 'users', label: 'Invite users', unlocks: 'This unlocks assigning people.' },
  { id: 'sender', label: 'Add sender details', unlocks: 'This unlocks messages.' },
];

export const todosFor = (a: Account) =>
  TODOS.filter((t) => t.id !== 'sender' || a.products.cms.enabled || a.products.lnp.enabled);

export const todoDone = (id: TodoId, a: Account) =>
  id === 'geography' ? hasGeography(a) : id === 'users' ? a.users.length > 0 : senderReady(a);

export function todoResult(id: TodoId, a: Account) {
  if (id === 'geography') return `${a.geography.areas.length.toLocaleString('en')} areas`;
  if (id === 'users') return `${a.users.length} ${a.users.length === 1 ? 'user' : 'users'} invited`;
  return 'Submitted for approval';
}

/* ---------------------------------------------------------------- */
/* Product checklists                                                */
/* ---------------------------------------------------------------- */

export type RowDef = {
  id: string;
  label: string;
  /** What it's for, one line, shown when the row is open. */
  what: string;
  /** Where the row lives in the product's side nav. */
  section: Section;
  /** Opens after this row is done. */
  after?: string;
  /** Opens after users are invited (an account to-do). */
  needsUsers?: boolean;
  /** Needs sender details from Home before messages can go out. */
  account?: boolean;
};

export const ROWS: Record<Product, RowDef[]> = {
  cms: [
    { id: 'types', label: 'Choose what people can report', what: 'Turn on the complaint types you handle.', section: 'data' },
    {
      id: 'owners',
      label: 'Assign complaint owners',
      what: 'Send each complaint type to a department, and give each department an owner.',
      section: 'departments',
      after: 'types',
      needsUsers: true,
    },
    { id: 'flow', label: 'Set how complaints move around', what: 'Check the steps a complaint goes through.', section: 'data', after: 'owners' },
    { id: 'sla', label: 'Set deadlines and alerts', what: 'How long a complaint can stay open, and who hears when it’s late.', section: 'data', after: 'flow' },
    { id: 'notify', label: 'Keep people informed', what: 'The messages citizens get at each step.', section: 'notifications', account: true },
    { id: 'perf', label: 'Set up performance tracking', what: 'Choose what your dashboard and Health track.', section: 'health' },
  ],
  hcm: [
    { id: 'basics', label: 'Set up your campaign basics', what: 'Name, dates and who you’re reaching.', section: 'data' },
    { id: 'areas', label: 'Choose campaign areas', what: 'Pick where the campaign runs, from your geography.', section: 'data', after: 'basics' },
    { id: 'strategy', label: 'Add your delivery strategy', what: 'How you reach people, and how many rounds.', section: 'data', after: 'basics' },
    { id: 'apk', label: 'Customize your field APK', what: 'The app field workers use: its name and what’s in it.', section: 'data', after: 'strategy' },
    { id: 'plan', label: 'Upload your campaign plan', what: 'Targets and resources for each campaign area.', section: 'data', after: 'areas' },
    { id: 'checklists', label: 'Set up field checklists', what: 'The checks field workers fill in at each visit.', section: 'data', after: 'apk' },
    { id: 'monitor', label: 'Choose what to monitor', what: 'What your dashboard and Health track.', section: 'data', after: 'basics' },
  ],
  lnp: [
    { id: 'types', label: 'Choose what people can apply for', what: 'Turn on the licences and permits you issue.', section: 'data' },
    { id: 'fees', label: 'Set fees and payments', what: 'What each one costs, and how people can pay.', section: 'data', after: 'types' },
    {
      id: 'owners',
      label: 'Assign application owners',
      what: 'Who reviews each kind of application.',
      section: 'users',
      after: 'types',
      needsUsers: true,
    },
    { id: 'flow', label: 'Set how applications move around', what: 'Check the steps an application goes through.', section: 'data', after: 'owners' },
    { id: 'notify', label: 'Keep people informed', what: 'The messages applicants get at each step.', section: 'notifications', account: true },
    { id: 'perf', label: 'Set up performance tracking', what: 'Choose what your dashboard and Health track.', section: 'health' },
  ],
};

export const rowDef = (p: Product, id: string) => ROWS[p].find((r) => r.id === id)!;

export type RowState = 'done' | 'open' | 'locked';

/** Why a row can't be opened yet, as “Opens after: …”, or ''. */
export function rowLocked(p: Product, r: RowDef, a: Account): string {
  const done = a.products[p].done;
  if (r.after && !done[r.after]) return `Opens after: ${rowDef(p, r.after).label}`;
  if (r.needsUsers && !a.users.length) return 'Opens after: Invite users, on Home';
  return '';
}

export function rowState(p: Product, r: RowDef, a: Account): RowState {
  if (a.products[p].done[r.id]) return 'done';
  return rowLocked(p, r, a) ? 'locked' : 'open';
}

export const doneRows = (p: Product, a: Account) => ROWS[p].filter((r) => a.products[p].done[r.id]).length;
export const percent = (p: Product, a: Account) => Math.round((doneRows(p, a) / ROWS[p].length) * 100);
export const stepsLeft = (p: Product, a: Account) => ROWS[p].length - doneRows(p, a);
export const nextRow = (p: Product, a: Account) =>
  ROWS[p].find((r) => rowState(p, r, a) === 'open') ?? ROWS[p].find((r) => rowState(p, r, a) !== 'done');

/** Home card state for a product. */
export function cardState(p: Product, a: Account): 'off' | 'nogeo' | 'setting' | 'live' {
  const s = a.products[p];
  if (!s.enabled) return 'off';
  if (s.live) return 'live';
  if (!hasGeography(a)) return 'nogeo';
  return 'setting';
}

/** Status shown beside a product nav item. */
export function sectionStatus(p: Product, s: Section, a: Account): { label: string; tone: string } | null {
  const st = a.products[p];
  if (s === 'overview') return st.live ? { label: 'Live', tone: 'is-completed' } : { label: 'Not live', tone: 'is-not-started' };
  if (s === 'translations') return { label: 'Optional', tone: 'is-locked' };
  if (s === 'users') {
    const rows = ROWS[p].filter((r) => r.section === 'users');
    if (!rows.length) return { label: `${a.users.length} ${a.users.length === 1 ? 'user' : 'users'}`, tone: a.users.length ? 'is-completed' : 'is-not-started' };
  }
  if (s === 'health' && st.live) return { label: 'Healthy', tone: 'is-completed' };
  if (s === 'notifications' && p === 'hcm') return { label: 'Optional', tone: 'is-locked' };
  const rows = ROWS[p].filter((r) => r.section === s);
  if (!rows.length) return null;
  const d = rows.filter((r) => st.done[r.id]).length;
  if (d === rows.length) return { label: 'Done', tone: 'is-completed' };
  if (rows.every((r) => rowState(p, r, a) === 'locked')) return { label: 'Locked', tone: 'is-locked' };
  return rows.length === 1 ? { label: 'To do', tone: 'is-not-started' } : { label: `${d} of ${rows.length}`, tone: d ? 'is-in-progress' : 'is-not-started' };
}

/* ---------------------------------------------------------------- */
/* Go live: blocking checks and what's being launched                */
/* ---------------------------------------------------------------- */

/** Enabled complaint types with no department. */
export const unmappedTypes = (a: Account) => {
  const s = activeService(a);
  return s ? s.types.filter((t) => !a.mapping[t] || !a.departments.some((d) => d.id === a.mapping[t])) : [];
};

/** Departments that receive complaints but have no owner. */
export const deptsNoOwner = (a: Account) => {
  const owners = a.products.cms.data.owners;
  const used = new Set(Object.values(a.mapping));
  return a.departments.filter((d) => used.has(d.id) && !a.users.some((u) => u.id === owners[d.id]));
};

export const lnpTemplate = (a: Account) => LNP_TEMPLATES.find((t) => t.id === a.products.lnp.templateId);
export const hcmTemplate = (a: Account) => HCM_TEMPLATES.find((t) => t.id === a.products.hcm.templateId);

export type Check = { label: string; count: number; row: string };

export function blockingChecks(p: Product, a: Account): Check[] {
  const d = a.products[p].data;
  if (p === 'cms')
    return [
      { label: 'Complaint types with no department', count: unmappedTypes(a).length, row: 'owners' },
      { label: 'Departments with no owner', count: deptsNoOwner(a).length, row: 'owners' },
    ];
  if (p === 'lnp')
    return [
      { label: 'Licence types with no fee', count: d.types.filter((t) => !(d.fees[t] >= 0)).length, row: 'fees' },
      {
        label: 'Licence types with no owner',
        count: d.types.filter((t) => !a.users.some((u) => u.id === d.owners[t])).length,
        row: 'owners',
      },
    ];
  return [
    { label: 'Campaign areas with no plan', count: d.plan.file ? 0 : d.areaIds.length, row: 'plan' },
  ];
}

export const blocked = (p: Product, a: Account) =>
  stepsLeft(p, a) > 0 || blockingChecks(p, a).some((c) => c.count > 0);

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
