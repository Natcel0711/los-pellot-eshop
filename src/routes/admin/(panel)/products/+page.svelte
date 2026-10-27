<script lang="ts">
	import { enhance } from '$app/forms';
	import { refreshAll } from '$app/navigation';
	import { enhanceWith, errorOf, isOk, postAction } from '#lib/actions.ts';
	import { categoryIcon } from '#lib/category-icons.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import ProductThumb from '#lib/components/ProductThumb.svelte';
	import SortHeader from '#lib/components/SortHeader.svelte';
	import { currency } from '#lib/format.ts';
	import { toast } from '#lib/state/ui.svelte.ts';
	import { Table } from '#lib/table.svelte.ts';
	import type { AdminProduct } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
	const badgeOptions = ['', 'Best Seller', 'Sale', 'New'];

	// The form: closed, creating a new product, or editing one (by id).
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	const editing = $derived(data.products.find((p) => p.id === editingId) ?? null);
	let error = $state<string | null>(null);
	let uploadingImage = $state(false);
	let imageError = $state<string | null>(null);

	let categoryFilter = $state('');
	const table = new Table<AdminProduct>({
		rows: () => data.products,
		filter: (p) => !categoryFilter || p.categoryId === categoryFilter,
		searchFields: [(p) => p.id, (p) => p.name],
		sorters: {
			id: (a, b) => a.id.localeCompare(b.id),
			name: (a, b) => a.name.localeCompare(b.name),
			category: (a, b) => a.categoryId.localeCompare(b.categoryId),
			price: (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price),
			stock: (a, b) => a.stockQuantity - b.stockQuantity
		},
		sortKey: 'id'
	});

	const categoryName = (id: string) => data.adminCategories.find((c) => c.id === id)?.name ?? id;

	function openForm(product: AdminProduct | null) {
		editingId = product?.id ?? null;
		error = null;
		imageError = null;
		showForm = true;
	}

	async function onImageSelected(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		const file = input.files?.[0];
		input.value = ''; // allow re-selecting the same file later
		if (!file || !editing) return;
		if (file.size > MAX_IMAGE_BYTES) {
			imageError = 'La imagen no puede pesar más de 5 MB.';
			return;
		}
		imageError = null;
		uploadingImage = true;
		const result = await postAction('?/uploadImage', { id: editing.id, file });
		uploadingImage = false;
		imageError = errorOf(result, 'No se pudo subir la imagen.');
		await refreshAll();
	}

	async function removeImage() {
		if (!editing || !confirm('¿Quitar la foto de este producto?')) return;
		const result = await postAction('?/removeImage', { id: editing.id });
		if (!isOk(result)) toast.show('No se pudo quitar la imagen.');
		await refreshAll();
	}

	async function remove(product: AdminProduct) {
		if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
		const result = await postAction('?/delete', { id: product.id });
		toast.show(!isOk(result) ? 'No se pudo eliminar el producto.' : 'Producto eliminado.');
		if (editingId === product.id) showForm = false;
		await refreshAll();
	}

	const inputClass =
		'w-full mt-1 bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue';
	const labelClass = 'text-xs font-semibold text-muted';
</script>

<div class="mb-6 flex items-center justify-between">
	<h1 class="font-display text-3xl font-bold tracking-wide text-white">PRODUCTOS</h1>
	<button
		class="flex items-center gap-2 rounded-full bg-blue px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-dark"
		onclick={() => openForm(null)}
	>
		<Icon name="plus" class="h-4 w-4" /> Nuevo producto
	</button>
</div>

