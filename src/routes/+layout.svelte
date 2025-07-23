<script lang="ts">
	import '../app.css';
	import Preloader from '$lib/components/Preloader.svelte';
	
	let { children } = $props();
</script>

<Preloader />
{@render children()}
