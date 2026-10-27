<!-- An icon from icons.ts. The markup is a fixed, developer-written constant
     (never user input), so rendering it as HTML is safe. -->
<script lang="ts">
	import { iconMarkup } from '#lib/icons.ts';

	let { name = 'bolt', class: className = 'w-5 h-5' }: { name?: string; class?: string } = $props();

	const svg = $derived(
		`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">${iconMarkup(name)}</svg>`
	);
</script>

<span class="inline-block {className}">{@html svg}</span>
