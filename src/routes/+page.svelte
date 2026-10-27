<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '#lib/components/Icon.svelte';
	import ProductCard from '#lib/components/ProductCard.svelte';
	import { getI18n } from '#lib/state/i18n.svelte.ts';
	import { availableMakes, availableModels, availableYears } from '#lib/vehicle-selector.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = getI18n();

	const categories = $derived(data.categories.slice(0, 6));

	let year = $state('');
	let make = $state('');
	let model = $state('');
	const years = $derived(availableYears(data.vehicleTree, make, model));
	const makes = $derived(availableMakes(data.vehicleTree, year, model));
	const models = $derived(availableModels(data.vehicleTree, year, make));

	function findVehicle(event: SubmitEvent) {
		event.preventDefault();
		const params = new URLSearchParams();
		if (year) params.set('year', year);
		if (make) params.set('make', make);
		if (model) params.set('model', model);
		goto(`/vehicle?${params}`);
	}

	const selectClass =
		'bg-surface-2 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue';
</script>

<section class="relative mb-12 overflow-hidden border-b border-white/5">
	<div class="absolute inset-0 -z-10">
		<div class="absolute -top-32 right-0 h-150 w-150 rounded-full bg-blue/20 blur-[140px]"></div>
		<div class="absolute bottom-0 left-0 h-100 w-100 rounded-full bg-blue/10 blur-[120px]"></div>
	</div>

	<div
		class="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-24 sm:px-6 lg:grid-cols-2 lg:px-8"
	>
		<div>
			<p
				class="mb-6 inline-flex items-center gap-2 rounded-full border border-blue/30 bg-blue/10 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-blue-glow"
			>
				{i18n.t('home.heroEyebrow')}
			</p>
			<h1
				class="font-display text-5xl leading-[0.95] font-bold tracking-tight sm:text-6xl lg:text-7xl"
			>
				{i18n.t('home.heroTitle1')}<br />
				<span class="glow-text bg-linear-to-r from-blue-glow to-blue bg-clip-text text-transparent"
					>{i18n.t('home.heroTitle2')}</span
				>
			</h1>
			<p class="mt-6 max-w-md text-lg leading-relaxed text-muted">
				{i18n.t('home.heroSubtitle')}
			</p>
			<div class="mt-9 flex flex-wrap gap-4">
				<a
					href="/vehicle"
					class="glow-ring inline-flex items-center gap-2 rounded-full bg-blue px-7 py-3.5 font-semibold text-white transition hover:bg-blue-dark"
				>
					{i18n.t('home.ctaFindVehicle')}
					<Icon name="chevronRight" class="h-4 w-4" />
				</a>
				<a
					href="/products"
					class="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
				>
					{i18n.t('home.ctaCatalog')}
				</a>
			</div>

			<div class="mt-12 grid max-w-md grid-cols-3 gap-6">
				<div>
					<p class="font-display text-3xl font-bold text-white">{i18n.t('home.statKitsValue')}</p>
					<p class="mt-1 text-xs text-muted">{i18n.t('home.statKitsLabel')}</p>
				</div>
				<div>
					<p class="font-display text-3xl font-bold text-white">
						{i18n.t('home.statWarrantyValue')}
					</p>
					<p class="mt-1 text-xs text-muted">{i18n.t('home.statWarrantyLabel')}</p>
				</div>
				<div>
					<p class="font-display text-3xl font-bold text-white">USA + PR</p>
					<p class="mt-1 text-xs text-muted">{i18n.t('home.statShippingLabel')}</p>
				</div>
			</div>
		</div>

		<div class="relative hidden items-center justify-center lg:flex">
			<div class="absolute h-105 w-105 rounded-full bg-blue/15 blur-[100px]"></div>
			<div
				class="relative flex h-90 w-full max-w-lg items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-surface/40 shadow-[0_0_30px_rgba(47,94,255,0.15)]"
			>
				<img
					src="/logo.png"
					alt="Los Pellot LED"
					class="w-[72%] max-w-90 drop-shadow-[0_0_24px_rgba(111,149,255,0.35)]"
				/>
			</div>
		</div>
	</div>
</section>

