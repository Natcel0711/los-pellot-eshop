<script lang="ts">
	import { page } from '$app/state';
	import Icon from '#lib/components/Icon.svelte';
	import ProductCard from '#lib/components/ProductCard.svelte';
	import { getI18n } from '#lib/state/i18n.svelte.ts';
	import {
		availableMakes,
		availableModels,
		availableTrims,
		availableYears
	} from '#lib/vehicle-selector.ts';
	import VehicleScene from '#lib/vehicle/VehicleScene.svelte';
	import type { VehicleSceneHandle, VehicleView } from '#lib/vehicle/vehicle-scene.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = getI18n();

	// The home page's vehicle finder links here with ?year=&make=&model=.
	let year = $state(page.url.searchParams.get('year') ?? '');
	let make = $state(page.url.searchParams.get('make') ?? '');
	let model = $state(page.url.searchParams.get('model') ?? '');
	let trim = $state('');

	const years = $derived(availableYears(data.vehicleTree, make, model));
	const makes = $derived(availableMakes(data.vehicleTree, year, model));
	const models = $derived(availableModels(data.vehicleTree, year, make));
	const trims = $derived(availableTrims(data.vehicleTree, year, make, model));

	const vehicleReady = $derived(Boolean(year && make && model));
	const vehicleLabel = $derived(`${year} ${make} ${model}`.trim());
	const vehicleLabelWithTrim = $derived((vehicleLabel + (trim ? ` ${trim}` : '')).toUpperCase());

	let scene = $state<VehicleSceneHandle | null>(null);
	let selectedCategory = $state<string | null>(null);
	let tooltip = $state<{ category: string; x: number; y: number } | null>(null);
	let autoRotate = $state(true);

	const panelProducts = $derived(
		selectedCategory ? data.products.filter((p) => p.category === selectedCategory) : []
	);

	const category = (id: string) => data.categories.find((c) => c.id === id);
	const categoryDisplayName = (id: string) => i18n.categoryLabel(id, category(id)?.name ?? id);

	function onShortcutClick(id: string) {
		scene?.focusCategory(id);
		selectedCategory = id;
	}

	function goToView(view: VehicleView) {
		scene?.goToView(view);
	}

	const labelClass = 'text-[11px] text-muted font-semibold tracking-wide';
	const selectClass =
		'w-full mt-1 bg-surface border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue';
	const views: [VehicleView, string][] = [
		['front', 'vehicle.viewFront'],
		['side', 'vehicle.viewSide'],
		['rear', 'vehicle.viewRear']
	];
	const perks = [
		['shield', 'Warranty'],
		['truck', 'Shipping'],
		['wrench', 'Install'],
		['headset', 'Support']
	];
</script>

