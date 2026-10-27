<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		page = $bindable(1),
		totalPages,
		totalItems,
		pageSize = 10
	}: { page?: number; totalPages: number; totalItems: number; pageSize?: number } = $props();

	const rangeStart = $derived(totalItems === 0 ? 0 : (page - 1) * pageSize + 1);
	const rangeEnd = $derived(Math.min(page * pageSize, totalItems));

	function goTo(target: number) {
		page = Math.min(Math.max(1, target), totalPages);
	}

	const buttonClass =
		'w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/5 active:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition';
</script>

{#if totalItems > 0}
	<div class="flex flex-wrap items-center justify-between gap-4 px-4 py-3 text-xs text-muted">
		<p>Mostrando {rangeStart}–{rangeEnd} de {totalItems}</p>
		<div class="flex items-center gap-1">
			<button
				class={buttonClass}
				disabled={page === 1}
				onclick={() => goTo(1)}
				aria-label="Primera página"
				><Icon name="chevronRight" class="h-3.5 w-3.5 rotate-180" /><Icon
					name="chevronRight"
					class="-ml-2.5 h-3.5 w-3.5 rotate-180"
				/></button
			>
			<button
				class={buttonClass}
				disabled={page === 1}
				onclick={() => goTo(page - 1)}
				aria-label="Página anterior"
				><Icon name="chevronRight" class="h-3.5 w-3.5 rotate-180" /></button
			>
			<span class="px-2 font-semibold text-white">{page} / {totalPages}</span>
			<button
				class={buttonClass}
				disabled={page === totalPages}
				onclick={() => goTo(page + 1)}
				aria-label="Página siguiente"><Icon name="chevronRight" class="h-3.5 w-3.5" /></button
			>
			<button
				class={buttonClass}
				disabled={page === totalPages}
				onclick={() => goTo(totalPages)}
				aria-label="Última página"
				><Icon name="chevronRight" class="h-3.5 w-3.5" /><Icon
					name="chevronRight"
					class="-ml-2.5 h-3.5 w-3.5"
				/></button
			>
		</div>
	</div>
{/if}
