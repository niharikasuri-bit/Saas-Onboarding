import { slug } from '../lib/model';

/**
 * The account's web address. It's made from the account name, can be changed
 * once on the invite step (before anyone receives it), and is fixed after that.
 */

/** Placeholder until the real DIGIT address format is known. */
export const DOMAIN = 'digit.org';

/** Addresses already in use, for the prototype's availability check. */
const TAKEN = ['nairobi', 'demo', 'test', 'admin', 'digit', 'www', 'health', 'kenya'];

/** The chosen first part of the address, or one made from the account name. */
export const accountSub = (a: { link: string; org: string }) => a.link || slug(a.org.trim()) || 'your-account';

export function checkSub(v: string) {
  if (!v) return 'Enter a link';
  if (v.length < 3) return 'Use at least 3 characters';
  if (v.length > 40) return 'Use 40 characters or fewer';
  if (!/^[a-z0-9-]+$/.test(v)) return 'Use only lowercase letters, numbers and hyphens';
  if (v.startsWith('-') || v.endsWith('-')) return 'Start and end with a letter or number';
  if (TAKEN.includes(v)) return `${v}.${DOMAIN} is already taken. Try ${v}-county or add your city.`;
  return '';
}
