/**
 * Sign-up and login, then a few questions to set up the account:
 * your name → name your account → what you'll use DIGIT for →
 * branding (skippable) → invite your team (skippable) → Home.
 * Geography is not asked here.
 */
import type { Product } from '../lib/model';

export type Provider = 'google' | 'microsoft' | 'email';

export type Answers = {
  via: Provider | '';
  email: string;
  language: string;
  name: string;
  org: string;
  products: Product[];
  logo: string;
  colour: string;
  invites: string;
};

export const EMPTY_ANSWERS: Answers = {
  via: '',
  email: '',
  language: 'en',
  name: '',
  org: '',
  products: [],
  logo: '',
  colour: '',
  invites: '',
};

/**
 * What a work Google or Microsoft account would hand back. This is a
 * prototype, so it's a stand-in rather than a real sign-in.
 */
export const DEMO_ACCOUNT = { name: 'Amina Bello', email: 'amina.bello@nairobi.go.ke' };

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'pt', label: 'Português' },
  { value: 'sw', label: 'Kiswahili' },
];

/** A temporary password shown once on the credentials screen. */
export const TEMP_PASSWORD = 'Digit-4821';

type Option = { value: string; label: string; hint: string; icon: string };

export type Step =
  | {
      key: 'name' | 'org' | 'invites';
      kind: 'text' | 'textarea';
      heading: (a: Answers) => string;
      body: string;
      label: string;
      placeholder: string;
      hint?: string;
      error?: string;
      optional?: boolean;
    }
  | {
      key: 'look';
      kind: 'look';
      heading: (a: Answers) => string;
      body: string;
    }
  | {
      key: 'products';
      kind: 'multi';
      heading: (a: Answers) => string;
      body: string;
      label: string;
      options: Option[];
      error: string;
    };

export const PRODUCT_OPTIONS: Option[] = [
  {
    value: 'hcm',
    label: 'Health Campaigns',
    hint: 'Plan, deliver and track campaigns like bed net drives and vaccinations.',
    icon: 'Public',
  },
  {
    value: 'cms',
    label: 'Complaints',
    hint: 'Take complaints from citizens and send each one to the right team.',
    icon: 'Feedback',
  },
  {
    value: 'lnp',
    label: 'Licences and Permits',
    hint: 'Take applications, collect fees and issue licences.',
    icon: 'Assignment',
  },
];

export const firstName = (a: { name: string }) => a.name.trim().split(/\s+/)[0] ?? '';

export const STEPS: Step[] = [
  {
    key: 'name',
    kind: 'text',
    heading: () => 'First, what’s your name?',
    body: 'We’ll use this to personalise your workspace and show your teammates who set things up.',
    label: 'Your name',
    placeholder: 'e.g. Amina Bello',
    hint: 'Just your name, no titles needed.',
    error: 'Enter your name',
  },
  {
    key: 'org',
    kind: 'text',
    heading: () => 'Name your account',
    body: 'This is the name your team sees when they log in, and the name on messages going out to citizens.',
    label: 'Account name',
    placeholder: 'e.g. Nairobi City County',
    error: 'Enter a name for your account',
  },
  {
    key: 'products',
    kind: 'multi',
    heading: () => 'What will you use DIGIT for?',
    body: 'Choose everything you need. You can add more later from Home.',
    label: 'I want to use DIGIT for',
    options: PRODUCT_OPTIONS,
    error: 'Choose at least one',
  },
  {
    key: 'look',
    kind: 'look',
    heading: (a) => `Make it look like ${a.org.trim() || 'you'}`,
    body: 'Add your logo and pick a colour, so your team and citizens know it’s you. You can change these later in Branding.',
  },
  {
    key: 'invites',
    kind: 'textarea',
    heading: () => 'Invite your team',
    body: 'Add the people who’ll work with you. You can invite more later from Home.',
    label: 'Their work email addresses',
    placeholder: 'john.otieno@nairobi.go.ke, mary.chebet@nairobi.go.ke',
    hint: 'Separate addresses with commas.',
    optional: true,
  },
];