<section class="relative z-10 mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
	<div class="glow-border rounded-2xl border border-white/10 bg-surface p-6 sm:p-8">
		<div class="mb-5 flex flex-wrap items-center justify-between gap-2">
			<h2 class="font-display text-xl font-bold tracking-wide">{i18n.t('home.finderTitle')}</h2>
			<span class="text-xs text-muted">{i18n.t('home.finderHint')}</span>
		</div>
		<form class="grid gap-4 sm:grid-cols-4" onsubmit={findVehicle}>
			<select bind:value={year} name="year" aria-label={i18n.t('home.year')} class={selectClass}>
				<option value="">{i18n.t('home.year')}</option>
				{#each years as y (y)}
					<option value={String(y)}>{y}</option>
				{/each}
			</select>
			<select
				bind:value={make}
				name="make"
				aria-label={i18n.t('home.make')}
				disabled={makes.length === 0}
				class={selectClass}
			>
				<option value="">{i18n.t('home.make')}</option>
				{#each makes as m (m)}
					<option value={m}>{m}</option>
				{/each}
			</select>
			<select
				bind:value={model}
				name="model"
				aria-label={i18n.t('home.model')}
				disabled={models.length === 0}
				class={selectClass}
			>
				<option value="">{i18n.t('home.model')}</option>
				{#each models as m (m)}
					<option value={m}>{m}</option>
				{/each}
			</select>
			<button
				type="submit"
				class="rounded-lg bg-blue px-4 py-3 text-sm font-bold transition hover:bg-blue-dark"
				>{i18n.t('home.finderSubmit')}</button
			>
		</form>
	</div>
</section>

<section class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
	<div class="mb-8 flex items-end justify-between">
		<h2 class="font-display text-3xl font-bold tracking-wide">{i18n.t('home.categoriesTitle')}</h2>
		<a href="/products" class="hidden text-sm text-blue-glow transition hover:text-white sm:inline"
			>{i18n.t('home.viewAll')}</a
		>
	</div>
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
		{#each categories as category (category.id)}
			<a
				href="/products?category={encodeURIComponent(category.id)}"
				class="group glow-ring flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-surface p-5 text-center transition hover:border-blue/40"
			>
				<div
					class="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-blue-glow transition group-hover:text-white"
				>
					<Icon name={category.icon} class="h-6 w-6" />
				</div>
				<span class="text-xs leading-tight font-semibold text-white"
					>{i18n.categoryLabel(category.id, category.name)}</span
				>
			</a>
		{/each}
	</div>
</section>

<section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
	<div class="mb-8 flex items-end justify-between">
		<div>
			<h2 class="font-display text-3xl font-bold tracking-wide">
				{i18n.t('home.bestSellersTitle')}
			</h2>
			<p class="mt-1 text-sm text-muted">{i18n.t('home.bestSellersSubtitle')}</p>
		</div>
		<a href="/products" class="hidden text-sm text-blue-glow transition hover:text-white sm:inline"
			>{i18n.t('home.viewAll')}</a
		>
	</div>
	<div class="grid grid-cols-2 gap-5 lg:grid-cols-4">
		{#each data.bestSellers as product (product.id)}
			<ProductCard {product} />
		{/each}
	</div>
</section>

<section
	class="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8"
>
	<div>
		<p class="mb-3 text-xs font-bold tracking-[0.2em] text-blue-glow">
			{i18n.t('home.installEyebrow')}
		</p>
		<h2 class="font-display text-3xl leading-tight font-bold sm:text-4xl">
			{i18n.t('home.installTitle')}
		</h2>
		<p class="mt-4 max-w-md text-sm leading-relaxed text-muted">{i18n.t('home.installBody')}</p>
		<a
			href="/installation"
			class="glow-ring mt-6 inline-flex items-center gap-2 rounded-full bg-blue px-7 py-3.5 font-semibold transition hover:bg-blue-dark"
		>
			{i18n.t('home.installCta')}
			<Icon name="calendar" class="h-4 w-4" />
		</a>
	</div>
	<div class="grid grid-cols-2 gap-4">
		{#each [['wrench', 1], ['shield', 2], ['bolt', 3], ['check', 4]] as [icon, n] (n)}
			<div class="rounded-xl border border-white/10 bg-surface p-5">
				<div class="mb-3 text-blue-glow"><Icon name={String(icon)} class="h-6 w-6" /></div>
				<p class="text-sm font-semibold text-white">{i18n.t(`home.installFeature${n}Title`)}</p>
				<p class="mt-1 text-xs text-muted">{i18n.t(`home.installFeature${n}Body`)}</p>
			</div>
		{/each}
	</div>
</section>
