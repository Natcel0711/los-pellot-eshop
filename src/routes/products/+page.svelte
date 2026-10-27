<script lang="ts">
	import { goto } from '$app/navigation';
	import Icon from '#lib/components/Icon.svelte';
	import ProductCard from '#lib/components/ProductCard.svelte';
	import { getI18n } from '#lib/state/i18n.svelte.ts';
	import type { ProductSort } from '#lib/types.ts';
	import { availableMakes, availableModels, availableYears } from '#lib/vehicle-selector.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = getI18n();

	const f = $derived(data.filters);
	let filtersPanelOpen = $state(false);

	const years = $derived(availableYears(data.vehicleTree, f.make, f.model));
	const makes = $derived(availableMakes(data.vehicleTree, f.year, f.model));
	const models = $derived(availableModels(data.vehicleTree, f.year, f.make));

	const vehicleLabel = $derived(
		f.year && f.make && f.model ? `${f.year} ${f.make} ${f.model}` : null
	);

	function categoryName(id: string) {
		return i18n.categoryLabel(id, data.categories.find((c) => c.id === id)?.name ?? id);
	}

	/** Applies a filter change by updating the URL (the page reloads its products). */
	function update(changes: Partial<typeof f>) {
		const next = { ...f, ...changes };
		const params = new URLSearchParams();
		for (const id of next.categories) params.append('category', id);
		if (next.year) params.set('year', next.year);
		if (next.make) params.set('make', next.make);
		if (next.model) params.set('model', next.model);
		if (next.q) params.set('q', next.q);
		if (next.saleOnly) params.set('sale', '1');
		if (next.sort !== 'relevance') params.set('sort', next.sort);
		const query = params.toString();
		goto(query ? `?${query}` : '/products', { replace: true, reset: false });
	}

	function toggleCategory(id: string, checked: boolean) {
		update({ categories: checked ? [...f.categories, id] : f.categories.filter((c) => c !== id) });
	}

	const chips = $derived.by(() => {
		const list: { label: string; clear: () => void }[] = f.categories.map((id) => ({
			label: categoryName(id),
			clear: () => toggleCategory(id, false)
		}));
		if (f.year)
			list.push({ label: f.year, clear: () => update({ year: '', make: '', model: '' }) });
		if (f.make) list.push({ label: f.make, clear: () => update({ make: '', model: '' }) });
		if (f.model) list.push({ label: f.model, clear: () => update({ model: '' }) });
		if (f.saleOnly)
			list.push({ label: i18n.t('products.saleOnly'), clear: () => update({ saleOnly: false }) });
		return list;
	});

	const sidebarSelect =
		'w-full bg-surface border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue';
</script>

<section class="border-b border-white/5 bg-surface/40">
	<div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
		<h1 class="font-display text-4xl font-bold tracking-wide">{i18n.t('products.title')}</h1>
		<p class="mt-2 text-sm text-muted">{i18n.t('products.subtitle')}</p>
	</div>
</section>

