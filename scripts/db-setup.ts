// `npm run db:setup` — creates/updates the database tables, adds the starting
// catalog if the database is empty, and makes sure the admin account exists.
// Safe to run any number of times. Uses DATABASE_URL / DATABASE_AUTH_TOKEN
// and ADMIN_EMAIL / ADMIN_PASSWORD from your .env file (or the environment).

import { createDb } from '../src/lib/server/db/client.ts';
import { migrateDb } from '../src/lib/server/db/migrate.ts';
import { ensureAdmin, seedCatalog } from '../src/lib/server/db/seed.ts';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set. Copy .env.example to .env first.');
	process.exit(1);
}

const db = createDb(url, process.env.DATABASE_AUTH_TOKEN);

await migrateDb(db);
console.log('✓ Tables are up to date');

console.log((await seedCatalog(db)) ? '✓ Added the starting catalog' : '· Catalog already present');

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (email && password) {
	if (password.length < 8) {
		console.error('ADMIN_PASSWORD must be at least 8 characters.');
		process.exit(1);
	}
	const outcome = await ensureAdmin(db, email, password);
	console.log(
		{
			created: `✓ Created admin account ${email}`,
			promoted: `✓ Made ${email} an admin`,
			exists: `· Admin ${email} already exists (password unchanged)`
		}[outcome]
	);
} else {
	console.log('· ADMIN_EMAIL / ADMIN_PASSWORD not set — skipped the admin account');
}
