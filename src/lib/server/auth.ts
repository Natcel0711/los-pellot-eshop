// Accounts and login sessions. Replaces ASP.NET Identity + JWT + refresh
// tokens with one httpOnly cookie that JavaScript in the page can't read.

import type { Cookies } from '@sveltejs/kit';
import { createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { User } from '../types.ts';
import type { DB } from './db/client.ts';
import { sessions, users } from './db/schema.ts';
import { hashPassword, verifyPassword } from './password.ts';

export const SESSION_COOKIE = 'lp_session';
const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_DAYS = 30;

export class AuthError extends Error {}

type UserRow = typeof users.$inferSelect;

export function toUser(u: UserRow): User {
	return {
		id: u.id,
		fullName: u.fullName,
		email: u.email,
		createdAt: u.createdAt.toISOString(),
		isAdmin: u.isAdmin
	};
}

// Only the hash of the token is stored, so a leaked database can't be used to log in.
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function createSession(db: DB, cookies: Cookies, userId: string): Promise<void> {
	const token = randomBytes(32).toString('base64url');
	const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
	await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt
	});
}

/** Returns the logged-in user for this cookie, or null. Extends sessions that are in use. */
export async function getSessionUser(db: DB, cookies: Cookies): Promise<User | null> {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return null;

	const id = hashToken(token);
	const [row] = await db
		.select({ session: sessions, user: users })
		.from(sessions)
		.innerJoin(users, eq(users.id, sessions.userId))
		.where(eq(sessions.id, id));

	if (!row || row.session.expiresAt.getTime() < Date.now()) {
		if (row) await db.delete(sessions).where(eq(sessions.id, id));
		cookies.delete(SESSION_COOKIE, { path: '/' });
		return null;
	}

	// Keep active users logged in: renew when less than half the time is left.
	if (row.session.expiresAt.getTime() - Date.now() < (SESSION_DAYS / 2) * DAY_MS) {
		const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
		await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			expires: expiresAt
		});
	}
	return toUser(row.user);
}

export async function logout(db: DB, cookies: Cookies): Promise<void> {
	const token = cookies.get(SESSION_COOKIE);
	if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function register(
	db: DB,
	input: { fullName: string; email: string; password: string }
): Promise<User> {
	const fullName = input.fullName.trim();
	const email = input.email.trim().toLowerCase();

	if (!fullName) throw new AuthError('Escribe tu nombre.');
	if (!email || !email.includes('@')) throw new AuthError('Correo electrónico inválido.');
	if (input.password.length < 6)
		throw new AuthError('La contraseña debe tener al menos 6 caracteres.');

	const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
	if (existing) throw new AuthError('Ya existe una cuenta con ese correo.');

	const [created] = await db
		.insert(users)
		.values({ fullName, email, passwordHash: await hashPassword(input.password) })
		.returning();
	return toUser(created);
}

export async function login(db: DB, emailInput: string, password: string): Promise<User> {
	const email = emailInput.trim().toLowerCase();
	const [user] = await db.select().from(users).where(eq(users.email, email));
	if (!user || !(await verifyPassword(password, user.passwordHash))) {
		throw new AuthError('Correo o contraseña incorrectos.');
	}
	return toUser(user);
}

export async function updateProfile(db: DB, userId: string, fullNameInput: string): Promise<void> {
	const fullName = fullNameInput.trim();
	if (!fullName) throw new AuthError('Escribe tu nombre.');
	await db.update(users).set({ fullName }).where(eq(users.id, userId));
}
