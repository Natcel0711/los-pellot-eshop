// Every page under /admin: non-admins are sent home. (Form submissions are
// checked separately in hooks.server.ts, because they don't run this.)

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user?.isAdmin) redirect(303, '/');
};
