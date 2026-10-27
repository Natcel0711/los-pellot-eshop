<!-- Thin bar at the top while a page is loading or a form is being sent. -->
<script lang="ts">
	import { navigating } from '$app/state';
	import { loading } from '#lib/state/ui.svelte.ts';

	const active = $derived(navigating.to !== null || loading.pending > 0);
</script>

{#if active}
	<div
		class="fixed top-0 right-0 left-0 z-70 h-0.5 overflow-hidden bg-blue/10"
		role="progressbar"
		aria-label="Cargando"
	>
		<div class="loading-bar-track h-full w-1/3 bg-blue"></div>
	</div>
{/if}
