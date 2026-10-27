<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '#lib/components/Icon.svelte';
	import { initials } from '#lib/initials.ts';
	import { getI18n } from '#lib/state/i18n.svelte.ts';
	import { ui } from '#lib/state/ui.svelte.ts';
	import { NAV_LINKS, isActive } from './nav';

	const i18n = getI18n();
	const user = $derived(page.data.user);
	const cartCount = $derived(
		(page.data.cart?.lines ?? []).reduce((n: number, l: { qty: number }) => n + l.qty, 0)
	);

	let searchInput = $state<HTMLInputElement>();

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();
		const q = searchInput?.value.trim() ?? '';
		ui.searchBarOpen = false;
		goto(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
	}

	function onAccountClick() {
		ui.openAccountModal(user ? 'profile' : 'login');
	}

	const iconButton =
		'w-9 h-9 items-center justify-center rounded-full text-muted hover:text-white hover:bg-white/5 active:bg-white/10 active:scale-90 transition';
</script>

<header class="sticky top-0 z-40 border-b border-white/5 bg-bg/90 backdrop-blur">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-20 items-center justify-between">
			<a href="/" class="flex shrink-0 items-center gap-2">
				<img
					src="/logo.png"
					alt="Los Pellot LED and Accessories Distributors"
					class="h-14 w-auto drop-shadow-[0_0_14px_rgba(47,94,255,0.35)]"
				/>
			</a>

			<nav class="hidden items-center gap-8 lg:flex">
				{#each NAV_LINKS as link (link.path)}
					{@const active = isActive(link.path, page.url.pathname)}
					<a
						href={link.path}
						class="relative py-1 text-sm font-semibold tracking-wide transition-colors {active
							? 'text-white'
							: 'text-muted hover:text-white'}"
					>
						{i18n.t(link.labelKey).toUpperCase()}
						{#if active}
							<span class="absolute right-0 -bottom-1 left-0 h-0.5 rounded-full bg-blue"></span>
						{/if}
					</a>
				{/each}
			</nav>

			<div class="flex items-center gap-4">
				<button
					class="hidden sm:flex {iconButton} text-xs font-bold tracking-wide"
					aria-label={i18n.t('header.langToggleAria')}
					title={i18n.t('header.langToggleAria')}
					onclick={() => i18n.toggle()}>{i18n.lang === 'es' ? 'EN' : 'ES'}</button
				>

				<button
					class="hidden sm:flex {iconButton}"
					aria-label={i18n.t('header.searchAria')}
					title={i18n.t('header.searchAria')}
					onclick={() => (ui.searchBarOpen = !ui.searchBarOpen)}
				>
					<Icon name="search" class="h-5 w-5" />
				</button>

				<button
					class="flex {iconButton}"
					aria-label={i18n.t('header.accountAria')}
					title={user?.fullName || i18n.t('header.accountTitleGuest')}
					onclick={onAccountClick}
				>
					{#if user}
						<span
							class="flex h-7 w-7 items-center justify-center rounded-full border border-blue/40 bg-blue/20 text-[11px] font-bold text-blue-glow"
							>{initials(user.fullName)}</span
						>
					{:else}
						<Icon name="user" class="h-5 w-5" />
					{/if}
				</button>

				<button
					class="relative flex {iconButton}"
					aria-label={i18n.t('header.cartAria')}
					onclick={() => (ui.cartDrawerOpen = true)}
				>
					<Icon name="cart" class="h-5 w-5" />
					{#if cartCount > 0}
						{#key cartCount}
							<span
								class="cart-pulse absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-blue px-1 text-[10px] font-bold text-white"
								>{cartCount}</span
							>
						{/key}
					{/if}
				</button>

				<button
					class="flex h-9 w-9 items-center justify-center rounded-full text-white transition active:scale-90 active:bg-white/10 lg:hidden"
					aria-label={i18n.t('header.menuAria')}
					onclick={() => (ui.mobileMenuOpen = !ui.mobileMenuOpen)}
				>
					<Icon name="menu" class="h-6 w-6" />
				</button>
			</div>
		</div>
	</div>

	{#if ui.searchBarOpen}
		<div class="border-t border-white/5 bg-surface">
			<div class="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
				<form class="flex items-center gap-3" onsubmit={submitSearch}>
					<span class="text-muted"><Icon name="search" class="h-5 w-5" /></span>
					<!-- svelte-ignore a11y_autofocus -->
					<input
						bind:this={searchInput}
						type="text"
						autofocus
						placeholder={i18n.t('header.searchPlaceholder')}
						class="flex-1 bg-transparent text-sm text-white placeholder-muted focus:outline-none"
					/>
				</form>
			</div>
		</div>
	{/if}

	{#if ui.mobileMenuOpen}
		<div class="border-t border-white/5 bg-surface lg:hidden">
			{#each NAV_LINKS as link (link.path)}
				<a
					href={link.path}
					onclick={() => (ui.mobileMenuOpen = false)}
					class="block border-b border-white/5 px-5 py-3 text-sm font-semibold tracking-wide transition active:bg-white/10 {isActive(
						link.path,
						page.url.pathname
					)
						? 'bg-white/5 text-white'
						: 'text-muted'}"
				>
					{i18n.t(link.labelKey).toUpperCase()}
				</a>
			{/each}
			<button
				class="w-full px-5 py-3 text-left text-sm font-semibold tracking-wide text-muted transition active:bg-white/10"
				onclick={() => i18n.toggle()}>{i18n.lang === 'es' ? 'ENGLISH' : 'ESPAÑOL'}</button
			>
		</div>
	{/if}
</header>
