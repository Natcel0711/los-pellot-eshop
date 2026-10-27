// Number and date formatting. Dates use the store's time zone so the server
// and the browser always print the same thing.

const TIME_ZONE = 'America/Puerto_Rico';
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** $1,234.56 */
export const currency = (amount: number) => usd.format(amount);

type Lang = 'es' | 'en';
const locale = (lang: Lang) => (lang === 'en' ? 'en-US' : 'es');

/** "27 oct 2026, 17:06:00" / "Oct 27, 2026, 5:06:00 PM" */
export const dateTime = (iso: string, lang: Lang = 'es') =>
	new Intl.DateTimeFormat(locale(lang), {
		dateStyle: 'medium',
		timeStyle: 'medium',
		timeZone: TIME_ZONE
	}).format(new Date(iso));

/** "27/10/26, 17:06" */
export const dateTimeShort = (iso: string, lang: Lang = 'es') =>
	new Intl.DateTimeFormat(locale(lang), {
		dateStyle: 'short',
		timeStyle: 'short',
		timeZone: TIME_ZONE
	}).format(new Date(iso));

/** "27 oct 2026". Plain "YYYY-MM-DD" dates are shown as-is, without time-zone shifts. */
export const dateOnly = (value: string, lang: Lang = 'es') => {
	const plain = /^\d{4}-\d{2}-\d{2}$/.test(value);
	return new Intl.DateTimeFormat(locale(lang), {
		dateStyle: 'medium',
		timeZone: plain ? 'UTC' : TIME_ZONE
	}).format(new Date(plain ? value + 'T00:00:00Z' : value));
};

/** "octubre 2026" / "October 2026" */
export const monthYear = (iso: string, lang: Lang = 'es') => {
	const date = new Date(iso);
	const month = new Intl.DateTimeFormat(locale(lang), {
		month: 'long',
		timeZone: TIME_ZONE
	}).format(date);
	const year = new Intl.DateTimeFormat(locale(lang), {
		year: 'numeric',
		timeZone: TIME_ZONE
	}).format(date);
	return `${month} ${year}`;
};
