<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { postAction } from '#lib/actions.ts';
	import { categoryIcon } from '#lib/category-icons.ts';
	import Icon from '#lib/components/Icon.svelte';
	import ProductThumb from '#lib/components/ProductThumb.svelte';
	import { currency } from '#lib/format.ts';
	import { getI18n } from '#lib/state/i18n.svelte.ts';
	import { ui } from '#lib/state/ui.svelte.ts';
	import type { Cart, CartLine, Category } from '#lib/types.ts';

	const i18n = getI18n();
	const cart = $derived(page.data.cart as Cart);

	function categoryName(id: string) {
		const categories = (page.data.categories ?? []) as Category[];
		return i18n.categoryLabel(id, categories.find((c) => c.id === id)?.name ?? id);
	}

	async function setQty(line: CartLine, qty: number) {
		await postAction('/cart?/setQty', { key: line.key, qty });
		await invalidate('app:cart');
	}
</script>

{#if ui.cartDrawerOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-40 bg-black/60" onclick={() => (ui.cartDrawerOpen = false)}></div>
{/if}

<aside
	id="cart-drawer"
	class="fixed top-0 right-0 z-50 flex h-full w-full flex-col border-l border-white/10 bg-surface transition-transform duration-300 sm:w-105 {ui.cartDrawerOpen
		? ''
		: 'translate-x-full'}"
>
	<div class="flex h-20 items-center justify-between border-b border-white/5 px-5">
		<h3 class="font-display text-2xl font-semibold tracking-wide text-white">
			{i18n.t('cart.title')}
		</h3>
		<button
			class="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-white/5 hover:text-white"
			aria-label={i18n.t('cart.closeAria')}
			onclick={() => (ui.cartDrawerOpen = false)}
		>
			<Icon name="close" class="h-5 w-5" />
		</button>
	</div>

	<div class="flex-1 overflow-y-auto px-5">
		{#if cart.lines.length === 0}
			<div class="flex h-full flex-col items-center justify-center py-20 text-center">
				<div
					class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-muted"
				>
					<Icon name="cart" class="h-7 w-7" />
				</div>
				<p class="mb-1 font-semibold text-white">{i18n.t('cart.emptyTitle')}</p>
				<p class="mb-5 text-sm text-muted">{i18n.t('cart.emptyBody')}</p>
				<a
					href="/products"
					onclick={() => (ui.cartDrawerOpen = false)}
					class="inline-block rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-dark"
					>{i18n.t('cart.viewProducts')}</a
				>
			</div>
		{:else}
			<div>
				{#each cart.lines as line (line.key)}
					<div class="flex gap-3 border-b border-white/5 py-4">
						<div
							class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-surface-2 text-blue-glow"
						>
							<ProductThumb
								imageUrl={line.product.imageUrl}
								iconName={categoryIcon(line.product.category)}
								alt={line.product.name}
								iconClass="w-7 h-7"
							/>
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm leading-snug font-semibold text-white">
								{line.product.name}
							</p>
							<p class="mt-0.5 text-xs text-muted">
								{categoryName(line.product.category)}{line.vehicleLabel
									? ' · ' + line.vehicleLabel
									: ''}
							</p>
							<div class="mt-2 flex items-center justify-between">
								<div
									class="flex items-center gap-2 rounded-full border border-white/10 bg-surface-2"
								>
									<button
										class="flex h-6 w-6 items-center justify-center text-muted hover:text-white"
										aria-label="−"
										onclick={() => setQty(line, line.qty - 1)}
										><Icon name="minus" class="h-3.5 w-3.5" /></button
									>
									<span class="w-4 text-center text-xs">{line.qty}</span>
									<button
										class="flex h-6 w-6 items-center justify-center text-muted hover:text-white"
										aria-label="+"
										onclick={() => setQty(line, line.qty + 1)}
										><Icon name="plus" class="h-3.5 w-3.5" /></button
									>
								</div>
								<span class="text-sm font-bold text-white">{currency(line.lineTotal)}</span>
							</div>
						</div>
						<button
							class="self-start text-muted hover:text-blue-glow"
							aria-label={i18n.t('cart.removeAria')}
							onclick={() => setQty(line, 0)}><Icon name="close" class="h-4 w-4" /></button
						>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if cart.lines.length > 0}
		<div class="space-y-3 border-t border-white/5 p-5">
			<div class="flex items-center justify-between text-sm text-muted">
				<span>{i18n.t('cart.shipping')}</span><span>{i18n.t('cart.shippingCalculated')}</span>
			</div>
			<div class="flex items-center justify-between text-lg font-bold text-white">
				<span>{i18n.t('cart.subtotal')}</span><span>{currency(cart.subtotal)}</span>
			</div>
			<a
				href="/checkout"
				onclick={() => (ui.cartDrawerOpen = false)}
				class="glow-ring block w-full rounded-full bg-blue py-3 text-center font-semibold text-white transition hover:bg-blue-dark"
				>{i18n.t('cart.checkout')}</a
			>
		</div>
	{/if}
</aside>