<section class="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
	<aside>
		<button
			class="mb-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-surface px-4 py-3 lg:hidden"
			onclick={() => (filtersPanelOpen = !filtersPanelOpen)}
		>
			<span class="text-sm font-semibold">{i18n.t('products.filtersToggle')}</span>
			<Icon name="chevronDown" class="h-4 w-4" />
		</button>

		<div class="space-y-8 lg:sticky lg:top-28 lg:block {filtersPanelOpen ? '' : 'hidden'}">
			<div>
				<h3 class="mb-3 text-xs font-bold tracking-[0.15em] text-muted">
					{i18n.t('products.yourVehicle')}
				</h3>
				<div class="space-y-2">
					<select
						value={f.year}
						aria-label={i18n.t('home.year')}
						onchange={(e) => update({ year: e.currentTarget.value, make: '', model: '' })}
						class={sidebarSelect}
					>
						<option value="">{i18n.t('home.year')}</option>
						{#each years as y (y)}
							<option value={String(y)}>{y}</option>
						{/each}
					</select>
					<select
						value={f.make}
						aria-label={i18n.t('home.make')}
						onchange={(e) => update({ make: e.currentTarget.value, model: '' })}
						disabled={makes.length === 0}
						class={sidebarSelect}
					>
						<option value="">{i18n.t('home.make')}</option>
						{#each makes as m (m)}
							<option value={m}>{m}</option>
						{/each}
					</select>
					<select
						value={f.model}
						aria-label={i18n.t('home.model')}
						onchange={(e) => update({ model: e.currentTarget.value })}
						disabled={models.length === 0}
						class={sidebarSelect}
					>
						<option value="">{i18n.t('home.model')}</option>
						{#each models as m (m)}
							<option value={m}>{m}</option>
						{/each}
					</select>
				</div>
			</div>

			<div>
				<h3 class="mb-3 text-xs font-bold tracking-[0.15em] text-muted">
					{i18n.t('products.category')}
				</h3>
				<div class="space-y-1">
					{#each data.categories as category (category.id)}
						<label
							class="flex cursor-pointer items-center gap-2 py-1 text-sm text-muted hover:text-white"
						>
							<input
								type="checkbox"
								class="h-4 w-4 rounded accent-blue"
								checked={f.categories.includes(category.id)}
								onchange={(e) => toggleCategory(category.id, e.currentTarget.checked)}
							/>
							{i18n.categoryLabel(category.id, category.name)}
						</label>
					{/each}
				</div>
			</div>

			<div>
				<h3 class="mb-3 text-xs font-bold tracking-[0.15em] text-muted">
					{i18n.t('products.availability')}
				</h3>
				<label class="flex items-center gap-2 text-sm text-muted">
					<input
						type="checkbox"
						class="h-4 w-4 rounded accent-blue"
						checked={f.saleOnly}
						onchange={(e) => update({ saleOnly: e.currentTarget.checked })}
					/>
					{i18n.t('products.saleOnly')}
				</label>
			</div>

			<button
				class="text-xs text-blue-glow transition hover:text-white"
				onclick={() =>
					update({ categories: [], year: '', make: '', model: '', q: '', saleOnly: false })}
				>{i18n.t('products.clearFilters')}</button
			>
		</div>
	</aside>

	<div>
		<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
			<p class="text-sm text-muted">
				{i18n.t(data.products.length === 1 ? 'products.showingOne' : 'products.showingMany', {
					count: data.products.length
				})}
			</p>
			<div class="flex items-center gap-3">
				<label for="sort" class="text-xs text-muted">{i18n.t('products.sortBy')}</label>
				<select
					id="sort"
					value={f.sort}
					onchange={(e) => update({ sort: e.currentTarget.value as ProductSort })}
					class="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm focus:border-blue focus:outline-none"
				>
					<option value="relevance">{i18n.t('products.sortRelevance')}</option>
					<option value="price-asc">{i18n.t('products.sortPriceAsc')}</option>
					<option value="price-desc">{i18n.t('products.sortPriceDesc')}</option>
					<option value="name-asc">{i18n.t('products.sortNameAsc')}</option>
				</select>
			</div>
		</div>

		{#if chips.length > 0}
			<div class="mb-6 flex flex-wrap gap-2">
				{#each chips as chip (chip.label)}
					<button
						class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-2 py-1.5 pr-2 pl-3 text-xs text-white transition hover:border-blue/40"
						onclick={chip.clear}
					>
						{chip.label}
						<Icon name="close" class="h-3 w-3" />
					</button>
				{/each}
			</div>
		{/if}

		{#if vehicleLabel}
			<div
				class="mb-6 flex items-center gap-3 rounded-xl border border-blue/30 bg-blue/10 px-4 py-3 text-sm"
			>
				<span class="text-blue-glow"><Icon name="check" class="h-4 w-4" /></span>
				<span>{i18n.t('products.vehicleMatch', { vehicle: vehicleLabel })}</span>
			</div>
		{/if}

		{#if data.products.length === 0}
			<div class="py-24 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-muted"
				>
					<Icon name="search" class="h-7 w-7" />
				</div>
				<p class="font-semibold text-white">{i18n.t('products.noResultsTitle')}</p>
				<p class="mt-1 text-sm text-muted">{i18n.t('products.noResultsBody')}</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-5 md:grid-cols-3">
				{#each data.products as product (product.id)}
					<ProductCard {product} {vehicleLabel} />
				{/each}
			</div>
		{/if}
	</div>
</section>