{#if showForm}
	<div class="mb-6 rounded-2xl border border-white/10 bg-surface p-6">
		<h2 class="mb-4 font-display text-lg font-bold text-white">
			{editing ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
		</h2>

		{#if editing}
			<div class="mb-5 flex items-center gap-4 border-b border-white/10 pb-5">
				<div
					class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-surface-2 text-blue-glow"
				>
					<ProductThumb
						imageUrl={editing.imageUrl}
						iconName={categoryIcon(editing.categoryId)}
						alt={editing.name}
						iconClass="w-9 h-9"
					/>
				</div>
				<div>
					<p class="mb-2 text-xs font-semibold text-muted">FOTO DEL PRODUCTO</p>
					<div class="flex items-center gap-3">
						<label
							class="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-xs font-semibold transition hover:border-white/30"
						>
							{uploadingImage ? 'Subiendo…' : editing.imageUrl ? 'Cambiar foto' : 'Subir foto'}
							<input
								type="file"
								accept="image/jpeg,image/png,image/webp,image/gif"
								class="hidden"
								disabled={uploadingImage}
								onchange={onImageSelected}
							/>
						</label>
						{#if editing.imageUrl}
							<button
								type="button"
								class="text-xs text-muted transition hover:text-amber"
								onclick={removeImage}>Quitar</button
							>
						{/if}
					</div>
					{#if imageError}
						<p class="mt-2 text-xs text-amber">{imageError}</p>
					{/if}
				</div>
			</div>
		{:else}
			<p class="mb-5 border-b border-white/10 pb-5 text-xs text-muted">
				Guarda el producto para poder subirle una foto.
			</p>
		{/if}

		{#key editingId}
			<form
				method="POST"
				action="?/save"
				class="grid gap-4 sm:grid-cols-3"
				use:enhance={enhanceWith(async (result) => {
					error = errorOf(result, 'No se pudo guardar el producto.');
					if (error || result.type !== 'success') return;
					toast.show(result.data?.created ? 'Producto creado.' : 'Producto actualizado.');
					await refreshAll();
					editingId = String(result.data?.savedId);
				})}
			>
				<input type="hidden" name="mode" value={editing ? 'update' : 'create'} />
				<div>
					<label for="p-id" class={labelClass}>Id</label>
					<input
						id="p-id"
						name="id"
						required
						value={editing?.id ?? ''}
						readonly={!!editing}
						class="{inputClass} read-only:opacity-60"
					/>
				</div>
				<div class="sm:col-span-2">
					<label for="p-name" class={labelClass}>Nombre</label>
					<input id="p-name" name="name" required value={editing?.name ?? ''} class={inputClass} />
				</div>
				<div>
					<label for="p-cat" class={labelClass}>Categoría</label>
					<select id="p-cat" name="categoryId" required class={inputClass}>
						{#each data.adminCategories as c (c.id)}
							<option value={c.id} selected={c.id === editing?.categoryId}>{c.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label for="p-price" class={labelClass}>Precio</label>
					<input
						id="p-price"
						name="price"
						type="number"
						step="0.01"
						min="0"
						required
						value={editing?.price ?? ''}
						class={inputClass}
					/>
				</div>
				<div>
					<label for="p-sale" class={labelClass}>Precio de oferta (opcional)</label>
					<input
						id="p-sale"
						name="salePrice"
						type="number"
						step="0.01"
						min="0"
						value={editing?.salePrice ?? ''}
						class={inputClass}
					/>
				</div>
				<div>
					<label for="p-lumens" class={labelClass}>Lúmenes</label>
					<input id="p-lumens" name="lumens" value={editing?.lumens ?? ''} class={inputClass} />
				</div>
				<div>
					<label for="p-warranty" class={labelClass}>Garantía</label>
					<input
						id="p-warranty"
						name="warranty"
						value={editing?.warranty ?? ''}
						class={inputClass}
					/>
				</div>
				<div>
					<label for="p-badge" class={labelClass}>Insignia (opcional)</label>
					<select id="p-badge" name="badge" class={inputClass}>
						{#each badgeOptions as option (option)}
							<option value={option} selected={option === (editing?.badge ?? '')}
								>{option || 'Sin insignia'}</option
							>
						{/each}
					</select>
				</div>
				<div>
					<label for="p-stock" class={labelClass}>Inventario</label>
					<input
						id="p-stock"
						name="stockQuantity"
						type="number"
						min="0"
						required
						value={editing?.stockQuantity ?? 0}
						class={inputClass}
					/>
				</div>
				<label class="mt-6 flex items-center gap-2 text-sm text-muted">
					<input
						name="isUniversal"
						type="checkbox"
						checked={editing?.isUniversal ?? false}
						class="h-4 w-4 rounded accent-blue"
					/>
					Universal (compatible con todo vehículo)
				</label>

				{#if error}
					<p class="text-xs text-amber sm:col-span-3">{error}</p>
				{/if}

				<div class="mt-2 flex gap-3 sm:col-span-3">
					<button
						type="submit"
						class="rounded-full bg-blue px-6 py-2.5 text-sm font-semibold transition hover:bg-blue-dark"
						>Guardar</button
					>
					<button
						type="button"
						onclick={() => (showForm = false)}
						class="rounded-full border border-white/15 px-6 py-2.5 text-sm font-semibold transition hover:border-white/30"
						>Cancelar</button
					>
				</div>
			</form>
		{/key}
	</div>
{/if}

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
	<select
		bind:value={categoryFilter}
		onchange={() => (table.page = 1)}
		aria-label="Categoría"
		class="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm focus:border-blue focus:outline-none"
	>
		<option value="">Todas las categorías</option>
		{#each data.adminCategories as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
	</select>
</div>

<div class="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-white/10 text-left text-xs text-muted">
				<th class="px-4 py-3 font-semibold"></th>
				<SortHeader
					key="id"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Id</SortHeader
				>
				<SortHeader
					key="name"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Nombre</SortHeader
				>
				<SortHeader
					key="category"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Categoría</SortHeader
				>
				<SortHeader
					key="price"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Precio</SortHeader
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
					<td class="px-4 py-3 whitespace-nowrap text-muted">{product.id}</td>
					<td class="px-4 py-3 font-medium text-white">{product.name}</td>
					<td class="px-4 py-3 whitespace-nowrap text-muted">{categoryName(product.categoryId)}</td>
					<td class="px-4 py-3 whitespace-nowrap">
						{currency(product.price)}
						{#if product.salePrice}
							<span class="ml-1 text-xs text-amber">({currency(product.salePrice)})</span>
						{/if}
					</td>
					<td class="px-4 py-3 whitespace-nowrap {product.stockQuantity < 10 ? 'text-amber' : ''}"
						>{product.stockQuantity}</td
					>
					<td class="px-4 py-3 text-right whitespace-nowrap">
						<button
							class="p-1.5 text-muted hover:text-white"
							aria-label="Editar"
							onclick={() => openForm(product)}><Icon name="wrench" class="h-4 w-4" /></button
						>
						<button
							class="p-1.5 text-muted hover:text-amber"
							aria-label="Eliminar"
							onclick={() => remove(product)}><Icon name="trash" class="h-4 w-4" /></button
						>
					</td>
				</tr>
			{:else}
				<tr><td colspan="7" class="px-4 py-8 text-center text-muted">Sin resultados.</td></tr>
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
