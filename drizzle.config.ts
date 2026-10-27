// Used by `npm run db:generate` (creates a migration from schema changes)
// and `npm run db:studio` (a browser UI for the database).

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'turso',
	dbCredentials: {
		url: process.env.DATABASE_URL ?? 'file:local.db',
		authToken: process.env.DATABASE_AUTH_TOKEN || undefined
	},
	verbose: true,
	strict: true
});
