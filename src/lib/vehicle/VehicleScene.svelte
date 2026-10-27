<!-- Mounts the Three.js vehicle scene (vehicle-scene.ts) into a <div> and
     tears it down when the page is left. Three.js only runs in the browser,
     so it's loaded in onMount. -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { VehicleSceneHandle } from './vehicle-scene.ts';

	let {
		activeCategory,
		onhotspotclick,
		onhotspothover,
		onautorotatechange,
		scene = $bindable(null)
	}: {
		activeCategory: string | null;
		onhotspotclick: (category: string) => void;
		onhotspothover: (hover: { category: string; x: number; y: number } | null) => void;
		onautorotatechange: (isOn: boolean) => void;
		scene?: VehicleSceneHandle | null;
	} = $props();

	let container: HTMLDivElement;

	onMount(() => {
		let handle: VehicleSceneHandle | null = null;
		let cancelled = false;

		import('./vehicle-scene.ts').then(({ createVehicleScene }) => {
			if (cancelled) return;
			handle = createVehicleScene(container, {
				onHotspotClick: (category) => onhotspotclick(category),
				onHotspotHover: (category, x, y) =>
					onhotspothover(category ? { category, x: x ?? 0, y: y ?? 0 } : null),
				onAutoRotateChange: (isOn) => onautorotatechange(isOn)
			});
			handle.setActiveCategory(activeCategory);
			scene = handle;
		});

		// Critical: stops the render loop and frees the GPU resources.
		return () => {
			cancelled = true;
			handle?.destroy();
			scene = null;
		};
	});

	$effect(() => {
		scene?.setActiveCategory(activeCategory);
	});
</script>

<div bind:this={container} class="absolute inset-0"></div>
