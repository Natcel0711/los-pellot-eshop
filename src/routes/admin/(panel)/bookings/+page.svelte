<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { isOk, postAction } from '#lib/actions.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import SortHeader from '#lib/components/SortHeader.svelte';
	import { dateOnly } from '#lib/format.ts';
	import { toast } from '#lib/state/ui.svelte.ts';
	import { Table } from '#lib/table.svelte.ts';
	import { BOOKING_STATUS_OPTIONS, type AdminBooking } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let statusFilter = $state('');
	const table = new Table<AdminBooking>({
		rows: () => data.bookings,
		filter: (b) => !statusFilter || b.status === statusFilter,
		searchFields: [(b) => b.name, (b) => b.email, (b) => b.vehicleDescription],
		sorters: {
			name: (a, b) => a.name.localeCompare(b.name),
			preferredDate: (a, b) => a.preferredDate.localeCompare(b.preferredDate),
			createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt)
		},
		sortKey: 'createdAt',
		sortDir: 'desc'
	});

	async function updateStatus(booking: AdminBooking, status: string) {
		if (status === booking.status) return;
		const result = await postAction('?/setStatus', { id: booking.id, status });
		if (!isOk(result)) toast.show('No se pudo actualizar el estado.');
		await refreshAll();
	}

	async function remove(booking: AdminBooking) {
		if (!confirm(`¿Eliminar la cita de "${booking.name}"?`)) return;
		await postAction('?/delete', { id: booking.id });
		await refreshAll();
	}
</script>

<h1 class="mb-6 font-display text-3xl font-bold tracking-wide text-white">CITAS DE INSTALACIÓN</h1>

<div class="mb-4 flex flex-wrap items-center gap-3">
	<div class="relative min-w-50 flex-1">
		<Icon name="search" class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
		<input
			type="text"
			placeholder="Buscar por nombre, correo o vehículo…"
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
		<option value="">Todos los estados</option>
		{#each BOOKING_STATUS_OPTIONS as status (status)}<option value={status}>{status}</option>{/each}
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
					onsort={table.toggleSort}>Cliente</SortHeader
				>
				<th class="px-4 py-3 font-semibold">Vehículo</th>
				<th class="px-4 py-3 font-semibold">Servicio</th>
				<SortHeader
					key="preferredDate"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Fecha preferida</SortHeader
				>
				<th class="px-4 py-3 font-semibold">Estado</th>
				<th class="px-4 py-3 font-semibold"></th>
			</tr>
		</thead>
		<tbody>
			{#each table.pageItems as booking (booking.id)}
				<tr class="border-b border-white/5 hover:bg-white/3">
					<td class="px-4 py-3 whitespace-nowrap">
						<p class="font-medium text-white">{booking.name}</p>
						<p class="text-xs text-muted">{booking.email} · {booking.phone}</p>
					</td>
					<td class="px-4 py-3 text-muted">{booking.vehicleDescription}</td>
					<td class="px-4 py-3 whitespace-nowrap text-muted">{booking.serviceType}</td>
					<td class="px-4 py-3 whitespace-nowrap text-muted">{dateOnly(booking.preferredDate)}</td>
					<td class="px-4 py-3">
						<select
							value={booking.status}
							aria-label="Estado"
							onchange={(e) => updateStatus(booking, e.currentTarget.value)}
							class="rounded-lg border border-white/10 bg-surface-2 px-2 py-1.5 text-xs focus:border-blue focus:outline-none"
						>
							{#each BOOKING_STATUS_OPTIONS as status (status)}<option value={status}
									>{status}</option
								>{/each}
						</select>
					</td>
					<td class="px-4 py-3 text-right">
						<button
							class="p-1.5 text-muted hover:text-amber"
							aria-label="Eliminar"
							onclick={() => remove(booking)}><Icon name="trash" class="h-4 w-4" /></button
						>
					</td>
				</tr>
			{:else}
				<tr><td colspan="6" class="px-4 py-8 text-center text-muted">No hay citas todavía.</td></tr>
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
