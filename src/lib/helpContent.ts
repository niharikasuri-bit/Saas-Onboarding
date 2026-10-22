import type { PageId } from './model';

/**
 * Help content, shared by the Help panel (suggested for this page) and the help library pages
 * (Documents, Tutorials, FAQs). Prototype content: titles and answers describe this console.
 */

export type HelpTopic = 'start' | 'geographies' | 'notifications' | 'team' | 'integrations' | 'branding' | 'languages';
export const TOPICS: { id: HelpTopic; label: string }[] = [
  { id: 'start', label: 'Getting started' },
  { id: 'geographies', label: 'Geographies' },
  { id: 'notifications', label: 'Notification channels' },
  { id: 'team', label: 'Team' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'branding', label: 'Branding' },
  { id: 'languages', label: 'Languages' },
];
export const topicLabel = (t: HelpTopic) => TOPICS.find((x) => x.id === t)!.label;

/** The topic each page's help comes from. */
export const PAGE_TOPIC: Partial<Record<PageId, HelpTopic>> = {
  home: 'start',
  geographies: 'geographies',
  sender: 'notifications',
  team: 'team',
  integrations: 'integrations',
  branding: 'branding',
  languages: 'languages',
};

export type Faq = { id: string; q: string; a: string; topic: HelpTopic };
export const FAQS: Faq[] = [
  { id: 'f1', topic: 'start', q: 'How do I set up my account?', a: 'Home lists what’s left to do. Add your geographies first, then your notification channels. Each step opens right on Home, and the list shrinks as you finish them.' },
  { id: 'f2', topic: 'start', q: 'What has to be done before my products go live?', a: 'Every product needs your geographies and approved notification channels. Each product then has its own checklist, which you’ll find inside the product.' },
  { id: 'f3', topic: 'start', q: 'Can I see the onboarding tour again?', a: 'Yes. Open Help and select Restart onboarding tour at the bottom of the panel.' },
  { id: 'f4', topic: 'geographies', q: 'How do I add my geographies?', a: 'Pick a ready-made geography for your country, or upload a file with one column per level, like State, District and Ward. You can review the data and fix any gaps before you confirm it.' },
  { id: 'f5', topic: 'geographies', q: 'What if my uploaded file has gaps?', a: 'Rows with gaps are marked Missing in the review. Select Edit data to fill them in, then confirm. Nothing is saved until you do.' },
  { id: 'f6', topic: 'geographies', q: 'Can I change a geography after adding it?', a: 'Yes. Open it from Geographies to add, rename or remove areas. Products pick up the change straight away.' },
  { id: 'f7', topic: 'notifications', q: 'Which notification channels can I use?', a: 'SMS, email and WhatsApp. Add the ones your citizens use; each needs sender details in your organisation’s name.' },
  { id: 'f8', topic: 'notifications', q: 'Why do sender details need approval?', a: 'Telecom and messaging providers check that messages really come from your organisation. Approval can take a few days, so add your details early.' },
  { id: 'f9', topic: 'team', q: 'How do I invite my team?', a: 'Enter their work emails on Home or the Team page, choose their role and the products they can use, and send the invite.' },
  { id: 'f10', topic: 'team', q: 'What happens after someone accepts an invite?', a: 'They show as Accepted on the Team page. Select Assign access to check their role and products, and they become Active.' },
  { id: 'f11', topic: 'team', q: 'Can I resend or cancel an invite?', a: 'Yes. On the Team page, people who haven’t accepted yet have Resend invite and Cancel invite.' },
  { id: 'f12', topic: 'team', q: 'What can each role do?', a: 'Admins manage the whole account. Supervisors manage work in their geography, Staff do the day-to-day work, and Viewers can only look.' },
  { id: 'f13', topic: 'integrations', q: 'How do I connect another system?', a: 'Go to Integrations and select Add integrations. Pick the system, enter its connection details and choose the products that use it.' },
  { id: 'f14', topic: 'integrations', q: 'Why is an integration waiting on approval?', a: 'Some systems, like national ID, need their owner to approve the connection. That can take a few weeks, so request it early.' },
  { id: 'f15', topic: 'integrations', q: 'Can several products share one integration?', a: 'Yes. One connection is set up once for the account, and you choose which products use it.' },
  { id: 'f16', topic: 'branding', q: 'How do I apply my colours and logo?', a: 'Open Branding, choose a theme or your own colours, upload your logo, and select Apply theme. The preview shows the change before you apply it.' },
  { id: 'f17', topic: 'branding', q: 'How do I keep text easy to read?', a: 'Choose colours with strong contrast against white. The colour options in Branding already meet accessibility contrast.' },
  { id: 'f18', topic: 'languages', q: 'How do I add a language?', a: 'Open Language and select Add language. Choose to translate with AI, upload a translation file, or translate it yourself.' },
  { id: 'f19', topic: 'languages', q: 'Do AI translations need checking?', a: 'Yes. AI drafts every text, then you review and change anything that reads wrong before you publish it.' },
];

