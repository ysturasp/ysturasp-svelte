<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let portal: HTMLDivElement;

	onMount(() => {
		if (browser) {
			document.body.appendChild(portal);
		}
	});

	onDestroy(() => {
		if (browser && portal && portal.parentNode) {
			portal.parentNode.removeChild(portal);
		}
	});
</script>

<div bind:this={portal} data-portal>
	<slot />
</div>
