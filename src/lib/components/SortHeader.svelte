<!-- A clickable table header that sorts by `key`; shows an arrow when active. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let {
		key,
		sortKey,
		sortDir,
		onsort,
		children
	}: {
		key: string;
		sortKey: string;
		sortDir: 'asc' | 'desc';
		onsort: (key: string) => void;
		children: Snippet;
	} = $props();
</script>

<th
	class="cursor-pointer px-4 py-3 font-semibold transition select-none hover:text-white"
	onclick={() => onsort(key)}
>
	{@render children()}
	{#if sortKey === key}
		<Icon
			name="chevronDown"
			class="inline-block h-3 w-3 {sortDir === 'desc' ? 'rotate-180' : ''}"
		/>
	{/if}
</th>
