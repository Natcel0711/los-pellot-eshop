<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import { getI18n } from '#lib/state/i18n.svelte.ts';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	const i18n = getI18n();
	let submitting = $state(false);

	// `value` stays the canonical Spanish string saved to the database.
	const subjectOptions = [
		{ value: 'Compatibilidad de producto', labelKey: 'contact.subjectProductCompat' },
		{ value: 'Estado de mi orden', labelKey: 'contact.subjectOrderStatus' },
		{ value: 'Instalación', labelKey: 'contact.subjectInstallation' },
		{ value: 'Garantía / Devoluciones', labelKey: 'contact.subjectWarranty' },
		{ value: 'Otro', labelKey: 'contact.subjectOther' }
	];

	const fieldClass =
		'w-full mt-1 bg-surface-2 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue';
	const infoCards = [
		['pin', 'contact.locationTitle', ['contact.locationLine1', 'contact.locationLine2']],
		['phone', 'contact.phoneTitle', ['(787) 555-0142']],
		['mail', 'contact.emailTitle', ['info@lospellotled.com']],
		['calendar', 'contact.hoursTitle', ['contact.hoursLine1', 'contact.hoursLine2']]
	] as const;
</script>

<section class="border-b border-white/5 bg-surface/40">
	<div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
		<h1 class="font-display text-4xl font-bold tracking-wide">{i18n.t('contact.title')}</h1>
		<p class="mt-2 text-sm text-muted">{i18n.t('contact.subtitle')}</p>
	</div>
</section>

<section class="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
	<div class="glow-border rounded-2xl border border-white/10 bg-surface p-6 sm:p-10">
		{#if !form?.success}
			<h2 class="mb-1 font-display text-2xl font-bold tracking-wide">
				{i18n.t('contact.formTitle')}
			</h2>
			<p class="mb-8 text-sm text-muted">{i18n.t('contact.formSubtitle')}</p>
			<form
				method="POST"
				class="grid gap-5 sm:grid-cols-2"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update({ reset: false });
						submitting = false;
					};
				}}
			>
				<div>
					<label for="c-name" class="text-xs font-semibold text-muted"
						>{i18n.t('contact.name')}</label
					>
					<input id="c-name" name="name" required type="text" class={fieldClass} />
				</div>
				<div>
					<label for="c-email" class="text-xs font-semibold text-muted"
						>{i18n.t('contact.email')}</label
					>
					<input id="c-email" name="email" required type="email" class={fieldClass} />
				</div>
				<div class="sm:col-span-2">
					<label for="c-phone" class="text-xs font-semibold text-muted"
						>{i18n.t('contact.phoneOptional')}</label
					>
					<input id="c-phone" name="phone" type="tel" class={fieldClass} />
				</div>
				<div class="sm:col-span-2">
					<label for="c-subject" class="text-xs font-semibold text-muted"
						>{i18n.t('contact.subject')}</label
					>
					<select id="c-subject" name="subject" class={fieldClass}>
						{#each subjectOptions as s (s.value)}
							<option value={s.value}>{i18n.t(s.labelKey)}</option>
						{/each}
					</select>
				</div>
				<div class="sm:col-span-2">
					<label for="c-message" class="text-xs font-semibold text-muted"
						>{i18n.t('contact.message')}</label
					>
					<textarea id="c-message" name="message" required rows="5" class="{fieldClass} resize-none"
					></textarea>
				</div>
				{#if form?.error}
					<p class="text-xs text-amber sm:col-span-2">{i18n.t('contact.errorGeneric')}</p>
				{/if}
				<div class="sm:col-span-2">
					<button
						type="submit"
						disabled={submitting}
						class="glow-ring w-full rounded-full bg-blue px-8 py-3.5 font-semibold transition hover:bg-blue-dark disabled:opacity-60 sm:w-auto"
					>
						{submitting ? i18n.t('contact.sending') : i18n.t('contact.send')}
					</button>
				</div>
			</form>
		{:else}
			<div class="py-10 text-center">
				<div
					class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-blue/30 bg-blue/15 text-blue-glow"
				>
					<Icon name="check" class="h-7 w-7" />
				</div>
				<h3 class="font-display text-2xl font-bold">{i18n.t('contact.thankYouTitle')}</h3>
				<p class="mx-auto mt-2 max-w-sm text-sm text-muted">{i18n.t('contact.thankYouBody')}</p>
			</div>
		{/if}
	</div>

	<div class="space-y-5">
		{#each infoCards as [icon, title, lines] (title)}
			<div class="rounded-2xl border border-white/10 bg-surface p-6">
				<div class="flex items-start gap-3">
					<span
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue/20 bg-blue/10 text-blue-glow"
						><Icon name={icon} class="h-5 w-5" /></span
					>
					<div>
						<p class="text-sm font-semibold">{i18n.t(title)}</p>
						<p class="mt-1 text-xs text-muted">
							{#each lines as line, i (line)}{#if i > 0}<br />{/if}{line.startsWith('contact.')
									? i18n.t(line)
									: line}{/each}
						</p>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>
