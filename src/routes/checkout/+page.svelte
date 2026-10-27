<script lang="ts">
	import { enhance } from '$app/forms';
	import { categoryIcon } from '#lib/category-icons.ts';
	import Icon from '#lib/components/Icon.svelte';
	import ProductThumb from '#lib/components/ProductThumb.svelte';
	import { currency } from '#lib/format.ts';
	import { getI18n } from '#lib/state/i18n.svelte.ts';
	import type { SimulateOutcome } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = getI18n();

	// Step 1 estimate only — the server computes the real shipping and total
	// when it creates the order, and step 2 shows those.
	const FREE_SHIPPING_MIN = 75;
	const FLAT_SHIPPING = 9.99;
	const estimatedShipping = (subtotal: number) =>
		subtotal >= FREE_SHIPPING_MIN ? 0 : FLAT_SHIPPING;

	const step = $derived(data.confirmedOrder ? 3 : data.pendingOrder ? 2 : 1);
	const cart = $derived(data.cart);
	const shippingEstimate = $derived(estimatedShipping(cart.subtotal));

	let busy = $state(false);
	let simulateOutcome = $state<SimulateOutcome>('Succeed');

	const categoryName = (id: string) =>
		i18n.categoryLabel(id, data.categories.find((c) => c.id === id)?.name ?? id);

	const fieldClass =
		'w-full mt-1 bg-surface-2 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue';
	const labelClass = 'text-xs font-semibold text-muted';
</script>

<section class="border-b border-white/5 bg-surface/40">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<h1 class="font-display text-4xl font-bold tracking-wide">CHECKOUT</h1>
		<div class="mt-3 flex items-center gap-2 text-xs text-muted">
			<span class={step === 1 ? 'font-semibold text-blue-glow' : ''}
				>{i18n.t('checkout.breadcrumbShipping')}</span
			>
			<span>→</span>
			<span class={step === 2 ? 'font-semibold text-blue-glow' : ''}
				>{i18n.t('checkout.breadcrumbPayment')}</span
			>
			<span>→</span>
			<span class={step === 3 ? 'font-semibold text-blue-glow' : ''}
				>{i18n.t('checkout.breadcrumbConfirm')}</span
			>
		</div>
	</div>
</section>

