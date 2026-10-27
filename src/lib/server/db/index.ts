import { DATABASE_AUTH_TOKEN, DATABASE_URL } from '$app/env/private';
import { createDb } from './client.ts';

// The app's one shared database connection. Locally DATABASE_URL is a file
// (`file:local.db`); in production it's a Turso URL (`libsql://...`).
export const db = createDb(DATABASE_URL, DATABASE_AUTH_TOKEN);

export type { DB } from './client.ts';
export { retryIfBusy } from './client.ts';
