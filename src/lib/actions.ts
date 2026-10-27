// Helpers for submitting SvelteKit form actions from the browser.
//
// Most forms use `use:enhance` directly. These helpers cover the rest:
// buttons and inputs that save something without a visible form (cart
// quantity buttons, the inventory editor, status dropdowns…), and forms
// that post to a different page's actions without navigating there.

import { deserialize, type ActionResult, type SubmitFunction } from '$app/forms';
import { loading } from '#lib/state/ui.svelte.ts';

type FieldValue = string | number | boolean | Blob | null | undefined;

/** Posts to a form action (e.g. '/cart?/add' or '?/save') and returns its result. */
export async function postAction(
	action: string,
	data: FormData | Record<string, FieldValue>
): Promise<ActionResult> {
	let body: FormData;
	if (data instanceof FormData) {
		body = data;
	} else {
		body = new FormData();
		for (const [key, value] of Object.entries(data)) {
			if (value !== null && value !== undefined)
				body.append(key, value instanceof Blob ? value : String(value));
		}
	}

	loading.start();
	try {
		const response = await fetch(action, {
			method: 'POST',
			body,
			headers: { accept: 'application/json', 'x-sveltekit-action': 'true' }
		});
		return deserialize(await response.text());
	} catch {
		return { type: 'error', error: { status: 0, message: 'network' } };
	} finally {
		loading.stop();
	}
}

/** The `error` message an action returned with `fail(...)`, if any. */
export function errorOf(result: ActionResult, fallback: string): string | null {
	if (result.type === 'success' || result.type === 'redirect') return null;
	if (result.type === 'failure') return (result.data?.error as string | undefined) ?? fallback;
	return fallback;
}

/**
 * For `use:enhance`: shows the loading bar, then lets `onResult` handle the
 * response without navigating anywhere (SvelteKit's default navigates to the
 * page that owns the action).
 */
export function enhanceWith(
	onResult: (result: ActionResult) => void | Promise<void>
): SubmitFunction {
	return () => {
		loading.start();
		return async ({ result }) => {
			try {
				await onResult(result);
			} finally {
				loading.stop();
			}
		};
	};
}

/** For `use:enhance` with SvelteKit's normal behaviour, plus the loading bar. */
export const enhanceDefault =
	(options: { reset?: boolean } = {}): SubmitFunction =>
	() => {
		loading.start();
		return async ({ update }) => {
			try {
				await update({ reset: options.reset ?? true });
			} finally {
				loading.stop();
			}
		};
	};

/** True when the action succeeded. */
export const isOk = (result: ActionResult) =>
	result.type === 'success' || result.type === 'redirect';