export type Doc = { id: string; title: string; desc: string; topic: HelpTopic; kind: 'Guide' | 'Reference' | 'Template' | 'Checklist'; format: 'PDF' | 'XLSX' | 'CSV'; size: string; updated: string };
export const DOC_KINDS = ['Guide', 'Reference', 'Template', 'Checklist'] as const;
export const DOCS: Doc[] = [
  { id: 'd1', topic: 'start', kind: 'Guide', format: 'PDF', size: '2.4 MB', updated: '14 Oct 2026', title: 'DIGIT console admin guide', desc: 'Everything an admin does in the console, from setup to go live.' },
  { id: 'd2', topic: 'start', kind: 'Checklist', format: 'PDF', size: '320 KB', updated: '2 Oct 2026', title: 'Go-live checklist', desc: 'What to check before each product goes live.' },
  { id: 'd3', topic: 'geographies', kind: 'Template', format: 'XLSX', size: '48 KB', updated: '9 Oct 2026', title: 'Geography upload template', desc: 'One column per level, ready to fill in and upload.' },
  { id: 'd4', topic: 'geographies', kind: 'Reference', format: 'PDF', size: '780 KB', updated: '21 Sep 2026', title: 'Geography levels explained', desc: 'How levels like State, District and Ward fit together.' },
  { id: 'd5', topic: 'notifications', kind: 'Reference', format: 'PDF', size: '610 KB', updated: '30 Sep 2026', title: 'Sender approval requirements', desc: 'What providers need for SMS, email and WhatsApp senders.' },
  { id: 'd6', topic: 'team', kind: 'Template', format: 'CSV', size: '4 KB', updated: '11 Oct 2026', title: 'Team upload template', desc: 'Name, work email, role and product access for each person.' },
  { id: 'd7', topic: 'team', kind: 'Reference', format: 'PDF', size: '410 KB', updated: '5 Oct 2026', title: 'Roles and permissions', desc: 'What Admins, Supervisors, Staff and Viewers can do.' },
  { id: 'd8', topic: 'integrations', kind: 'Guide', format: 'PDF', size: '1.1 MB', updated: '12 Oct 2026', title: 'Connecting DHIS2', desc: 'Server address, accounts and matching your locations.' },
  { id: 'd9', topic: 'integrations', kind: 'Reference', format: 'PDF', size: '890 KB', updated: '27 Sep 2026', title: 'Integrations that need approval', desc: 'Who approves each system and how long it usually takes.' },
  { id: 'd10', topic: 'branding', kind: 'Guide', format: 'PDF', size: '1.6 MB', updated: '8 Oct 2026', title: 'Branding and accessibility', desc: 'Colours, logos and type that stay easy to read.' },
  { id: 'd11', topic: 'languages', kind: 'Template', format: 'XLSX', size: '120 KB', updated: '15 Oct 2026', title: 'Translation file template', desc: 'Every text in English with a column for your language.' },
];

export type Tutorial = { id: string; title: string; desc: string; topic: HelpTopic; format: 'Video' | 'Guide'; length: string; popular?: boolean };
export const TUTORIALS: Tutorial[] = [
  { id: 't1', topic: 'start', format: 'Video', length: '4 min', popular: true, title: 'A tour of the DIGIT console', desc: 'Where everything is, and what to do first.' },
  { id: 't2', topic: 'start', format: 'Video', length: '7 min', title: 'Set up your account', desc: 'Geographies, notification channels and your team, in order.' },
  { id: 't3', topic: 'geographies', format: 'Video', length: '5 min', popular: true, title: 'Upload your geography data', desc: 'Fill in the template, upload it and fix any gaps.' },
  { id: 't4', topic: 'geographies', format: 'Video', length: '4 min', title: 'Use a ready-made geography', desc: 'Pick your country’s geography and check its levels.' },
  { id: 't5', topic: 'notifications', format: 'Video', length: '3 min', title: 'Add SMS and email senders', desc: 'Enter sender details and send them for approval.' },
  { id: 't6', topic: 'team', format: 'Video', length: '5 min', popular: true, title: 'Invite your team', desc: 'Send invites, then assign access when people accept.' },
  { id: 't7', topic: 'integrations', format: 'Video', length: '6 min', title: 'Connect DHIS2', desc: 'From connection details to choosing products.' },
  { id: 't8', topic: 'branding', format: 'Video', length: '3 min', title: 'Apply your branding', desc: 'Choose a theme, add your logo and apply it.' },
  { id: 't9', topic: 'languages', format: 'Video', length: '4 min', title: 'Translate with AI', desc: 'Add a language, let AI draft it and review the texts.' },
];
