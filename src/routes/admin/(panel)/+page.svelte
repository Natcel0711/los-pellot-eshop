<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const d = $derived(data.dashboard);

	// [link, icon, value, label, highlight when > 0]
	const cards = $derived([
		['/admin/products', 'headlight', d.productCount, 'Productos', false],
		['/admin/inventory', 'bar', d.lowStockCount, 'Bajo inventario (<10)', true],
		['/admin/categories', 'controller', d.categoryCount, 'Categorías', false],
		['/admin/users', 'user', d.userCount, 'Usuarios', false],
		['/admin/orders', 'cart', d.orderCount, 'Órdenes', false],
		['/admin/bookings', 'calendar', d.pendingBookingCount, 'Citas pendientes', true],
		['/admin/contact', 'mail', d.unhandledContactCount, 'Mensajes sin atender', true]
	] as const);
</script>

<h1 class="mb-6 font-display text-3xl font-bold tracking-wide text-white">
	PANEL DE ADMINISTRACIÓN
</h1>

<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
	{#each cards as [href, icon, value, label, highlight] (href)}
		<a
			{href}
			class="rounded-xl border border-white/10 bg-surface p-5 transition hover:border-blue/40"
		>
			<Icon
				name={icon}
				class="h-5 w-5 {highlight && value > 0 ? 'text-amber' : 'text-blue-glow'}"
			/>
			<p class="mt-3 font-display text-3xl font-bold text-white">{value}</p>
			<p class="mt-1 text-xs text-muted">{label}</p>
		</a>
	{/each}
</div>
