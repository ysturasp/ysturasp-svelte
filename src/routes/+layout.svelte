<script lang="ts">
	import '../app.css';
	import Preloader from '$lib/components/Preloader.svelte';
	import Snow from '$lib/components/Snow.svelte';
	import YandexMetrica from '$lib/components/common/YandexMetrica.svelte';
	import OfflineModal from '$lib/components/offline/OfflineModal.svelte';
	import ServiceStatusModal from '$lib/components/notifications/ServiceStatusModal.svelte';
	import DomainMigrationModal from '$lib/components/modals/DomainMigrationModal.svelte';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { init, backButton } from '@tma.js/sdk-svelte';
	import { offlineStore, showOfflineModal } from '$lib/stores/offline';
	import {
		checkServiceStatus,
		getDownServices,
		type UptimeRobotMonitor
	} from '$lib/utils/uptimerobot';
	import { browser } from '$app/environment';
	import { decodeMigrationData, restoreUserData, isNetlifyDomain } from '$lib/utils/migration';

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
		const statusData = await checkServiceStatus();

		if (statusData) {
			const down = getDownServices(statusData);

			downServices = down;
			totalDown = statusData.statistics?.counts?.down || down.length;

			if (totalDown > 0 || down.length > 0) {
				showServiceStatusModal = true;
			}
		}
	}

	onMount(() => {
		if (browser) {
			const hash = window.location.hash;
			const migrationMatch = hash.match(/#migration=(.+)/);
			if (migrationMatch) {
				decodeMigrationData(migrationMatch[1]).then((decodedData) => {
					if (decodedData) {
						restoreUserData(decodedData);
						localStorage.setItem('migration_completed', 'true');
						const newUrl = window.location.pathname + window.location.search;
						window.history.replaceState(null, '', newUrl);
						setTimeout(() => {
							window.location.reload();
						}, 100);
						return;
					}
				});
			}
		}

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
<Snow />
<YandexMetrica id={97705826} />
<OfflineModal isOpen={$showOfflineModal} />
<ServiceStatusModal
	isOpen={showServiceStatusModal}
	{downServices}
	onClose={() => {
		showServiceStatusModal = false;
	}}
/>
<DomainMigrationModal />
{@render children()}
