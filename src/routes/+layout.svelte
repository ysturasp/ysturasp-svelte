<script lang="ts">
	import '../app.css';
	import Preloader from '$lib/components/Preloader.svelte';
	import YandexMetrica from '$lib/components/common/YandexMetrica.svelte';
	import OfflineModal from '$lib/components/offline/OfflineModal.svelte';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { init } from '@telegram-apps/sdk-svelte';
	import { backButton } from '@telegram-apps/sdk';
	import { offlineStore, showOfflineModal } from '$lib/stores/offline';

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
		let cleanupOffline: (() => void) | undefined;

		offlineStore.init().then((cleanup) => {
			cleanupOffline = cleanup;
		});

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
				cleanupOffline?.();
			} catch {}
		};
	});

	afterNavigate(() => {
		updateBack(window.location.pathname);
	});
</script>

<Preloader />
<YandexMetrica id={97705826} />
<OfflineModal isOpen={$showOfflineModal} />
{@render children()}
