<script lang="ts">
	import '../app.css';
	import Preloader from '$lib/components/Preloader.svelte';
	import YandexMetrica from '$lib/components/common/YandexMetrica.svelte';
	import OfflineModal from '$lib/components/offline/OfflineModal.svelte';
	import ServiceStatusModal from '$lib/components/notifications/ServiceStatusModal.svelte';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { init } from '@telegram-apps/sdk-svelte';
	import { backButton } from '@telegram-apps/sdk';
	import { offlineStore, showOfflineModal } from '$lib/stores/offline';
	import {
		checkServiceStatus,
		getDownServices,
		type UptimeRobotMonitor
	} from '$lib/utils/uptimerobot';

	let { children } = $props();

	let entryPath = '/';
	let showServiceStatusModal = $state(false);
	let downServices = $state<UptimeRobotMonitor[]>([]);
	let totalDown = $state(0);

	function updateBack(currentPath: string) {
		try {
			if (currentPath !== entryPath) backButton.show();
			else backButton.hide();
		} catch {}
	}

	function handleBack() {
		history.back();
	}

	async function checkServices() {
		try {
			console.log('Checking service status...');
			const statusData = await checkServiceStatus();
			console.log('Service status data:', statusData);

			if (statusData) {
				const down = getDownServices(statusData);
				console.log('Down services:', down);
				console.log('Total down:', statusData.statistics?.counts?.down);

				if (down.length > 0) {
					downServices = down;
					totalDown = statusData.statistics?.counts?.down || down.length;
					showServiceStatusModal = true;
					console.log('Service status modal should be shown');
					console.log('showServiceStatusModal value:', showServiceStatusModal);
					console.log('downServices length:', downServices.length);
					console.log('totalDown:', totalDown);
				} else {
					console.log('No down services found');
				}
			} else {
				console.log('No status data received');
			}
		} catch (error) {
			console.error('Error checking service status:', error);
		}
	}

	onMount(() => {
		let cleanupOffline: (() => void) | undefined;

		offlineStore.init().then((cleanup) => {
			cleanupOffline = cleanup;
		});

		checkServices();

		let isTelegram = false;
		try {
			init();
			isTelegram = true;
		} catch {}

		if (isTelegram) {
			try {
				backButton.mount();
				backButton.onClick(handleBack);
				entryPath = window.location.pathname;
				updateBack(window.location.pathname);
			} catch {}
		}

		return () => {
			if (isTelegram) {
				try {
					backButton.unmount();
					backButton.offClick(handleBack);
				} catch {}
			}
			cleanupOffline?.();
		};
	});

	afterNavigate(() => {
		updateBack(window.location.pathname);
	});
</script>

<Preloader />
<YandexMetrica id={97705826} />
<OfflineModal isOpen={$showOfflineModal} />
<ServiceStatusModal
	isOpen={showServiceStatusModal}
	{downServices}
	{totalDown}
	onClose={() => {
		showServiceStatusModal = false;
	}}
/>
{@render children()}
