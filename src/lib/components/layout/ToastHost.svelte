<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import { toast } from '#lib/state/ui.svelte.ts';
</script>

<div class="fixed bottom-5 left-1/2 z-60 flex -translate-x-1/2 flex-col items-center gap-2">
	{#each toast.list as entry (entry.id)}
		<div
			class="glow-border flex items-center gap-2 rounded-full border border-blue/40 bg-surface px-5 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 {entry.leaving
				? 'translate-y-2 opacity-0'
				: ''}"
		>
			<span class="text-blue-glow"><Icon name="check" class="h-4 w-4" /></span>
			{entry.message}
		</div>
	{/each}
</div>
