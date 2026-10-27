<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { errorOf, postAction } from '#lib/actions.ts';
	import Icon from '#lib/components/Icon.svelte';
	import { currency, dateOnly, dateTime } from '#lib/format.ts';
	import type { PackageInfo, ShippingRate } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const o = $derived(data.order);

	// What prints on the packing slip. The real street address Shippo needs
	// comes from the SHIP_FROM_* environment variables on the server.
	const shipFrom = {
		name: 'Los Pellot LED and Accessories Distributors',
		address: 'Massachusetts, USA',
		phone: '(787) 555-0142'
	};
	const printedAt = new Date().toISOString();

	let fetchingRates = $state(false);
	let ratesError = $state<string | null>(null);
	let rates = $state<ShippingRate[] | null>(null);
	let lastPackage = $state<PackageInfo | null>(null);
	let selectedRate = $state<ShippingRate | null>(null);
	let purchasing = $state(false);
	let purchaseError = $state<string | null>(null);

	async function getRates(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();
		fetchingRates = true;
		ratesError = null;
		rates = null;
		selectedRate = null;
		const result = await postAction('?/rates', new FormData(event.currentTarget));
		fetchingRates = false;
		ratesError = errorOf(result, 'No pudimos cotizar el envío.');
		if (result.type === 'success') {
			rates = result.data?.rates as ShippingRate[];
			lastPackage = result.data?.pkg as PackageInfo;
		}
	}

	async function purchase() {
		if (!selectedRate || !lastPackage) return;
		purchasing = true;
		purchaseError = null;
		const result = await postAction('?/purchase', {
			...lastPackage,
			rate: JSON.stringify(selectedRate)
		});
		purchasing = false;
		purchaseError = errorOf(result, 'No pudimos comprar la etiqueta de envío.');
		if (!purchaseError) {
			rates = null;
			selectedRate = null;
			await refreshAll();
		}
	}

	const numberInput =
		'w-full mt-1 bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue';
	const lineInput =
		'w-full mt-1 border-b border-black/40 focus:outline-none focus:border-black py-1 bg-transparent';
</script>

