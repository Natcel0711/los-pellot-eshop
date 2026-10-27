<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { postAction } from '#lib/actions.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import { dateTime, dateTimeShort } from '#lib/format.ts';
	import { Table } from '#lib/table.svelte.ts';
	import type { AdminContactMessage } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let expandedId = $state<number | null>(null);
	let statusFilter = $state<'' | 'unhandled' | 'handled'>('');
	const table = new Table<AdminContactMessage>({
		rows: () => data.messages,
		filter: (m) =>
			statusFilter === 'handled'
				? !!m.handledAt
				: statusFilter === 'unhandled'
					? !m.handledAt
					: true,
		searchFields: [(m) => m.name, (m) => m.email, (m) => m.subject],
		sorters: {
			name: (a, b) => a.name.localeCompare(b.name),
			createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt)
		},
		sortKey: 'createdAt',
		sortDir: 'desc',
		pageSize: 8
	});

	async function markHandled(message: AdminContactMessage) {
		await postAction('?/markHandled', { id: message.id });
		await refreshAll();
	}

	async function remove(message: AdminContactMessage) {
		if (!confirm(`¿Eliminar el mensaje de "${message.name}"?`)) return;
		await postAction('?/delete', { id: message.id });
		await refreshAll();
	}
</script>

<h1 class="mb-6 font-display text-3xl font-bold tracking-wide text-white">MENSAJES DE CONTACTO</h1>

<div class="mb-4 flex flex-wrap items-center gap-3">
	<div class="relative min-w-50 flex-1">
		<Icon name="search" class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
		<input
			type="text"
			placeholder="Buscar por nombre, correo o asunto…"
			bind:value={table.search}
			class="w-full rounded-lg border border-white/10 bg-surface py-2 pr-3 pl-9 text-sm focus:border-blue focus:outline-none"
		/>
	</div>
	<select
		bind:value={statusFilter}
		onchange={() => (table.page = 1)}
		aria-label="Estado"
		class="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm focus:border-blue focus:outline-none"
	>
		<option value="">Todos</option>
		<option value="unhandled">Sin atender</option>
		<option value="handled">Atendidos</option>
	</select>
	<div class="flex items-center gap-1 text-xs text-muted">
		<span>Ordenar:</span>
		{#each [['createdAt', 'Fecha'], ['name', 'Nombre']] as [key, label] (key)}
			<button
				class="rounded-lg px-2 py-1 transition hover:bg-white/5 {table.sortKey === key
					? 'text-white'
					: ''}"
				onclick={() => table.toggleSort(key)}
				>{label}
				{#if table.sortKey === key}<Icon
						name="chevronDown"
						class="inline-block h-3 w-3 {table.sortDir === 'desc' ? 'rotate-180' : ''}"
					/>{/if}</button
			>
		{/each}
	</div>
</div>

<div class="space-y-3">
	{#each table.pageItems as message (message.id)}
		<div class="overflow-hidden rounded-2xl border border-white/10 bg-surface">
			<button
				class="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
				onclick={() => (expandedId = expandedId === message.id ? null : message.id)}
			>
				<div class="min-w-0">
					<div class="flex items-center gap-2">
						<p class="truncate font-medium text-white">{message.name}</p>
						{#if !message.handledAt}
							<span
								class="shrink-0 rounded-full border border-amber/30 bg-amber/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber"
								>NUEVO</span
							>
						{/if}
					</div>
					<p class="truncate text-xs text-muted">{message.subject} · {message.email}</p>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<span class="text-xs whitespace-nowrap text-muted"
						>{dateTimeShort(message.createdAt)}</span
					>
					<Icon
						name="chevronDown"
						class="h-4 w-4 text-muted transition {expandedId === message.id ? 'rotate-180' : ''}"
					/>
				</div>
			</button>

			{#if expandedId === message.id}
				<div class="border-t border-white/5 px-5 pt-4 pb-5">
					<p class="text-sm whitespace-pre-wrap text-muted">{message.message}</p>
					{#if message.phone}
						<p class="mt-2 text-xs text-muted">Tel: {message.phone}</p>
					{/if}
					<div class="mt-4 flex gap-3">
						{#if !message.handledAt}
							<button
								class="text-xs text-blue-glow transition hover:text-white"
								onclick={() => markHandled(message)}>Marcar como atendido</button
							>
						{:else}
							<span class="text-xs text-muted">Atendido {dateTime(message.handledAt)}</span>
						{/if}
						<button
							class="flex items-center gap-1 text-xs text-muted transition hover:text-amber"
							onclick={() => remove(message)}
						>
							<Icon name="trash" class="h-3.5 w-3.5" /> Eliminar
						</button>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<p class="text-sm text-muted">Sin resultados.</p>
	{/each}
</div>

<div class="mt-3 rounded-2xl border border-white/10 bg-surface">
	<Pagination
		bind:page={table.page}
		totalPages={table.pageCount}
		totalItems={table.filtered.length}
		pageSize={table.pageSize}
	/>
</div>
