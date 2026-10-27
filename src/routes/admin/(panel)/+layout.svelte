<!-- The admin sidebar. Lives in the (panel) group so the printable shipping
     label page (admin/orders/[orderNumber]/label) can skip it. -->
<script lang="ts">
	import { goto, refreshAll } from '$app/navigation';
	import { page } from '$app/state';
	import { postAction } from '#lib/actions.ts';
	import Icon from '#lib/components/Icon.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const navLinks = [
		{ path: '/admin', label: 'Panel', icon: 'bolt' },
		{ path: '/admin/products', label: 'Productos', icon: 'headlight' },
		{ path: '/admin/inventory', label: 'Inventario', icon: 'bar' },
		{ path: '/admin/categories', label: 'Categorías', icon: 'controller' },
		{ path: '/admin/vehicles', label: 'Vehículos', icon: 'truck' },
		{ path: '/admin/orders', label: 'Órdenes', icon: 'cart' },
		{ path: '/admin/bookings', label: 'Citas', icon: 'calendar' },
		{ path: '/admin/contact', label: 'Mensajes', icon: 'mail' },
		{ path: '/admin/users', label: 'Usuarios', icon: 'user' }
	];

	const isActive = (path: string) =>
		path === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(path);

	async function logout() {
		await postAction('/account?/logout', {});
		await goto('/');
		await refreshAll();
	}

	const linkClass =
		'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition whitespace-nowrap active:bg-white/10';
</script>

<div class="flex min-h-screen flex-col lg:flex-row">
	<aside class="shrink-0 border-b border-white/10 bg-surface lg:w-60 lg:border-r lg:border-b-0">
		<div class="border-b border-white/10 p-5">
			<p class="font-display text-lg font-bold tracking-wide text-white">ADMIN</p>
			<p class="mt-0.5 text-xs text-muted">Los Pellot LED</p>
		</div>
		<nav class="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
			{#each navLinks as link (link.path)}
				<a
					href={link.path}
					class="{linkClass} {isActive(link.path)
						? 'bg-blue/15 text-blue-glow'
						: 'text-muted hover:bg-white/5 hover:text-white'}"
				>
					<Icon name={link.icon} class="h-4 w-4" />
					{link.label}
				</a>
			{/each}
		</nav>
		<div class="mt-2 space-y-1 border-t border-white/10 p-3">
			{#if data.user}
				<p class="truncate px-3 py-1 text-xs text-muted">{data.user.fullName}</p>
			{/if}
			<a href="/" class="{linkClass} text-muted hover:bg-white/5 hover:text-white">
				<Icon name="chevronRight" class="h-4 w-4 rotate-180" />
				Volver al sitio
			</a>
			<button
				onclick={logout}
				class="w-full {linkClass} text-left text-muted hover:bg-white/5 hover:text-white"
			>
				<Icon name="close" class="h-4 w-4" />
				Cerrar sesión
			</button>
		</div>
	</aside>

	<main class="min-w-0 flex-1 p-5 lg:p-8">
		{@render children()}
	</main>
</div>
