<script lang="ts">
	import { enhance } from '$app/forms';
	import { refreshAll } from '$app/navigation';
	import { enhanceWith, errorOf, postAction } from '#lib/actions.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import SortHeader from '#lib/components/SortHeader.svelte';
	import { toast } from '#lib/state/ui.svelte.ts';
	import { Table } from '#lib/table.svelte.ts';
	import type { AdminCategory } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let showForm = $state(false);
	let editing = $state<AdminCategory | null>(null);
	let error = $state<string | null>(null);

	const table = new Table<AdminCategory>({
		rows: () => data.adminCategories,
		searchFields: [(c) => c.id, (c) => c.name],
		sorters: {
			sortOrder: (a, b) => a.sortOrder - b.sortOrder,
			id: (a, b) => a.id.localeCompare(b.id),
			name: (a, b) => a.name.localeCompare(b.name)
		},
		sortKey: 'sortOrder'
	});

	function openForm(category: AdminCategory | null) {
		editing = category;
		error = null;
		showForm = true;
	}

	async function remove(category: AdminCategory) {
		if (!confirm(`¿Eliminar "${category.name}"?`)) return;
		const result = await postAction('?/delete', { id: category.id });
		toast.show(errorOf(result, 'No se pudo eliminar la categoría.') ?? 'Categoría eliminada.');
		await refreshAll();
	}

	const inputClass =
		'w-full mt-1 bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue';
</script>

<div class="mb-6 flex items-center justify-between">
	<h1 class="font-display text-3xl font-bold tracking-wide text-white">CATEGORÍAS</h1>
	<button
		class="flex items-center gap-2 rounded-full bg-blue px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-dark"
		onclick={() => openForm(null)}
	>
		<Icon name="plus" class="h-4 w-4" /> Nueva categoría
	</button>
</div>

{#if showForm}
	<div class="mb-6 rounded-2xl border border-white/10 bg-surface p-6">
		<h2 class="mb-4 font-display text-lg font-bold text-white">
			{editing ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA'}
		</h2>
		{#key editing}
			<form
				method="POST"
				action="?/save"
				class="grid gap-4 sm:grid-cols-2"
				use:enhance={enhanceWith(async (result) => {
					error = errorOf(result, 'No se pudo guardar la categoría.');
					if (error) return;
					toast.show(editing ? 'Categoría actualizada.' : 'Categoría creada.');
					showForm = false;
					await refreshAll();
				})}
			>
				<input type="hidden" name="mode" value={editing ? 'update' : 'create'} />
				<div>
					<label for="c-id" class="text-xs font-semibold text-muted">Id</label>
					<input
						id="c-id"
						name="id"
						required
						value={editing?.id ?? ''}
						readonly={!!editing}
						class="{inputClass} read-only:opacity-60"
					/>
				</div>
				<div>
					<label for="c-name" class="text-xs font-semibold text-muted">Nombre</label>
					<input id="c-name" name="name" required value={editing?.name ?? ''} class={inputClass} />
				</div>
				<div>
					<label for="c-icon" class="text-xs font-semibold text-muted">Ícono (nombre)</label>
					<input
						id="c-icon"
						name="iconName"
						required
						value={editing?.iconName ?? ''}
						placeholder="headlight, bolt, cart…"
						class={inputClass}
					/>
				</div>
				<div>
					<label for="c-bulb" class="text-xs font-semibold text-muted">Bombilla por defecto</label>
					<input
						id="c-bulb"
						name="defaultBulbType"
						required
						value={editing?.defaultBulbType ?? ''}
						class={inputClass}
					/>
				</div>
				<div>
					<label for="c-order" class="text-xs font-semibold text-muted">Orden</label>
					<input
						id="c-order"
						name="sortOrder"
						type="number"
						required
						value={editing?.sortOrder ?? 0}
						class={inputClass}
					/>
				</div>

				{#if error}
					<p class="text-xs text-amber sm:col-span-2">{error}</p>
				{/if}

				<div class="mt-2 flex gap-3 sm:col-span-2">
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
</div>

<div class="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-white/10 text-left text-xs text-muted">
				<SortHeader
					key="sortOrder"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Orden</SortHeader
				>
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
				<th class="px-4 py-3 font-semibold">Ícono</th>
				<th class="px-4 py-3 font-semibold">Bombilla</th>
				<th class="px-4 py-3 font-semibold"></th>
			</tr>
		</thead>
		<tbody>
			{#each table.pageItems as category (category.id)}
				<tr class="border-b border-white/5 hover:bg-white/3">
					<td class="px-4 py-3 text-muted">{category.sortOrder}</td>
					<td class="px-4 py-3 whitespace-nowrap text-muted">{category.id}</td>
					<td class="px-4 py-3 font-medium text-white">
						<span class="inline-flex items-center gap-2"
							><Icon name={category.iconName} class="h-4 w-4 text-blue-glow" />
							{category.name}</span
						>
					</td>
					<td class="px-4 py-3 whitespace-nowrap text-muted">{category.iconName}</td>
					<td class="px-4 py-3 whitespace-nowrap text-muted">{category.defaultBulbType}</td>
					<td class="px-4 py-3 text-right whitespace-nowrap">
						<button
							class="p-1.5 text-muted hover:text-white"
							aria-label="Editar"
							onclick={() => openForm(category)}><Icon name="wrench" class="h-4 w-4" /></button
						>
						<button
							class="p-1.5 text-muted hover:text-amber"
							aria-label="Eliminar"
							onclick={() => remove(category)}><Icon name="trash" class="h-4 w-4" /></button
						>
					</td>
				</tr>
			{:else}
				<tr><td colspan="6" class="px-4 py-8 text-center text-muted">Sin resultados.</td></tr>
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
