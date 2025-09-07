<script lang="ts">
	import '../app.css';
	import Preloader from '$lib/components/Preloader.svelte';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { init } from '@telegram-apps/sdk-svelte';
	import { backButton } from '@telegram-apps/sdk';

	let { children } = $props();

	let entryPath = '/';

	function updateBack(currentPath: string) {
		try {
			if (currentPath !== entryPath) backButton.show();
			else backButton.hide();
		} catch {}
	}

	function handleBack() {
		history.back();
	}

	onMount(() => {
		try {
			init();
			backButton.mount();
			backButton.onClick(handleBack);
			entryPath = window.location.pathname;
			updateBack(window.location.pathname);
		} catch {}
		return () => {
			try {
				backButton.unmount();
				backButton.offClick(handleBack);
			} catch {}
		};
	});

	afterNavigate(() => {
		updateBack(window.location.pathname);
	});
</script>

<Preloader />
{@render children()}
