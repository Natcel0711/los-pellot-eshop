<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import { currency, dateTime } from '#lib/format.ts';
	import { getI18n } from '#lib/state/i18n.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = getI18n();
</script>

<section class="border-b border-white/5 bg-surface/40">
	<div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
		<h1 class="font-display text-4xl font-bold tracking-wide">{i18n.t('orderHistory.title')}</h1>
		<p class="mt-2 text-sm text-muted">{i18n.t('orderHistory.subtitle')}</p>
	</div>
</section>

<section class="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
	{#if data.orders.length === 0}
		<div class="py-24 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-muted"
			>
				<Icon name="cart" class="h-7 w-7" />
			</div>
			<p class="font-semibold text-white">{i18n.t('orderHistory.emptyTitle')}</p>
			<p class="mt-1 mb-6 text-sm text-muted">{i18n.t('orderHistory.emptyBody')}</p>
			<a
				href="/products"
				class="inline-block rounded-full bg-blue px-7 py-3 font-semibold transition hover:bg-blue-dark"
				>{i18n.t('orderHistory.viewProducts')}</a
			>
		</div>
	{:else}
		<div class="space-y-5">
			{#each data.orders as order (order.orderNumber)}
				<div class="rounded-2xl border border-white/10 bg-surface p-6">
					<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
						<div>
							<p class="font-display text-lg font-bold text-white">#{order.orderNumber}</p>
							<p class="mt-0.5 text-xs text-muted">{dateTime(order.createdAt, i18n.lang)}</p>
						</div>
						<div class="flex items-center gap-2">
							<span
								class="rounded-full border border-blue/30 bg-blue/15 px-3 py-1 text-xs font-semibold text-blue-glow"
								>{order.status}</span
							>
							{#if order.paymentStatus !== 'Paid'}
								<span
									class="rounded-full border border-amber/30 bg-amber/15 px-3 py-1 text-xs font-semibold text-amber"
									>{order.paymentStatus}</span
								>
							{/if}
						</div>
					</div>
					<div class="divide-y divide-white/5">
						{#each order.items as item (item.productId + (item.vehicleLabel ?? ''))}
							<div class="flex items-center justify-between py-2 text-sm">
								<span class="text-muted">{item.productName} × {item.qty}</span>
								<span class="font-medium text-white">{currency(item.unitPrice * item.qty)}</span>
							</div>
						{/each}
					</div>
					<div class="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
						<span class="text-sm font-semibold">{i18n.t('orderHistory.total')}</span>
						<span class="font-display text-xl font-bold text-white">{currency(order.total)}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
