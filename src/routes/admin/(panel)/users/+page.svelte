<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { errorOf, postAction } from '#lib/actions.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import SortHeader from '#lib/components/SortHeader.svelte';
	import { dateOnly } from '#lib/format.ts';
	import { toast } from '#lib/state/ui.svelte.ts';
	import { Table } from '#lib/table.svelte.ts';
	import type { AdminUser } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let roleFilter = $state<'' | 'admin' | 'customer'>('');
	const table = new Table<AdminUser>({
		rows: () => data.users,
		filter: (u) =>
			roleFilter === 'admin' ? u.isAdmin : roleFilter === 'customer' ? !u.isAdmin : true,
		searchFields: [(u) => u.fullName, (u) => u.email],
		sorters: {
			name: (a, b) => a.fullName.localeCompare(b.fullName),
			email: (a, b) => a.email.localeCompare(b.email),
			createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt)
		},
		sortKey: 'createdAt',
		sortDir: 'desc'
	});

	const isSelf = (user: AdminUser) => data.user?.id === user.id;

	async function toggleAdmin(user: AdminUser) {
		const result = await postAction('?/setAdmin', { id: user.id, isAdmin: !user.isAdmin });
		const error = errorOf(result, 'No se pudo actualizar el usuario.');
		if (error) toast.show(error);
		await refreshAll();
	}

	async function remove(user: AdminUser) {
		if (!confirm(`¿Eliminar la cuenta de "${user.fullName}"?`)) return;
		const result = await postAction('?/delete', { id: user.id });
		toast.show(errorOf(result, 'No se pudo eliminar el usuario.') ?? 'Usuario eliminado.');
		await refreshAll();
	}
</script>

<h1 class="mb-6 font-display text-3xl font-bold tracking-wide text-white">USUARIOS</h1>

<div class="mb-4 flex flex-wrap items-center gap-3">
	<div class="relative min-w-50 flex-1">
		<Icon name="search" class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
		<input
			type="text"
			placeholder="Buscar por nombre o correo…"
			bind:value={table.search}
			class="w-full rounded-lg border border-white/10 bg-surface py-2 pr-3 pl-9 text-sm focus:border-blue focus:outline-none"
		/>
	</div>
	<select
		bind:value={roleFilter}
		onchange={() => (table.page = 1)}
		aria-label="Rol"
		class="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm focus:border-blue focus:outline-none"
	>
		<option value="">Todos los roles</option>
		<option value="admin">Solo admins</option>
		<option value="customer">Solo clientes</option>
	</select>
</div>

<div class="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-white/10 text-left text-xs text-muted">
				<SortHeader
					key="name"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Nombre</SortHeader
				>
				<SortHeader
					key="email"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Correo</SortHeader
				>
				<SortHeader
					key="createdAt"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Cliente desde</SortHeader
				>
				<th class="px-4 py-3 font-semibold">Rol</th>
				<th class="px-4 py-3 font-semibold"></th>
			</tr>
		</thead>
		<tbody>
			{#each table.pageItems as user (user.id)}
				<tr class="border-b border-white/5 hover:bg-white/3">
					<td class="px-4 py-3 font-medium text-white"
						>{user.fullName}
						{#if isSelf(user)}<span class="text-[10px] text-muted">(tú)</span>{/if}</td
					>
					<td class="px-4 py-3 whitespace-nowrap text-muted">{user.email}</td>
					<td class="px-4 py-3 whitespace-nowrap text-muted">{dateOnly(user.createdAt)}</td>
					<td class="px-4 py-3 whitespace-nowrap">
						{#if user.isAdmin}
							<span
								class="rounded-full border border-blue/30 bg-blue/15 px-2 py-1 text-[10px] font-bold tracking-wide text-blue-glow"
								>ADMIN</span
							>
						{:else}
							<span
								class="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold tracking-wide text-muted"
								>CLIENTE</span
							>
						{/if}
					</td>
					<td class="px-4 py-3 text-right whitespace-nowrap">
						<button
							class="px-2 py-1 text-xs text-muted hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
							disabled={isSelf(user) && user.isAdmin}
							onclick={() => toggleAdmin(user)}
							>{user.isAdmin ? 'Quitar admin' : 'Hacer admin'}</button
						>
						<button
							class="p-1.5 text-muted hover:text-amber disabled:cursor-not-allowed disabled:opacity-30"
							aria-label="Eliminar"
							disabled={isSelf(user)}
							onclick={() => remove(user)}><Icon name="trash" class="h-4 w-4" /></button
						>
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
