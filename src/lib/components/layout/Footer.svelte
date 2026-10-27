<script lang="ts">
	import { page } from '$app/state';
	import Icon from '#lib/components/Icon.svelte';
	import { getI18n } from '#lib/state/i18n.svelte.ts';
	import type { Category } from '#lib/types.ts';
	import { NAV_LINKS } from './nav';

	const i18n = getI18n();
	const categories = $derived(((page.data.categories ?? []) as Category[]).slice(0, 6));
</script>

<footer class="mt-24 border-t border-white/5 bg-surface">
	<div class="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
		<div class="col-span-2 md:col-span-1">
			<img src="/logo.png" alt="Los Pellot LED" class="mb-4 h-16 w-auto" />
			<p class="text-sm leading-relaxed text-muted">
				{i18n.t('footer.tagline')}
			</p>
		</div>
		<div>
			<h4 class="mb-3 font-display text-lg font-semibold tracking-wide text-white">
				{i18n.t('footer.quickLinks')}
			</h4>
			{#each NAV_LINKS as link (link.path)}
				<a href={link.path} class="block py-1 text-sm text-muted transition hover:text-blue-glow"
					>{i18n.t(link.labelKey)}</a
				>
			{/each}
		</div>
		<div>
			<h4 class="mb-3 font-display text-lg font-semibold tracking-wide text-white">
				{i18n.t('footer.categories')}
			</h4>
			{#each categories as category (category.id)}
				<a
					href="/products?category={encodeURIComponent(category.id)}"
					class="block py-1 text-sm text-muted transition hover:text-blue-glow"
					>{i18n.categoryLabel(category.id, category.name)}</a
				>
			{/each}
		</div>
		<div>
			<h4 class="mb-3 font-display text-lg font-semibold tracking-wide text-white">
				{i18n.t('footer.contact')}
			</h4>
			<div class="flex items-start gap-2 py-1 text-sm text-muted">
				<span class="mt-0.5 text-blue-glow"><Icon name="pin" class="h-4 w-4" /></span> Massachusetts,
				USA
			</div>
			<div class="flex items-start gap-2 py-1 text-sm text-muted">
				<span class="mt-0.5 text-blue-glow"><Icon name="mail" class="h-4 w-4" /></span> info@lospellotled.com
			</div>
			<div class="flex items-start gap-2 py-1 text-sm text-muted">
				<span class="mt-0.5 text-blue-glow"><Icon name="phone" class="h-4 w-4" /></span> (787) 555-0142
			</div>
		</div>
	</div>
	<div class="border-t border-white/5">
		<div
			class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 sm:flex-row sm:px-6 lg:px-8"
		>
			<p class="text-xs text-muted">{i18n.t('footer.rights')}</p>
			<p class="text-xs tracking-wide text-muted">EST. 2024</p>
		</div>
	</div>
</footer>
