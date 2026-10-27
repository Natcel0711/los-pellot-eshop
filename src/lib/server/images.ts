// Product photo storage. In production photos go to Vercel Blob (a file
// store with public URLs), because Vercel's servers can't keep files on
// disk. In local development, without a Blob token, they're saved to the
// ./uploads folder and served by routes/uploads/[...path]/+server.ts.
// To move off Vercel later, swap the Blob calls for S3, Cloudflare R2, etc.

import { BLOB_READ_WRITE_TOKEN } from '$app/env/private';
import { del, put } from '@vercel/blob';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
export const LOCAL_UPLOADS_DIR = join(process.cwd(), 'uploads');

const useBlob = () => Boolean(BLOB_READ_WRITE_TOKEN || process.env.VERCEL);

export class ImageError extends Error {}

function extensionOf(fileName: string): string {
	const dot = fileName.lastIndexOf('.');
	return dot === -1 ? '' : fileName.slice(dot).toLowerCase();
}

/** Stores the photo and returns its public URL. */
export async function saveProductImage(productId: string, file: File): Promise<string> {
	if (file.size === 0) throw new ImageError('Selecciona una imagen.');
	if (file.size > MAX_IMAGE_BYTES) throw new ImageError('La imagen no puede pesar más de 5 MB.');
	const ext = extensionOf(file.name);
	if (!ALLOWED_EXTENSIONS.includes(ext))
		throw new ImageError('Formato no soportado. Usa JPG, PNG, WEBP o GIF.');

	const fileName = `${productId}-${crypto.randomUUID().replaceAll('-', '')}${ext}`;

	if (useBlob()) {
		const blob = await put(`products/${fileName}`, file, {
			access: 'public',
			token: BLOB_READ_WRITE_TOKEN
		});
		return blob.url;
	}

	await mkdir(join(LOCAL_UPLOADS_DIR, 'products'), { recursive: true });
	await writeFile(
		join(LOCAL_UPLOADS_DIR, 'products', fileName),
		Buffer.from(await file.arrayBuffer())
	);
	return `/uploads/products/${fileName}`;
}

/** Deletes a stored photo. Never throws — a leftover file is harmless. */
export async function deleteProductImage(url: string | null): Promise<void> {
	if (!url) return;
	try {
		if (url.startsWith('/uploads/')) {
			await unlink(join(LOCAL_UPLOADS_DIR, url.slice('/uploads/'.length)));
		} else if (useBlob()) {
			await del(url, { token: BLOB_READ_WRITE_TOKEN });
		}
	} catch (err) {
		console.warn('Could not delete product image', url, err);
	}
}
