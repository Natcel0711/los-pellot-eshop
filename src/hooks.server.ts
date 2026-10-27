// Runs before every request: figures out who is asking (session cookie),
// which guest cart they have, and which language they picked. Also blocks
// non-admins from changing anything under /admin.

import { error } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { getSessionUser } from '#lib/server/auth.ts';
import { GUEST_CART_COOKIE } from '#lib/server/cart.ts';
import { db } from '#lib/server/db/index.ts';
import { LANG_COOKIE } from '#lib/state/i18n.svelte.ts';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = await getSessionUser(db, event.cookies);
	event.locals.guestToken = event.cookies.get(GUEST_CART_COOKIE) ?? null;
	event.locals.lang = event.cookies.get(LANG_COOKIE) === 'en' ? 'en' : 'es';

	// Pages under /admin redirect non-admins in routes/admin/+layout.server.ts.
	// Form submissions (POST) don't run that, so they're stopped here.
	const isAdminArea = event.url.pathname === '/admin' || event.url.pathname.startsWith('/admin/');
	if (isAdminArea && event.request.method !== 'GET' && !event.locals.user?.isAdmin) {
		error(403, 'Solo para administradores.');
	}

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});
};
