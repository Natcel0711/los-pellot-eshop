// Creates a database connection. Kept separate from `index.ts` (which reads
// the app's environment variables) so tests and scripts can open their own
// databases with the same settings.

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema.ts';

export function createDb(url: string, authToken?: string) {
	const client = createClient({ url, authToken: authToken || undefined });
	// libsql enforces foreign keys (and their ON DELETE CASCADE rules) by default.
	return drizzle(client, { schema });
}

export type DB = ReturnType<typeof createDb>;

// SQLite allows one writer at a time. When another request is in the middle
// of writing, the database answers "busy" instead of waiting, so the few
// places that write under contention (checkout, payment) retry briefly.
export async function retryIfBusy<T>(fn: () => Promise<T>, attempts = 40): Promise<T> {
	for (let attempt = 1; ; attempt++) {
		try {
			return await fn();
		} catch (err) {
			if (attempt >= attempts || !isBusyError(err)) throw err;
			await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 40));
		}
	}
}

function isBusyError(err: unknown): boolean {
	for (let e: unknown = err; e; e = (e as { cause?: unknown }).cause) {
		const code = (e as { code?: string }).code ?? '';
		const message = (e as { message?: string }).message ?? '';
		if (code.startsWith('SQLITE_BUSY') || /database is locked|SQLITE_BUSY/i.test(message))
			return true;
	}
	return false;
}
