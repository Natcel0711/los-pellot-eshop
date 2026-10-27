<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import { getI18n } from '#lib/state/i18n.svelte.ts';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	const i18n = getI18n();
	let submitting = $state(false);

	// `value` stays the canonical Spanish string saved to the database, so
	// bookings read the same in the admin panel whatever language was used.
	const serviceOptions = [
		{ value: 'Faros LED', labelKey: 'installation.serviceHeadlights' },
		{ value: 'Fog Lights', labelKey: '' },
		{ value: 'Luces Traseras', labelKey: 'installation.serviceTaillights' },
		{ value: 'DRL / Direccionales', labelKey: 'installation.serviceDrl' },
		{ value: 'Interior / Cabina', labelKey: 'installation.serviceInterior' },
		{ value: 'Underglow', labelKey: '' },
		{ value: 'Barra LED', labelKey: 'installation.serviceLedBar' },
		{ value: 'Diagnóstico Eléctrico', labelKey: 'installation.serviceDiagnostics' },
		{ value: 'No estoy seguro', labelKey: 'installation.serviceNotSure' }
	];

	const fieldClass =
		'w-full mt-1 bg-surface-2 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue';
</script>

<section class="relative overflow-hidden border-b border-white/5">
	<div
		class="absolute -top-24 right-0 -z-10 h-125 w-125 rounded-full bg-blue/15 blur-[130px]"
	></div>
	<div class="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
		<div>
			<p class="mb-3 text-xs font-bold tracking-[0.2em] text-blue-glow">
				{i18n.t('installation.eyebrow')}
			</p>
			<h1 class="font-display text-5xl leading-tight font-bold">
				{i18n.t('installation.title1')}<br />{i18n.t('installation.title2')}
			</h1>
			<p class="mt-5 max-w-md text-sm leading-relaxed text-muted">
				{i18n.t('installation.body')}
			</p>
			<div class="mt-7 flex flex-wrap gap-4">
				<a
					href="#booking"
					class="glow-ring inline-flex items-center gap-2 rounded-full bg-blue px-7 py-3.5 font-semibold transition hover:bg-blue-dark"
				>
					{i18n.t('installation.cta')}
					<Icon name="calendar" class="h-4 w-4" />
				</a>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4">
			{#each [['wrench', 1], ['shield', 2], ['bolt', 3], ['check', 4]] as [icon, n] (n)}
				<div class="rounded-xl border border-white/10 bg-surface p-5">
					<div class="mb-3 text-blue-glow"><Icon name={String(icon)} class="h-6 w-6" /></div>
					<p class="text-sm font-semibold">{i18n.t(`installation.feature${n}Title`)}</p>
					<p class="mt-1 text-xs text-muted">{i18n.t(`installation.feature${n}Body`)}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
	<h2 class="mb-8 font-display text-3xl font-bold tracking-wide">
		{i18n.t('installation.howItWorks')}
	</h2>
	<div class="grid gap-6 sm:grid-cols-4">
		{#each [1, 2, 3, 4] as n (n)}
			<div>
				<p class="mb-2 font-display text-4xl font-bold text-blue-glow">0{n}</p>
				<p class="text-sm font-semibold">{i18n.t(`installation.step${n}Title`)}</p>
				<p class="mt-1 text-xs text-muted">{i18n.t(`installation.step${n}Body`)}</p>
			</div>
		{/each}
	</div>
</section>

<section id="booking" class="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
	<div class="glow-border rounded-2xl border border-white/10 bg-surface p-6 sm:p-10">
		{#if !form?.success}
			<h2 class="mb-1 font-display text-3xl font-bold tracking-wide">
				{i18n.t('installation.bookTitle')}
			</h2>
			<p class="mb-8 text-sm text-muted">{i18n.t('installation.bookSubtitle')}</p>
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
					<label for="b-name" class="text-xs font-semibold text-muted"
						>{i18n.t('installation.name')}</label
					>
					<input id="b-name" name="name" required type="text" class={fieldClass} />
				</div>
				<div>
					<label for="b-phone" class="text-xs font-semibold text-muted"
						>{i18n.t('installation.phone')}</label
					>
					<input id="b-phone" name="phone" required type="tel" class={fieldClass} />
				</div>
				<div class="sm:col-span-2">
					<label for="b-email" class="text-xs font-semibold text-muted"
						>{i18n.t('installation.email')}</label
					>
					<input id="b-email" name="email" required type="email" class={fieldClass} />
				</div>
				<div>
					<label for="b-vehicle" class="text-xs font-semibold text-muted"
						>{i18n.t('installation.vehicle')}</label
					>
					<input
						id="b-vehicle"
						name="vehicle"
						required
						type="text"
						placeholder={i18n.t('installation.vehiclePlaceholder')}
						class={fieldClass}
					/>
				</div>
				<div>
					<label for="b-service" class="text-xs font-semibold text-muted"
						>{i18n.t('installation.service')}</label
					>
					<select id="b-service" name="service" required class={fieldClass}>
						<option value="">{i18n.t('installation.selectService')}</option>
						{#each serviceOptions as s (s.value)}
							<option value={s.value}>{s.labelKey ? i18n.t(s.labelKey) : s.value}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="b-date" class="text-xs font-semibold text-muted"
						>{i18n.t('installation.date')}</label
					>
					<input id="b-date" name="date" required type="date" class={fieldClass} />
				</div>
				<div class="sm:col-span-2">
					<label for="b-notes" class="text-xs font-semibold text-muted"
						>{i18n.t('installation.notesOptional')}</label
					>
					<textarea id="b-notes" name="notes" rows="3" class="{fieldClass} resize-none"></textarea>
				</div>
				{#if form?.error}
					<p class="text-xs text-amber sm:col-span-2">{i18n.t('installation.errorGeneric')}</p>
				{/if}
				<div class="sm:col-span-2">
					<button
						type="submit"
						disabled={submitting}
						class="glow-ring w-full rounded-full bg-blue px-8 py-3.5 font-semibold transition hover:bg-blue-dark disabled:opacity-60 sm:w-auto"
					>
						{submitting ? i18n.t('installation.sending') : i18n.t('installation.submit')}
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
				<h3 class="font-display text-2xl font-bold">{i18n.t('installation.thankYouTitle')}</h3>
				<p class="mx-auto mt-2 max-w-sm text-sm text-muted">
					{i18n.t('installation.thankYouBody')}
				</p>
				<a href="/" class="mt-6 inline-block text-sm text-blue-glow transition hover:text-white"
					>{i18n.t('installation.backHome')}</a
				>
			</div>
		{/if}
	</div>
</section>
