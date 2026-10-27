// See https://svelte.dev/docs/kit/types#app.d.ts
import type { User } from '#lib/types.ts';

declare global {
	namespace App {
		// Set for every request in src/hooks.server.ts.
		interface Locals {
			/** The logged-in user, or null for guests. */
			user: User | null;
			/** The guest cart token from the `lp_cart` cookie, if any. */
			guestToken: string | null;
			/** UI language from the `lp_lang` cookie. */
			lang: 'es' | 'en';
		}
	}
}

export {};
