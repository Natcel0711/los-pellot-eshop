<script lang="ts">
	import { refreshAll } from '$app/navigation';
	import { errorOf, postAction } from '#lib/actions.ts';
	import Icon from '#lib/components/Icon.svelte';
	import { toast } from '#lib/state/ui.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let expandedModelId = $state<number | null>(null);
	const trimsOf = (modelId: number) => data.trims.filter((t) => t.modelId === modelId);

	/** Runs an action; on success clears the form, on failure shows the error. */
	async function run(
		action: string,
		fields: Record<string, string | number>,
		fallback: string,
		form?: HTMLFormElement
	) {
		const result = await postAction(action, fields);
		const error = errorOf(result, fallback);
		if (error) toast.show(error);
		else form?.reset();
		await refreshAll();
	}

	function submit(handler: (form: HTMLFormElement, data: FormData) => void) {
		return (event: SubmitEvent & { currentTarget: HTMLFormElement }) => {
			event.preventDefault();
			handler(event.currentTarget, new FormData(event.currentTarget));
		};
	}

	const inputClass =
		'bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue';
	const addButton =
		'px-4 py-2 rounded-full bg-blue hover:bg-blue-dark text-sm font-semibold transition';
	const chip =
		'inline-flex items-center gap-1.5 text-xs border border-white/10 rounded-full pl-3 pr-1.5 py-1.5';
</script>

<h1 class="mb-6 font-display text-3xl font-bold tracking-wide text-white">VEHÍCULOS</h1>

