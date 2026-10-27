<!-- A product's photo, or its category icon when it has no photo yet. The
     caller sizes the surrounding box; this just fills it. -->
<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		imageUrl,
		iconName,
		iconClass = 'w-8 h-8',
		alt = ''
	}: { imageUrl: string | null; iconName: string; iconClass?: string; alt?: string } = $props();
</script>

{#if imageUrl}
	<img src={imageUrl} {alt} class="h-full w-full object-cover" />
{:else}
	<Icon name={iconName} class={iconClass} />
{/if}