<div class="min-h-screen bg-bg px-4 py-6 text-white sm:px-8 print:bg-white print:p-0">
	<div class="mx-auto max-w-3xl">
		<div class="mb-6 flex items-center justify-between print:hidden">
			<a
				href="/admin/orders"
				class="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-white"
			>
				<Icon name="chevronRight" class="h-4 w-4 rotate-180" /> Volver a Órdenes
			</a>
			<button
				onclick={() => window.print()}
				class="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-dark"
				>Imprimir Etiqueta</button
			>
		</div>

		<div class="mb-8 print:hidden">
			<h2 class="mb-3 text-lg font-bold text-white">Etiqueta de Envío Real (Shippo)</h2>

			{#if o.shippingLabels.length > 0}
				<div class="mb-4 space-y-3">
					{#each o.shippingLabels as label (label.trackingNumber)}
						<div
							class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-surface p-4"
						>
							<div>
								<p class="font-semibold text-white">{label.carrier} · {label.serviceLevel}</p>
								<p class="mt-0.5 text-xs text-muted">
									Rastreo: {label.trackingNumber} · {currency(label.amount)} · {dateTime(
										label.createdAt
									)}
								</p>
							</div>
							<div class="flex items-center gap-3">
								{#if label.trackingUrlProvider}
									<a
										href={label.trackingUrlProvider}
										target="_blank"
										class="text-xs text-blue-glow transition hover:text-white">Rastrear →</a
									>
								{/if}
								<a
									href={label.labelUrl}
									target="_blank"
									class="rounded-full bg-blue px-4 py-2 text-xs font-semibold transition hover:bg-blue-dark"
									>Ver / Imprimir PDF</a
								>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<div class="rounded-xl border border-white/10 bg-surface p-5">
				<p class="mb-4 text-xs text-muted">
					Cotiza tarifas reales de USPS/UPS/FedEx (vía Shippo) para la dirección de esta orden y
					compra una etiqueta con rastreo real.
				</p>
				<form class="grid grid-cols-2 gap-3 sm:grid-cols-4" onsubmit={getRates}>
					{#each [['weightLb', 'Peso (lb)'], ['lengthIn', 'Largo (in)'], ['widthIn', 'Ancho (in)'], ['heightIn', 'Alto (in)']] as [name, label] (name)}
						<div>
							<label for="pkg-{name}" class="text-xs font-semibold text-muted">{label}</label>
							<input
								id="pkg-{name}"
								{name}
								type="number"
								step="0.1"
								min="0"
								required
								class={numberInput}
							/>
						</div>
					{/each}
					<div class="col-span-2 sm:col-span-4">
						<button
							type="submit"
							disabled={fetchingRates}
							class="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-dark disabled:opacity-60"
						>
							{fetchingRates ? 'Cotizando…' : 'Cotizar Tarifas'}
						</button>
					</div>
				</form>

				{#if ratesError}
					<p class="mt-3 text-xs text-amber">{ratesError}</p>
				{/if}

				{#if rates && rates.length > 0}
					<div class="mt-4 space-y-2">
						{#each rates as rate (rate.rateId)}
							{@const selected = selectedRate?.rateId === rate.rateId}
							<label
								class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 transition {selected
									? 'border-blue bg-blue/10'
									: 'border-white/10'}"
							>
								<div class="flex items-center gap-3">
									<input
										type="radio"
										name="rate"
										checked={selected}
										onchange={() => (selectedRate = rate)}
										class="accent-blue"
									/>
									<div>
										<p class="text-sm font-semibold text-white">
											{rate.carrier} — {rate.serviceLevel}
										</p>
										{#if rate.estimatedDays}<p class="text-xs text-muted">
												{rate.estimatedDays}
											</p>{/if}
									</div>
								</div>
								<p class="text-sm font-bold text-white">{currency(rate.amount)}</p>
							</label>
						{/each}
					</div>

					<button
						onclick={purchase}
						disabled={!selectedRate || purchasing}
						class="mt-4 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-dark disabled:opacity-40"
						>{purchasing ? 'Comprando…' : 'Comprar Etiqueta'}</button
					>

					{#if purchaseError}
						<p class="mt-3 text-xs text-amber">{purchaseError}</p>
					{/if}
				{/if}
			</div>
		</div>

		<div
			class="rounded-2xl border border-black/10 bg-white p-8 text-black print:rounded-none print:border-0 print:p-0"
		>
			<!-- Shipping label block -->
			<div class="mb-8 rounded-xl border-2 border-black p-6">
				<div class="mb-4 flex items-start justify-between border-b border-black/20 pb-4">
					<div class="text-xs leading-relaxed">
						<p class="font-bold tracking-wide">DE:</p>
						<p>{shipFrom.name}</p>
						<p>{shipFrom.address}</p>
						<p>{shipFrom.phone}</p>
					</div>
					<div class="text-right">
						<p class="text-[10px] font-bold tracking-widest text-black/60">ORDEN</p>
						<p class="font-display text-xl font-bold">#{o.orderNumber}</p>
						<p class="text-[11px] text-black/60">{dateOnly(o.createdAt)}</p>
					</div>
				</div>

				<p class="mb-1 text-xs font-bold tracking-wide">ENVIAR A:</p>
				<p class="text-2xl leading-snug font-bold">{o.shipping.name}</p>
				<p class="text-lg leading-snug">
					{o.shipping.address}{#if o.shipping.apt}<span>, {o.shipping.apt}</span>{/if}
				</p>
				<p class="text-lg leading-snug">{o.shipping.city}, {o.shipping.state} {o.shipping.zip}</p>
				<p class="text-lg leading-snug">{o.shipping.country}</p>
				<p class="mt-2 text-sm text-black/70">Tel: {o.shipping.phone}</p>
			</div>

			<!-- Package details (fill in by hand or before printing) -->
			<div class="mb-8 grid grid-cols-3 gap-4 text-sm">
				<div>
					<label for="slip-weight" class="text-[11px] font-bold tracking-wide text-black/60"
						>PESO</label
					>
					<input id="slip-weight" type="text" placeholder="___ lb" class={lineInput} />
				</div>
				<div>
					<label for="slip-dims" class="text-[11px] font-bold tracking-wide text-black/60"
						>DIMENSIONES</label
					>
					<input id="slip-dims" type="text" placeholder="___ x ___ x ___ in" class={lineInput} />
				</div>
				<div>
					<label for="slip-service" class="text-[11px] font-bold tracking-wide text-black/60"
						>SERVICIO</label
					>
					<input id="slip-service" type="text" placeholder="USPS / UPS / FedEx" class={lineInput} />
				</div>
			</div>

			<!-- Packing list -->
			<p class="mb-2 text-xs font-bold tracking-wide">CONTENIDO DEL PAQUETE</p>
			<table class="mb-4 w-full text-sm">
				<thead>
					<tr class="border-b border-black/20 text-left text-[11px] text-black/60">
						<th class="py-1.5 font-semibold">Producto</th>
						<th class="py-1.5 text-center font-semibold">Cant.</th>
						<th class="py-1.5 text-right font-semibold">Precio</th>
						<th class="py-1.5 text-right font-semibold">Total</th>
					</tr>
				</thead>
				<tbody>
					{#each o.items as item (item.productId + (item.vehicleLabel ?? ''))}
						<tr class="border-b border-black/10">
							<td class="py-1.5"
								>{item.productName}{item.vehicleLabel ? ' · ' + item.vehicleLabel : ''}</td
							>
							<td class="py-1.5 text-center">{item.qty}</td>
							<td class="py-1.5 text-right">{currency(item.unitPrice)}</td>
							<td class="py-1.5 text-right">{currency(item.unitPrice * item.qty)}</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<div class="flex justify-end">
				<div class="w-56 space-y-1 text-sm">
					<div class="flex items-center justify-between">
						<span class="text-black/60">Subtotal</span><span>{currency(o.subtotal)}</span>
					</div>
					{#if o.discount}
						<div class="flex items-center justify-between">
							<span class="text-black/60">Descuento</span><span>-{currency(o.discount)}</span>
						</div>
					{/if}
					<div class="flex items-center justify-between">
						<span class="text-black/60">Envío</span><span>{currency(o.shippingCost)}</span>
					</div>
					{#if o.tax}
						<div class="flex items-center justify-between">
							<span class="text-black/60">Impuesto</span><span>{currency(o.tax)}</span>
						</div>
					{/if}
					<div
						class="flex items-center justify-between border-t border-black/20 pt-1 text-base font-bold"
					>
						<span>Total</span><span>{currency(o.total)}</span>
					</div>
				</div>
			</div>

			<p class="mt-8 border-t border-black/10 pt-3 text-[10px] text-black/40">
				{o.customerEmail}{#if o.isGuest}&nbsp;· pedido de invitado{/if} · Etiqueta generada {dateTime(
					printedAt
				)}
			</p>
		</div>
	</div>
</div>