<div class="mb-8 grid gap-6 sm:grid-cols-2">
	<div class="rounded-2xl border border-white/10 bg-surface p-5">
		<h2 class="mb-4 font-display text-lg font-bold text-white">AÑOS</h2>
		<form
			class="mb-4 flex gap-2"
			onsubmit={submit((form, fd) => {
				if (Number(fd.get('year')))
					run('?/addYear', { year: String(fd.get('year')) }, 'No se pudo agregar el año.', form);
			})}
		>
			<input
				name="year"
				type="number"
				placeholder="2027"
				aria-label="Año"
				class="flex-1 {inputClass}"
			/>
			<button type="submit" class={addButton}>Agregar</button>
		</form>
		<div class="flex flex-wrap gap-2">
			{#each data.years as year (year.id)}
				<span class="{chip} bg-surface-2">
					{year.year}
					<button
						class="p-1 text-muted hover:text-amber"
						aria-label="Eliminar"
						onclick={() =>
							confirm(
								`¿Eliminar el año ${year.year}? Se eliminarán sus modelos y trims asociados.`
							) && run('?/deleteYear', { id: year.id }, 'No se pudo eliminar el año.')}
						><Icon name="close" class="h-3 w-3" /></button
					>
				</span>
			{/each}
		</div>
	</div>

	<div class="rounded-2xl border border-white/10 bg-surface p-5">
		<h2 class="mb-4 font-display text-lg font-bold text-white">MARCAS</h2>
		<form
			class="mb-4 flex gap-2"
			onsubmit={submit((form, fd) => {
				const name = String(fd.get('name') ?? '').trim();
				if (name) run('?/addMake', { name }, 'No se pudo agregar la marca.', form);
			})}
		>
			<input
				name="name"
				type="text"
				placeholder="Nissan"
				aria-label="Marca"
				class="flex-1 {inputClass}"
			/>
			<button type="submit" class={addButton}>Agregar</button>
		</form>
		<div class="flex flex-wrap gap-2">
			{#each data.makes as make (make.id)}
				<span class="{chip} bg-surface-2">
					{make.name}
					<button
						class="p-1 text-muted hover:text-amber"
						aria-label="Eliminar"
						onclick={() =>
							confirm(`¿Eliminar la marca "${make.name}"?`) &&
							run('?/deleteMake', { id: make.id }, 'No se pudo eliminar la marca.')}
						><Icon name="close" class="h-3 w-3" /></button
					>
				</span>
			{/each}
		</div>
	</div>
</div>

<div class="rounded-2xl border border-white/10 bg-surface p-5">
	<h2 class="mb-4 font-display text-lg font-bold text-white">MODELOS Y TRIMS</h2>
	<form
		class="mb-5 grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]"
		onsubmit={submit((form, fd) => {
			const name = String(fd.get('name') ?? '').trim();
			if (fd.get('yearId') && fd.get('makeId') && name) {
				run(
					'?/addModel',
					{ yearId: String(fd.get('yearId')), makeId: String(fd.get('makeId')), name },
					'No se pudo agregar el modelo.',
					form
				);
			}
		})}
	>
		<select name="yearId" aria-label="Año" class={inputClass}>
			{#each data.years as year (year.id)}<option value={year.id}>{year.year}</option>{/each}
		</select>
		<select name="makeId" aria-label="Marca" class={inputClass}>
			{#each data.makes as make (make.id)}<option value={make.id}>{make.name}</option>{/each}
		</select>
		<input
			name="name"
			type="text"
			placeholder="Nombre del modelo (ej. Sentra)"
			aria-label="Modelo"
			class={inputClass}
		/>
		<button type="submit" class="{addButton} whitespace-nowrap">Agregar modelo</button>
	</form>

	<div class="divide-y divide-white/5">
		{#each data.models as model (model.id)}
			<div class="py-3">
				<div class="flex items-center justify-between gap-3">
					<button
						class="flex flex-1 items-center gap-2 text-left"
						onclick={() => (expandedModelId = expandedModelId === model.id ? null : model.id)}
					>
						<Icon
							name="chevronDown"
							class="h-3.5 w-3.5 text-muted transition {expandedModelId !== model.id
								? 'rotate-180'
								: ''}"
						/>
						<span class="text-sm font-medium text-white"
							>{model.year} {model.makeName} {model.name}</span
						>
					</button>
					<button
						class="shrink-0 p-1.5 text-muted hover:text-amber"
						aria-label="Eliminar modelo"
						onclick={() =>
							confirm(
								`¿Eliminar "${model.year} ${model.makeName} ${model.name}"? Se eliminarán sus trims.`
							) && run('?/deleteModel', { id: model.id }, 'No se pudo eliminar el modelo.')}
						><Icon name="trash" class="h-4 w-4" /></button
					>
				</div>

				{#if expandedModelId === model.id}
					<div class="mt-3 ml-6 rounded-xl border border-white/10 bg-surface-2 p-4">
						<p class="mb-2 text-[11px] font-semibold tracking-wide text-muted">TRIMS</p>
						<form
							class="mb-3 flex gap-2"
							onsubmit={submit((form, fd) => {
								const name = String(fd.get('name') ?? '').trim();
								if (name)
									run(
										'?/addTrim',
										{ modelId: model.id, name },
										'No se pudo agregar el trim.',
										form
									);
							})}
						>
							<input
								name="name"
								type="text"
								placeholder="Ej. SV"
								aria-label="Trim"
								class="flex-1 rounded-lg border border-white/10 bg-surface px-3 py-1.5 text-sm focus:border-blue focus:outline-none"
							/>
							<button
								type="submit"
								class="rounded-full bg-blue px-3 py-1.5 text-xs font-semibold transition hover:bg-blue-dark"
								>Agregar</button
							>
						</form>
						<div class="flex flex-wrap gap-2">
							{#each trimsOf(model.id) as trim (trim.id)}
								<span class="{chip} bg-surface">
									{trim.name}
									<button
										class="p-1 text-muted hover:text-amber"
										aria-label="Eliminar"
										onclick={() =>
											run('?/deleteTrim', { id: trim.id }, 'No se pudo eliminar el trim.')}
										><Icon name="close" class="h-3 w-3" /></button
									>
								</span>
							{:else}
								<p class="text-xs text-muted">Sin trims todavía.</p>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>