<section class="border-b border-white/5 bg-surface/40">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<h1 class="font-display text-4xl font-bold tracking-wide">{i18n.t('vehicle.title')}</h1>
		<p class="mt-2 text-sm text-muted">{i18n.t('vehicle.subtitle')}</p>

		<form class="mt-6 grid gap-3 sm:grid-cols-4">
			<div>
				<label for="v-year" class={labelClass}>{i18n.t('vehicle.yearLabel')}</label>
				<select
					id="v-year"
					bind:value={year}
					onchange={() => {
						make = model = trim = '';
					}}
					class={selectClass}
				>
					<option value="">{i18n.t('home.year')}</option>
					{#each years as y (y)}<option value={String(y)}>{y}</option>{/each}
				</select>
			</div>
			<div>
				<label for="v-make" class={labelClass}>{i18n.t('vehicle.makeLabel')}</label>
				<select
					id="v-make"
					bind:value={make}
					onchange={() => {
						model = trim = '';
					}}
					disabled={makes.length === 0}
					class={selectClass}
				>
					<option value="">{i18n.t('home.make')}</option>
					{#each makes as m (m)}<option value={m}>{m}</option>{/each}
				</select>
			</div>
			<div>
				<label for="v-model" class={labelClass}>{i18n.t('vehicle.modelLabel')}</label>
				<select
					id="v-model"
					bind:value={model}
					onchange={() => (trim = '')}
					disabled={models.length === 0}
					class={selectClass}
				>
					<option value="">{i18n.t('home.model')}</option>
					{#each models as m (m)}<option value={m}>{m}</option>{/each}
				</select>
			</div>
			<div>
				<label for="v-trim" class={labelClass}>{i18n.t('vehicle.trimLabel')}</label>
				<select id="v-trim" bind:value={trim} disabled={trims.length === 0} class={selectClass}>
					<option value="">{i18n.t('vehicle.trimOption')}</option>
					{#each trims as t (t)}<option value={t}>{t}</option>{/each}
				</select>
			</div>
		</form>
	</div>
</section>

{#if vehicleReady}
	<section class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
		<div>
			<div class="mb-4 flex items-center justify-between">
				<div>
					<p class="text-xs font-bold tracking-[0.15em] text-blue-glow">{vehicleLabelWithTrim}</p>
					<p class="text-xs text-muted">{i18n.t('vehicle.interactiveHint')}</p>
				</div>
				<div
					class="hidden items-center gap-1 rounded-full border border-white/10 bg-surface p-1 sm:flex"
				>
					{#each views as [view, key] (view)}
						<button
							type="button"
							class="rounded-full px-4 py-2 text-xs font-semibold transition hover:bg-white/5"
							onclick={() => goToView(view)}>{i18n.t(key)}</button
						>
					{/each}
				</div>
			</div>

			<div
				class="relative overflow-hidden rounded-2xl border border-white/10 bg-surface"
				style="aspect-ratio: 16/10;"
			>
				<div
					class="absolute inset-0 opacity-[0.07]"
					style="background-image: linear-gradient(#6f95ff 1px, transparent 1px), linear-gradient(90deg, #6f95ff 1px, transparent 1px); background-size: 32px 32px;"
				></div>

				<VehicleScene
					bind:scene
					activeCategory={selectedCategory}
					onhotspotclick={(id) => (selectedCategory = id)}
					onhotspothover={(hover) => (tooltip = hover)}
					onautorotatechange={(isOn) => (autoRotate = isOn)}
				/>

				{#if tooltip}
					<div
						class="pointer-events-none absolute z-10 -mt-2 -translate-x-1/2 -translate-y-full rounded-full border border-white/10 bg-bg/95 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
						style="left: {tooltip.x}px; top: {tooltip.y}px"
					>
						{categoryDisplayName(tooltip.category)}
					</div>
				{/if}

				<p
					class="absolute top-3 left-3 hidden items-center gap-1.5 rounded-full border border-white/10 bg-bg/70 px-3 py-1.5 text-[11px] text-muted backdrop-blur sm:flex"
				>
					<Icon name="rotate" class="h-3.5 w-3.5" />
					{i18n.t('vehicle.dragHint')}
				</p>

				<button
					type="button"
					class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-bg/80 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition {autoRotate
						? 'border-blue/50'
						: 'border-white/10'}"
					onclick={() => (autoRotate = scene?.toggleAutoRotate() ?? false)}
				>
					<Icon name="rotate" class="h-4 w-4" />
					<span>{autoRotate ? i18n.t('vehicle.autoRotating') : i18n.t('vehicle.autoRotate')}</span>
				</button>

				<div
					class="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-bg/80 p-1 backdrop-blur sm:hidden"
				>
					{#each views as [view, key] (view)}
						<button
							type="button"
							class="rounded-full px-3 py-1.5 text-[11px] font-semibold"
							onclick={() => goToView(view)}>{i18n.t(key)}</button
						>
					{/each}
				</div>
			</div>

			<div class="mt-8">
				<h3 class="mb-3 text-xs font-bold tracking-[0.15em] text-muted">
					{i18n.t('vehicle.exploreOther')}
				</h3>
				<div class="grid grid-cols-3 gap-3 sm:grid-cols-6">
					{#each data.categories as c (c.id)}
						<button
							type="button"
							class="glow-ring flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-surface p-3 transition hover:border-blue/40"
							onclick={() => onShortcutClick(c.id)}
						>
							<span class="text-blue-glow"><Icon name={c.icon} class="h-5 w-5" /></span>
							<span class="text-center text-[10px] leading-tight font-semibold text-muted"
								>{categoryDisplayName(c.id)}</span
							>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<aside class="h-fit rounded-2xl border border-white/10 bg-surface p-5 lg:sticky lg:top-28">
			{#if !selectedCategory}
				<div class="py-16 text-center">
					<div
						class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-blue-glow"
					>
						<Icon name="bolt" class="h-6 w-6" />
					</div>
					<p class="text-sm font-semibold text-white">{i18n.t('vehicle.selectZoneTitle')}</p>
					<p class="mx-auto mt-1 max-w-55 text-xs text-muted">{i18n.t('vehicle.selectZoneHint')}</p>
				</div>
			{:else}
				<div class="mb-1 flex items-center gap-2 text-blue-glow">
					<Icon name={category(selectedCategory)?.icon ?? 'bolt'} class="h-5 w-5" />
					<h3 class="font-display text-xl font-bold tracking-wide">
						{categoryDisplayName(selectedCategory).toUpperCase()}
					</h3>
				</div>
				<p class="mb-4 text-xs text-muted">{i18n.t('vehicle.selectedArea')}</p>

				<div class="mb-5 rounded-xl border border-white/10 bg-surface-2 p-4">
					<p class="mb-1 text-[11px] font-semibold tracking-wide text-muted">
						{i18n.t('vehicle.compatibleBulbLabel')}
					</p>
					<p class="font-display text-2xl font-bold text-white">
						{category(selectedCategory)?.defaultBulbType ?? 'Universal'}
					</p>
					<p class="mt-1 flex items-center gap-1 text-[11px] text-blue-glow">
						<Icon name="check" class="h-3.5 w-3.5" />
						{i18n.t('vehicle.compatibleNote')}
					</p>
				</div>

				<p class="mb-3 text-[11px] font-semibold tracking-wide text-muted">
					{i18n.t('vehicle.chooseLed')}
				</p>
				{#if panelProducts.length === 0}
					<p class="text-sm text-muted">{i18n.t('vehicle.comingSoon')}</p>
				{:else}
					<div class="space-y-3">
						{#each panelProducts as product (product.id)}
							<ProductCard {product} {vehicleLabel} />
						{/each}
					</div>
				{/if}
			{/if}
		</aside>
	</section>
{:else}
	<section class="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
		<div
			class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-blue-glow"
		>
			<Icon name="pin" class="h-7 w-7" />
		</div>
		<p class="font-semibold text-white">{i18n.t('vehicle.selectYourVehicle')}</p>
		<p class="mt-1 text-sm text-muted">{i18n.t('vehicle.selectVehicleHint')}</p>
	</section>
{/if}

<section
	class="mx-auto grid max-w-7xl gap-6 border-t border-white/5 px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8"
>
	{#each perks as [icon, name] (name)}
		<div class="flex items-start gap-3">
			<div
				class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue/20 bg-blue/10 text-blue-glow"
			>
				<Icon name={icon} class="h-5 w-5" />
			</div>
			<div>
				<p class="text-sm font-semibold text-white">{i18n.t(`vehicle.perk${name}Title`)}</p>
				<p class="mt-0.5 text-xs text-muted">
					{i18n.t(`vehicle.perk${name}Body`)}
					{#if name === 'Install'}
						<a href="/installation" class="text-blue-glow hover:text-white"
							>{i18n.t('vehicle.perkInstallCta')}</a
						>
					{/if}
				</p>
			</div>
		</div>
	{/each}
</section>
