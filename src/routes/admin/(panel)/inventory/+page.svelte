<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { isOk, postAction } from '#lib/actions.ts';
	import { categoryIcon } from '#lib/category-icons.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import ProductThumb from '#lib/components/ProductThumb.svelte';
	import SortHeader from '#lib/components/SortHeader.svelte';
	import { toast } from '#lib/state/ui.svelte.ts';
	import { Table } from '#lib/table.svelte.ts';
	import type { AdminProduct } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const LOW_STOCK = 10;
	const isLow = (stock: number) => stock < LOW_STOCK;

	let onlyLowStock = $state(false);
	let savingId = $state<string | null>(null);

	const table = new Table<AdminProduct>({
		rows: () => data.products,
		filter: (p) => !onlyLowStock || isLow(p.stockQuantity),
		searchFields: [(p) => p.id, (p) => p.name],
		sorters: {
			name: (a, b) => a.name.localeCompare(b.name),
			category: (a, b) => a.categoryId.localeCompare(b.categoryId),
			stock: (a, b) => a.stockQuantity - b.stockQuantity
		},
		sortKey: 'name'
	});

	const categoryName = (id: string) => data.adminCategories.find((c) => c.id === id)?.name ?? id;

	async function saveStock(product: AdminProduct, quantity: number) {
		quantity = Math.max(0, Math.trunc(quantity) || 0);
		if (quantity === product.stockQuantity) return;
		savingId = product.id;
		const result = await postAction('?/setStock', { id: product.id, stockQuantity: quantity });
		if (!isOk(result)) toast.show('No se pudo actualizar el inventario.');
		await refreshAll();
		savingId = null;
	}

	const stepButton =
		'w-7 h-7 rounded-full bg-surface-2 border border-white/10 flex items-center justify-center text-muted hover:text-white active:bg-white/10 transition';
</script>

<h1 class="mb-6 font-display text-3xl font-bold tracking-wide text-white">INVENTARIO</h1>

<div class="mb-4 flex flex-wrap items-center gap-3">
	<div class="relative min-w-50 flex-1">
		<Icon name="search" class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
		<input
			type="text"
			placeholder="Buscar por id o nombre…"
			bind:value={table.search}
			class="w-full rounded-lg border border-white/10 bg-surface py-2 pr-3 pl-9 text-sm focus:border-blue focus:outline-none"
		/>
	</div>
	<label class="flex items-center gap-2 text-sm whitespace-nowrap text-muted">
		<input
			type="checkbox"
			bind:checked={onlyLowStock}
			onchange={() => (table.page = 1)}
			class="h-4 w-4 rounded accent-blue"
		/>
		Solo bajo inventario (&lt;10)
	</label>
</div>

<div class="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-white/10 text-left text-xs text-muted">
				<th class="px-4 py-3 font-semibold"></th>
				<SortHeader
					key="name"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Producto</SortHeader
				>
				<SortHeader
					key="category"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Categoría</SortHeader
				>
				<SortHeader
					key="stock"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Inventario</SortHeader
				>
				<th class="px-4 py-3 font-semibold"></th>
			</tr>
		</thead>
		<tbody>
			{#each table.pageItems as product (product.id)}
				<tr class="border-b border-white/5 hover:bg-white/3">
					<td class="px-4 py-3">
						<div
							class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-surface-2 text-blue-glow"
						>
							<ProductThumb
								imageUrl={product.imageUrl}
								iconName={categoryIcon(product.categoryId)}
								alt={product.name}
								iconClass="w-5 h-5"
							/>
						</div>
					</td>
					<td class="px-4 py-3">
						<p class="font-medium text-white">{product.name}</p>
						<p class="text-xs text-muted">{product.id}</p>
					</td>
					<td class="px-4 py-3 whitespace-nowrap text-muted">{categoryName(product.categoryId)}</td>
					<td class="px-4 py-3">
						<div class="flex items-center gap-2">
							<button
								class={stepButton}
								aria-label="−"
								onclick={() => saveStock(product, product.stockQuantity - 1)}
								><Icon name="minus" class="h-3.5 w-3.5" /></button
							>
							<input
								type="number"
								min="0"
								aria-label="Inventario"
								value={product.stockQuantity}
								onchange={(e) => saveStock(product, Number(e.currentTarget.value))}
								class="w-20 rounded-lg border bg-surface-2 px-2 py-1.5 text-center text-sm focus:border-blue focus:outline-none {isLow(
									product.stockQuantity
								)
									? 'border-amber text-amber'
									: 'border-white/10'}"
							/>
							<button
								class={stepButton}
								aria-label="+"
								onclick={() => saveStock(product, product.stockQuantity + 1)}
								><Icon name="plus" class="h-3.5 w-3.5" /></button
							>
							{#if savingId === product.id}
								<span class="text-xs text-muted">Guardando…</span>
							{/if}
						</div>
					</td>
					<td class="px-4 py-3 text-right">
						{#if isLow(product.stockQuantity)}
							<span
								class="rounded-full border border-amber/30 bg-amber/15 px-2 py-1 text-[10px] font-bold tracking-wide text-amber"
								>BAJO</span
							>
						{/if}
					</td>
				</tr>
			{:else}
				<tr><td colspan="5" class="px-4 py-8 text-center text-muted">Sin resultados.</td></tr>
			{/each}
		</tbody>
	</table>
	<Pagination
		bind:page={table.page}
		totalPages={table.pageCount}
		totalItems={table.filtered.length}
		pageSize={table.pageSize}
	/>
</div>