{#if data.confirmedOrder}
	<!-- Step 3: thank you -->
	<section class="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
		<div
			class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-blue/30 bg-blue/15 text-blue-glow"
		>
			<Icon name="check" class="h-7 w-7" />
		</div>
		<h2 class="font-display text-3xl font-bold">{i18n.t('checkout.thankYou')}</h2>
		<p class="mt-2 text-sm text-muted">
			{i18n.t('checkout.orderReceivedPrefix')}
			<span class="font-semibold text-white">#{data.confirmedOrder.orderNumber}</span>
			{i18n.t('checkout.orderReceivedSuffix')}
		</p>
		<a
			href="/"
			class="mt-7 inline-block rounded-full bg-blue px-7 py-3 font-semibold transition hover:bg-blue-dark"
			>{i18n.t('checkout.backHome')}</a
		>
	</section>
{:else if data.pendingOrder}
	{@const order = data.pendingOrder}
	<!-- Step 2: payment -->
	<section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="grid gap-8 lg:grid-cols-[1fr_400px]">
			<div class="space-y-8">
				<div class="rounded-2xl border border-white/10 bg-surface p-6">
					<div class="mb-1 flex items-center justify-between">
						<h2 class="font-display text-xl font-bold tracking-wide">
							{i18n.t('checkout.orderSummaryTitle')}
						</h2>
						<span class="text-xs text-muted">#{order.orderNumber}</span>
					</div>
					<div class="mt-4 divide-y divide-white/5">
						{#each order.items as item (item.productId + (item.vehicleLabel ?? ''))}
							<div class="flex items-center justify-between py-3 text-sm">
								<span class="text-muted"
									>{item.productName}{item.vehicleLabel ? ' · ' + item.vehicleLabel : ''} · {i18n.t(
										'checkout.qtyAbbrev'
									)}
									{item.qty}</span
								>
								<span class="font-medium text-white">{currency(item.unitPrice * item.qty)}</span>
							</div>
						{/each}
					</div>
				</div>

				<form
					method="POST"
					action="?/pay"
					class="rounded-2xl border border-white/10 bg-surface p-6"
					use:enhance={({ formData }) => {
						busy = true;
						formData.set('idempotencyKey', crypto.randomUUID());
						return async ({ update }) => {
							await update({ reset: false });
							busy = false;
						};
					}}
				>
					<div class="mb-5 flex items-center justify-between">
						<h2 class="font-display text-xl font-bold tracking-wide">
							{i18n.t('checkout.paymentTitle')}
						</h2>
						<span class="flex items-center gap-1.5 text-[11px] text-muted"
							><span class="text-blue-glow"><Icon name="shield" class="h-4 w-4" /></span>
							{i18n.t('checkout.securePayment')}</span
						>
					</div>

					{#if order.allowSimulatedOutcomes}
						<div class="mb-5 rounded-xl border border-amber/30 bg-amber/10 p-4">
							<p class="mb-2 text-xs font-bold tracking-wide text-amber">
								{i18n.t('checkout.testModeBanner')}
							</p>
							<label for="simulate" class={labelClass}
								>{i18n.t('checkout.simulateOutcomeLabel')}</label
							>
							<select
								id="simulate"
								name="simulateOutcome"
								bind:value={simulateOutcome}
								class="mt-1 w-full rounded-lg border border-white/10 bg-surface-2 px-3 py-2 text-sm focus:border-blue focus:outline-none"
							>
								<option value="Succeed">{i18n.t('checkout.simulateSucceed')}</option>
								<option value="Fail">{i18n.t('checkout.simulateFail')}</option>
								<option value="Cancel">{i18n.t('checkout.simulateCancel')}</option>
							</select>
						</div>
					{/if}

					<div class="grid gap-5 sm:grid-cols-2">
						<div class="sm:col-span-2">
							<label for="card-name" class={labelClass}>{i18n.t('checkout.cardName')}</label>
							<input id="card-name" name="cardName" required type="text" class={fieldClass} />
						</div>
						<div class="sm:col-span-2">
							<label for="card-number" class={labelClass}>{i18n.t('checkout.cardNumber')}</label>
							<input
								id="card-number"
								name="cardNumber"
								required
								inputmode="numeric"
								maxlength="19"
								placeholder="0000 0000 0000 0000"
								type="text"
								class={fieldClass}
							/>
						</div>
						<div>
							<label for="card-expiry" class={labelClass}>{i18n.t('checkout.expiry')}</label>
							<input
								id="card-expiry"
								name="expiry"
								required
								placeholder={i18n.t('checkout.expiryPlaceholder')}
								type="text"
								class={fieldClass}
							/>
						</div>
						<div>
							<label for="card-cvc" class={labelClass}>CVC</label>
							<input
								id="card-cvc"
								name="cvc"
								required
								inputmode="numeric"
								maxlength="4"
								placeholder="123"
								type="text"
								class={fieldClass}
							/>
						</div>
					</div>

					{#if form?.error}
						<p class="mt-4 text-xs text-amber">{form.error}</p>
					{/if}

					<button
						type="submit"
						disabled={busy}
						class="glow-ring mt-6 w-full rounded-full bg-blue py-3.5 font-semibold transition hover:bg-blue-dark disabled:opacity-60"
					>
						{busy
							? i18n.t('checkout.processing')
							: form && 'retry' in form && form.retry
								? i18n.t('checkout.retryPayment')
								: i18n.t('checkout.payNow')}
					</button>
				</form>
			</div>

			<aside class="h-fit rounded-2xl border border-white/10 bg-surface p-6 lg:sticky lg:top-28">
				<h2 class="mb-5 font-display text-xl font-bold tracking-wide">
					{i18n.t('checkout.summaryTitle')}
				</h2>
				<div class="space-y-2 text-sm">
					<div class="flex items-center justify-between text-muted">
						<span>{i18n.t('checkout.subtotal')}</span><span class="font-medium text-white"
							>{currency(order.subtotal)}</span
						>
					</div>
					<div class="flex items-center justify-between text-muted">
						<span>{i18n.t('checkout.shippingLabel')}</span>
						<span class="font-medium text-white"
							>{order.shippingCost === 0
								? i18n.t('checkout.free')
								: currency(order.shippingCost)}</span
						>
					</div>
				</div>
				<div class="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
					<span class="font-semibold">{i18n.t('checkout.total')}</span>
					<span class="font-display text-2xl font-bold text-white">{currency(order.total)}</span>
				</div>
				<p class="mt-3 text-center text-[11px] text-muted">{i18n.t('checkout.termsNote')}</p>
			</aside>
		</div>
	</section>
{:else if cart.lines.length === 0}
	<section class="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
		<div
			class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-muted"
		>
			<Icon name="cart" class="h-7 w-7" />
		</div>
		<p class="font-semibold text-white">{i18n.t('checkout.emptyTitle')}</p>
		<p class="mt-1 mb-6 text-sm text-muted">{i18n.t('checkout.emptyBody')}</p>
		<a
			href="/products"
			class="inline-block rounded-full bg-blue px-7 py-3 font-semibold transition hover:bg-blue-dark"
			>{i18n.t('checkout.viewProducts')}</a
		>
	</section>
{:else}
	<!-- Step 1: shipping -->
	<section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<form
			method="POST"
			action="?/createOrder"
			class="grid gap-8 lg:grid-cols-[1fr_400px]"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
		>
			<input type="hidden" name="idempotencyKey" value={data.idempotencyKey} />
			<div class="space-y-8">
				<div class="rounded-2xl border border-white/10 bg-surface p-6">
					<h2 class="mb-5 font-display text-xl font-bold tracking-wide">
						{i18n.t('checkout.orderSummaryTitle')}
					</h2>
					<div class="divide-y divide-white/5">
						{#each cart.lines as line (line.key)}
							<div class="flex items-center gap-4 py-4">
								<div
									class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-surface-2 text-blue-glow"
								>
									<ProductThumb
										imageUrl={line.product.imageUrl}
										iconName={categoryIcon(line.product.category)}
										alt={line.product.name}
										iconClass="w-6 h-6"
									/>
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-semibold text-white">{line.product.name}</p>
									<p class="mt-0.5 text-xs text-muted">
										{categoryName(line.product.category)}{line.vehicleLabel
											? ' · ' + line.vehicleLabel
											: ''} · {i18n.t('checkout.qtyAbbrev')}
										{line.qty}
									</p>
								</div>
								<p class="shrink-0 text-sm font-bold text-white">{currency(line.lineTotal)}</p>
							</div>
						{/each}
					</div>
				</div>

				<div class="rounded-2xl border border-white/10 bg-surface p-6">
					<h2 class="mb-5 font-display text-xl font-bold tracking-wide">
						{i18n.t('checkout.shippingInfoTitle')}
					</h2>
					<div class="grid gap-5 sm:grid-cols-2">
						<div class="sm:col-span-2">
							<label for="s-name" class={labelClass}>{i18n.t('checkout.fullName')}</label>
							<input id="s-name" name="name" required type="text" class={fieldClass} />
						</div>
						<div>
							<label for="s-email" class={labelClass}>{i18n.t('checkout.email')}</label>
							<input
								id="s-email"
								name="email"
								required
								type="email"
								value={data.user?.email ?? ''}
								class={fieldClass}
							/>
						</div>
						<div>
							<label for="s-phone" class={labelClass}>{i18n.t('checkout.phone')}</label>
							<input id="s-phone" name="phone" required type="tel" class={fieldClass} />
						</div>
						<div class="sm:col-span-2">
							<label for="s-address" class={labelClass}>{i18n.t('checkout.address')}</label>
							<input id="s-address" name="address" required type="text" class={fieldClass} />
						</div>
						<div class="sm:col-span-2">
							<label for="s-apt" class={labelClass}>{i18n.t('checkout.aptOptional')}</label>
							<input id="s-apt" name="apt" type="text" class={fieldClass} />
						</div>
						<div>
							<label for="s-city" class={labelClass}>{i18n.t('checkout.city')}</label>
							<input id="s-city" name="city" required type="text" class={fieldClass} />
						</div>
						<div>
							<label for="s-state" class={labelClass}>{i18n.t('checkout.state')}</label>
							<input id="s-state" name="state" required type="text" class={fieldClass} />
						</div>
						<div>
							<label for="s-zip" class={labelClass}>{i18n.t('checkout.zip')}</label>
							<input id="s-zip" name="zip" required type="text" class={fieldClass} />
						</div>
						<div>
							<label for="s-country" class={labelClass}>{i18n.t('checkout.country')}</label>
							<select id="s-country" name="country" required class={fieldClass}>
								<option>Puerto Rico</option>
								<option>{i18n.t('checkout.countryUS')}</option>
							</select>
						</div>
					</div>
				</div>
			</div>

			<aside class="h-fit rounded-2xl border border-white/10 bg-surface p-6 lg:sticky lg:top-28">
				<h2 class="mb-5 font-display text-xl font-bold tracking-wide">
					{i18n.t('checkout.summaryTitle')}
				</h2>
				<div class="space-y-2 text-sm">
					<div class="flex items-center justify-between text-muted">
						<span>{i18n.t('checkout.subtotal')}</span><span class="font-medium text-white"
							>{currency(cart.subtotal)}</span
						>
					</div>
					<div class="flex items-center justify-between text-muted">
						<span>{i18n.t('checkout.shippingLabel')}</span>
						<span class="font-medium text-white"
							>{shippingEstimate === 0 ? i18n.t('checkout.free') : currency(shippingEstimate)}</span
						>
					</div>
				</div>
				<div class="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
					<span class="font-semibold">{i18n.t('checkout.total')}</span>
					<span class="font-display text-2xl font-bold text-white"
						>{currency(cart.subtotal + shippingEstimate)}</span
					>
				</div>
				<p class="mt-2 text-[11px] text-blue-glow">
					{shippingEstimate === 0
						? i18n.t('checkout.freeShippingQualify')
						: i18n.t('checkout.freeShippingAdd', {
								amount: (FREE_SHIPPING_MIN - cart.subtotal).toFixed(2)
							})}
				</p>
				{#if form?.error}
					<p class="mt-3 text-xs text-amber">{form.error}</p>
				{/if}
				<button
					type="submit"
					disabled={busy}
					class="glow-ring mt-6 w-full rounded-full bg-blue py-3.5 font-semibold transition hover:bg-blue-dark disabled:opacity-60"
				>
					{busy ? i18n.t('checkout.processing') : i18n.t('checkout.continueToPayment')}
				</button>
				<p class="mt-3 text-center text-[11px] text-muted">{i18n.t('checkout.termsNote')}</p>
			</aside>
		</form>
	</section>
{/if}
