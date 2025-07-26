<script lang="ts">
	import { onMount } from 'svelte';
</script>

<div class="min-h-screen bg-slate-900 text-gray-300 antialiased">
	<slot />
</div>

<style>
	:global(body) {
		font-family: 'Inter', sans-serif;
	}

	:global(::selection) {
		background-color: #ffc935;
		color: #000000;
		border-radius: 5px;
		padding: 1.2em;
	}

	:global(img::selection) {
		background-color: transparent;
		color: inherit;
	}
</style>
