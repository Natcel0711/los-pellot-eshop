// Serves product photos saved to ./uploads during local development.
// In production photos live in Vercel Blob and have their own URLs.

import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { LOCAL_UPLOADS_DIR } from '#lib/server/images.ts';
import type { RequestHandler } from './$types';

const TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif'
};

export const GET: RequestHandler = async ({ params }) => {
	const file = resolve(join(LOCAL_UPLOADS_DIR, params.path));
	const type = TYPES[extname(file).toLowerCase()];
	if (!file.startsWith(LOCAL_UPLOADS_DIR + sep) || !type) error(404);
	try {
		return new Response(await readFile(file), {
			headers: { 'content-type': type, 'cache-control': 'public, max-age=31536000, immutable' }
		});
	} catch {
		error(404);
	}
};
