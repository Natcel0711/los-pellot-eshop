<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { errorOf, postAction } from '#lib/actions.ts';
	import { categoryIcon } from '#lib/category-icons.ts';
	import { currency } from '#lib/format.ts';
	import { getI18n } from '#lib/state/i18n.svelte.ts';
	import { toast } from '#lib/state/ui.svelte.ts';
	import type { Category, Product } from '#lib/types.ts';
	import Icon from './Icon.svelte';
	import ProductThumb from './ProductThumb.svelte';

	let { product, vehicleLabel = null }: { product: Product; vehicleLabel?: string | null } =
		$props();

	const i18n = getI18n();

	const categoryName = $derived(
		i18n.categoryLabel(
			product.category,
			(page.data.categories as Category[] | undefined)?.find((c) => c.id === product.category)
				?.name ?? product.category
		)
	);
	const onSale = $derived(product.salePrice != null);
	const price = $derived(onSale ? product.salePrice! : product.price);

	function badgeClasses(badge: string | null): string {
		if (badge === 'Sale') return 'bg-amber text-black';
		if (badge === 'Best Seller') return 'bg-blue text-white';
		if (badge === 'New') return 'bg-white/90 text-black';
		return 'bg-white/10 text-white';
	}

	async function addToCart(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		const result = await postAction('/cart?/add', { productId: product.id, qty: 1, vehicleLabel });
		const error = errorOf(result, i18n.t('checkout.errorGeneric'));
		if (error) {
			toast.show(error);
			return;
		}
		await invalidate('app:cart');
		toast.show(i18n.t('productCard.addedToast', { name: product.name }));
	}
</script>

<div
	class="group glow-ring flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface transition hover:border-blue/40"
>
	<div
		class="relative flex h-36 items-center justify-center overflow-hidden bg-linear-to-br from-surface-2 to-bg sm:h-40"
	>
		{#if !product.imageUrl}
			<div class="absolute h-24 w-24 rounded-full bg-blue/25 blur-2xl"></div>
		{/if}
		<div
			class="relative flex h-full w-full items-center justify-center text-blue-glow transition group-hover:text-white"
		>
			<ProductThumb
				imageUrl={product.imageUrl}
				iconName={categoryIcon(product.category)}
				alt={product.name}
				iconClass="w-12 h-12"
			/>
		</div>
		{#if product.badge}
			<span
				class="absolute top-3 left-3 rounded-full px-2 py-1 text-[10px] font-bold tracking-wide {badgeClasses(
					product.badge
				)}"
			>
				{product.badge.toUpperCase()}
			</span>
		{/if}
	</div>
	<div class="flex flex-1 flex-col p-4">
		<p class="text-[11px] font-semibold tracking-wide text-muted uppercase">{categoryName}</p>
		<h3 class="mt-1 min-h-10 text-sm leading-snug font-semibold text-white">{product.name}</h3>
		<div class="mt-2 flex items-center gap-2 text-[11px] text-muted">
			<span>{product.lumens} {i18n.t('productCard.lumensUnit')}</span><span>·</span><span
				>{product.warranty} {i18n.t('productCard.warrantyUnit')}</span
			>
		</div>
		{#if vehicleLabel}
			<p class="mt-1 text-[11px] text-blue-glow">{i18n.t('productCard.compatible')}</p>
		{/if}
		<div class="mt-auto flex items-center justify-between pt-4">
			<div class="flex items-baseline gap-2">
				<span class="text-lg font-bold text-white">{currency(price)}</span>
				{#if onSale}
					<span class="text-xs text-muted line-through">{currency(product.price)}</span>
				{/if}
			</div>
			<button
				class="flex h-9 w-9 items-center justify-center rounded-full bg-blue transition hover:bg-blue-dark"
				aria-label={i18n.t('productCard.addToCartAria')}
				title={i18n.t('productCard.addToCartAria')}
				onclick={addToCart}
			>
				<Icon name="plus" class="h-4 w-4" />
			</button>
		</div>
	</div>
</div>
