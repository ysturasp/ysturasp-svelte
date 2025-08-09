<script lang="ts">
	import '../app.css';
	import Preloader from '$lib/components/Preloader.svelte';
	import FontsManager from '$lib/components/FontsManager.svelte';

	let { children } = $props();
</script>

<Preloader />
<FontsManager />
{@render children()}
