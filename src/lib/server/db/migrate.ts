// Applies the SQL migrations in /drizzle to a database. Used by
// `npm run db:setup` and by the tests.

import { migrate } from 'drizzle-orm/libsql/migrator';
import { fileURLToPath } from 'node:url';
import type { DB } from './client.ts';

const migrationsFolder = fileURLToPath(new URL('../../../../drizzle', import.meta.url));

export async function migrateDb(db: DB): Promise<void> {
	// WAL mode lets pages keep reading while a checkout is writing.
	// It's a setting of the database file, so it only matters for local files.
	try {
		await db.run('PRAGMA journal_mode = WAL');
	} catch {
		/* remote databases (Turso) manage this themselves */
	}
	await migrate(db, { migrationsFolder });
}
