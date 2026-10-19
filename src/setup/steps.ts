/**
 * Sign-up and log-in, then four grouped steps (see Questions.tsx):
 * about you (name, account name) → what you'll use DIGIT for →
 * logo and colour (optional) → invite your team (optional) → Home.
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
  /** The chosen first part of the account link; empty means made from the account name. */
  link: string;
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
  link: '',
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

/** The demo account: the log-in screen starts filled in with it. */
export const DEFAULT_LOGIN = { email: 'saas@gmail.com', password: '12345' };

type Option = { value: string; label: string; hint: string; icon: string };

export const PRODUCT_OPTIONS: Option[] = [
  {
    value: 'hcm',
    label: 'Run health campaigns',
    hint: 'Plan campaigns, run them in the field and track coverage.',
    icon: 'MedicalServices',
  },
  {
    value: 'cms',
    label: 'Resolve complaints',
    hint: 'Capture complaints, assign owners and track each one until it’s closed.',
    icon: 'Feedback',
  },
  {
    value: 'lnp',
    label: 'Manage licences and permits',
    hint: 'Take applications, collect fees and issue licences.',
    icon: 'CardMembership',
  },
];

export const firstName = (a: { name: string }) => a.name.trim().split(/\s+/)[0] ?? '';
