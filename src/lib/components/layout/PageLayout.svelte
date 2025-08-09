<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import '$lib/styles/global.css';

	let isLowercase = false;

	onMount(() => {
		const unsubscribe = settings.subscribe((value) => {
			isLowercase = value.lowercase;
			if (typeof document !== 'undefined') {
				document.body.classList.toggle('lowercase', value.lowercase);
			}
		});

		return () => {
			unsubscribe();
			if (typeof document !== 'undefined') {
				document.body.classList.remove('lowercase');
			}
		};
	});
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
