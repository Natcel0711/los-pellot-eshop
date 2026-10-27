// Spanish/English switcher. The choice is kept in the `lp_lang` cookie so
// the server renders pages in the right language from the first byte.
//
// Language differs per visitor, so it lives in Svelte *context* (one copy
// per page render) rather than in a module-level variable, which on the
// server would be shared between everyone's requests.

import { createContext } from 'svelte';
import { TRANSLATIONS, type Lang } from '#lib/i18n/translations.ts';

export const LANG_COOKIE = 'lp_lang';

export class I18n {
	lang = $state<Lang>('es');

	constructor(lang: Lang) {
		this.lang = lang;
	}

	t = (key: string, params?: Record<string, string | number>): string => {
		let value = TRANSLATIONS[this.lang][key] ?? TRANSLATIONS.es[key] ?? key;
		if (params) {
			for (const [name, replacement] of Object.entries(params)) {
				value = value.replaceAll(`{{${name}}}`, String(replacement));
			}
		}
		return value;
	};

	// Category names come from the database (admin-editable, Spanish), so the
	// seeded categories are translated by id and anything else shows as-is.
	categoryLabel = (id: string, fallbackName: string): string =>
		TRANSLATIONS[this.lang][`category.${id}`] ?? fallbackName;

	setLang(lang: Lang) {
		this.lang = lang;
		document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
		document.documentElement.lang = lang;
	}

	toggle() {
		this.setLang(this.lang === 'es' ? 'en' : 'es');
	}
}

export const [getI18n, setI18n] = createContext<I18n>();
