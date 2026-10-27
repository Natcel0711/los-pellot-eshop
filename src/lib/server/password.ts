// Password hashing with Node's built-in scrypt (no extra dependency).
// Stored format: scrypt$<salt base64>$<hash base64>

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) =>
		scrypt(password, salt, KEY_LENGTH, (err, key) => (err ? reject(err) : resolve(key)))
	);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const hash = await derive(password, salt);
	return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [scheme, saltB64, hashB64] = stored.split('$');
	if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
	const expected = Buffer.from(hashB64, 'base64');
	const actual = await derive(password, Buffer.from(saltB64, 'base64'));
	return actual.length === expected.length && timingSafeEqual(actual, expected);
}
