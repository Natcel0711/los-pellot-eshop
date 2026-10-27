<!-- Shown for unknown URLs (404) and any other error. -->
<script lang="ts">
	import { page } from '$app/state';
	import { getI18n } from '#lib/state/i18n.svelte.ts';

	const i18n = getI18n();
</script>

<section class="mx-auto max-w-2xl px-4 py-32 text-center sm:px-6 lg:px-8">
	<p class="glow-text mb-4 font-display text-7xl font-bold text-blue-glow">{page.status}</p>
	{#if page.status === 404}
		<h1 class="font-display text-3xl font-bold">{i18n.t('notFound.title')}</h1>
		<p class="mt-2 text-sm text-muted">{i18n.t('notFound.body')}</p>
	{:else}
		<h1 class="font-display text-3xl font-bold">{page.error?.message}</h1>
	{/if}
	<a
		href="/"
		class="mt-7 inline-block rounded-full bg-blue px-7 py-3 font-semibold transition hover:bg-blue-dark"
		>{i18n.t('notFound.backHome')}</a
	>
</section>
