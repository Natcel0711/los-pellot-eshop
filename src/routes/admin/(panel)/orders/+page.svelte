<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { isOk, postAction } from '#lib/actions.ts';
	import Icon from '#lib/components/Icon.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import SortHeader from '#lib/components/SortHeader.svelte';
	import { currency, dateTime } from '#lib/format.ts';
	import { toast } from '#lib/state/ui.svelte.ts';
	import { Table } from '#lib/table.svelte.ts';
	import { ORDER_STATUS_FILTERS, ORDER_STATUS_OPTIONS, type AdminOrder } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let statusFilter = $state('');
	const table = new Table<AdminOrder>({
		rows: () => data.orders,
		filter: (o) => !statusFilter || o.status === statusFilter,
		searchFields: [(o) => o.orderNumber, (o) => o.customerName, (o) => o.customerEmail],
		sorters: {
			orderNumber: (a, b) => a.orderNumber.localeCompare(b.orderNumber),
			customer: (a, b) => a.customerName.localeCompare(b.customerName),
			total: (a, b) => a.total - b.total,
			createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt)
		},
		sortKey: 'createdAt',
		sortDir: 'desc'
	});

	async function updateStatus(order: AdminOrder, status: string) {
		if (status === order.status) return;
		const result = await postAction('?/setStatus', { orderNumber: order.orderNumber, status });
		if (!isOk(result)) toast.show('No se pudo actualizar el estado de la orden.');
		await refreshAll();
	}

	function paymentBadge(status: string) {
		if (status === 'Paid') return 'bg-blue/15 border-blue/30 text-blue-glow';
		if (status === 'Pending' || status === 'Processing')
			return 'bg-amber/15 border-amber/30 text-amber';
		if (status === 'Failed') return 'bg-white/5 border-white/10 text-amber';
		return 'bg-white/5 border-white/10 text-muted';
	}
</script>

<h1 class="mb-6 font-display text-3xl font-bold tracking-wide text-white">ÓRDENES</h1>

<div class="mb-4 flex flex-wrap items-center gap-3">
	<div class="relative min-w-50 flex-1">
		<Icon name="search" class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
		<input
			type="text"
			placeholder="Buscar por orden, cliente o correo…"
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
		{#each ORDER_STATUS_FILTERS as status (status)}<option value={status}>{status}</option>{/each}
	</select>
</div>

<div class="overflow-x-auto rounded-2xl border border-white/10 bg-surface">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-white/10 text-left text-xs text-muted">
				<SortHeader
					key="orderNumber"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Orden</SortHeader
				>
				<SortHeader
					key="customer"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Cliente</SortHeader
				>
				<th class="px-4 py-3 font-semibold">Artículos</th>
				<SortHeader
					key="total"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Total</SortHeader
				>
				<SortHeader
					key="createdAt"
					sortKey={table.sortKey}
					sortDir={table.sortDir}
					onsort={table.toggleSort}>Fecha</SortHeader
				>
				<th class="px-4 py-3 font-semibold">Pago</th>
				<th class="px-4 py-3 font-semibold">Estado</th>
				<th class="px-4 py-3 font-semibold"></th>
			</tr>
		</thead>
		<tbody>
			{#each table.pageItems as order (order.orderNumber)}
				<tr class="border-b border-white/5 hover:bg-white/3">
					<td class="px-4 py-3 font-medium whitespace-nowrap text-white">#{order.orderNumber}</td>
					<td class="px-4 py-3 whitespace-nowrap">
						<p class="text-white">{order.customerName}</p>
						<p class="text-xs text-muted">
							{order.customerEmail}
							{#if order.isGuest}<span class="text-amber">· invitado</span>{/if}
						</p>
					</td>
					<td class="px-4 py-3 text-muted">{order.itemCount}</td>
					<td class="px-4 py-3 font-medium whitespace-nowrap text-white">{currency(order.total)}</td
					>
					<td class="px-4 py-3 whitespace-nowrap text-muted">{dateTime(order.createdAt)}</td>
					<td class="px-4 py-3">
						<span
							class="rounded-full border px-2 py-1 text-xs font-semibold whitespace-nowrap {paymentBadge(
								order.paymentStatus
							)}">{order.paymentStatus}</span
						>
					</td>
					<td class="px-4 py-3">
						{#if order.status === 'PendingPayment'}
							<span class="text-xs whitespace-nowrap text-muted">Pendiente de pago</span>
						{:else}
							<select
								value={order.status}
								aria-label="Estado"
								onchange={(e) => updateStatus(order, e.currentTarget.value)}
								class="rounded-lg border border-white/10 bg-surface-2 px-2 py-1.5 text-xs focus:border-blue focus:outline-none"
							>
								{#each ORDER_STATUS_OPTIONS as status (status)}<option value={status}
										>{status}</option
									>{/each}
							</select>
						{/if}
					</td>
					<td class="px-4 py-3 text-right whitespace-nowrap">
						<a
							href="/admin/orders/{order.orderNumber}/label"
							target="_blank"
							aria-label="Ver etiqueta de envío"
							title="Etiqueta de envío"
							class="inline-flex p-1.5 text-muted hover:text-white"
							><Icon name="truck" class="h-4 w-4" /></a
						>
					</td>
				</tr>
			{:else}
				<tr><td colspan="8" class="px-4 py-8 text-center text-muted">Sin resultados.</td></tr>
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
