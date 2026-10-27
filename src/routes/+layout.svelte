<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import AccountModal from '#lib/components/layout/AccountModal.svelte';
	import CartDrawer from '#lib/components/layout/CartDrawer.svelte';
	import Footer from '#lib/components/layout/Footer.svelte';
	import Header from '#lib/components/layout/Header.svelte';
	import LoadingBar from '#lib/components/layout/LoadingBar.svelte';
	import ToastHost from '#lib/components/layout/ToastHost.svelte';
	import { I18n, setI18n } from '#lib/state/i18n.svelte.ts';
	import { ui } from '#lib/state/ui.svelte.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// One language state per page render (see i18n.svelte.ts).
	// svelte-ignore state_referenced_locally
	setI18n(new I18n(data.lang));

	// The admin panel has its own layout — hide the shop's header, footer and cart.
	const isAdminRoute = $derived(
		page.url.pathname === '/admin' || page.url.pathname.startsWith('/admin/')
	);

	// "/?login" (used when a page needs an account) opens the login modal.
	$effect(() => {
		if (page.url.searchParams.has('login') && !data.user) ui.openAccountModal('login');
	});
</script>

<svelte:head>
	<title>Los Pellot LED and Accessories Distributors</title>
</svelte:head>

<LoadingBar />
{#if !isAdminRoute}
	<Header />
{/if}
{@render children()}
{#if !isAdminRoute}
	<Footer />
	<CartDrawer />
{/if}
<AccountModal />
<ToastHost />
