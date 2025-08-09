<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import '$lib/styles/global.css';
	import '$lib/styles/fonts.css';

	let isLowercase = false;
	let isModernFonts = false;

	onMount(() => {
		const unsubscribe = settings.subscribe((value) => {
			isLowercase = value.lowercase;
			isModernFonts = value.modernFonts;
			if (typeof document !== 'undefined') {
				document.body.classList.toggle('lowercase', value.lowercase);
				document.body.classList.toggle('modern-fonts', value.modernFonts);
			}
		});

		return () => {
			unsubscribe();
			if (typeof document !== 'undefined') {
				document.body.classList.remove('lowercase');
				document.body.classList.remove('modern-fonts');
			}
		};
	});
</script>

<div class="min-h-screen bg-slate-900 text-gray-300 antialiased">
	<slot />
</div>

<style>
	:global(body) {
		font-family: var(--font-family-base, 'Inter'), sans-serif;
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
