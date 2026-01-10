<script lang="ts">
	import '../app.css';
	import Preloader from '$lib/components/Preloader.svelte';
	import Snow from '$lib/components/Snow.svelte';
	import YandexMetrica from '$lib/components/common/YandexMetrica.svelte';
	import OfflineModal from '$lib/components/offline/OfflineModal.svelte';
	import ServiceStatusModal from '$lib/components/notifications/ServiceStatusModal.svelte';
	import DomainMigrationModal from '$lib/components/modals/DomainMigrationModal.svelte';
	import NewYearPromoBanner from '$lib/components/promotions/NewYearPromoBanner.svelte';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { init, backButton, retrieveRawInitData } from '@tma.js/sdk-svelte';
	import { offlineStore, showOfflineModal } from '$lib/stores/offline';
	import {
		checkServiceStatus,
		getDownServices,
		type UptimeRobotMonitor
	} from '$lib/utils/uptimerobot';
	import { browser } from '$app/environment';
	import { decodeMigrationData, restoreUserData, isNetlifyDomain } from '$lib/utils/migration';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { checkIsTelegramMiniApp } from '$lib/utils/telegram';
	import { requestWriteAccessPermission, type WriteAccessStatus } from '$lib/utils/write-access';
	import WriteAccessGate from '$lib/components/modals/WriteAccessGate.svelte';

	let { children } = $props();

	let entryPath = '/';
	let showServiceStatusModal = $state(false);
	let downServices = $state<UptimeRobotMonitor[]>([]);
	let totalDown = $state(0);
	const isTelegramInitially = browser ? checkIsTelegramMiniApp() : false;
	let writeAccessStatus = $state<WriteAccessStatus | null>(
		isTelegramInitially ? null : 'not_telegram'
	);
	let isCheckingWriteAccess = $state(isTelegramInitially);
	let appReady = $state(!isTelegramInitially);
	let cleanupOffline: (() => void) | undefined;

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

	function initializeApp() {
		if (!browser) return;

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

			(async () => {
				try {
					await auth.checkAuth();
					if ($auth.authenticated) {
						return;
					}

					let initData: string | null = null;
					try {
						const rawInitData = retrieveRawInitData();
						if (
							rawInitData &&
							typeof rawInitData === 'string' &&
							rawInitData.length > 0
						) {
							initData = rawInitData;
						}
					} catch (error) {
						console.warn('Не удалось получить initData из SDK:', error);
					}

					if (!initData && typeof window !== 'undefined') {
						const tg = (window as any).Telegram?.WebApp;
						if (
							tg?.initData &&
							typeof tg.initData === 'string' &&
							tg.initData.length > 0
						) {
							initData = tg.initData;
						}
					}

					if (!initData) {
						console.warn('Не удалось получить initData для автоматической авторизации');
						return;
					}

					const response = await fetch('/api/auth/telegram', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({ initData })
					});

					if (response.ok) {
						await auth.checkAuth();
					} else {
						const errorData = await response.json().catch(() => ({}));
						console.error(
							'Ошибка при автоматической авторизации через Telegram:',
							errorData.error || 'Неизвестная ошибка'
						);
					}
				} catch (error) {
					console.error(
						'Критическая ошибка при автоматической авторизации через Telegram:',
						error
					);
				}
			})();
		}
	}

	onMount(() => {
		(async () => {
			if (browser) {
				const isTelegramCheck = checkIsTelegramMiniApp();
				if (isTelegramCheck) {
					try {
						isCheckingWriteAccess = true;

						try {
							init();
						} catch (initError) {
							console.warn('Ошибка при инициализации Telegram SDK:', initError);
						}

						const accessStatus = await requestWriteAccessPermission();
						writeAccessStatus = accessStatus;

						if (accessStatus !== 'allowed' && accessStatus !== 'not_telegram') {
							isCheckingWriteAccess = false;
							appReady = false;
						} else {
							isCheckingWriteAccess = false;
							appReady = true;
							initializeAppAfterAccessCheck();
						}
					} catch (error) {
						console.error('Ошибка при проверке доступа на отправку сообщений:', error);
						writeAccessStatus = 'error';
						isCheckingWriteAccess = false;
						appReady = false;
					}
				} else {
					isCheckingWriteAccess = false;
					appReady = true;
					initializeAppAfterAccessCheck();
				}
			} else {
				isCheckingWriteAccess = false;
				appReady = true;
				initializeAppAfterAccessCheck();
			}
		})();

		const handleWriteAccessAllowed = () => {
			if (!appReady && writeAccessStatus === 'allowed') {
				isCheckingWriteAccess = false;
				appReady = true;
				initializeAppAfterAccessCheck();
			}
		};

		if (browser) {
			window.addEventListener('writeAccessAllowed', handleWriteAccessAllowed);
		}

		return () => {
			if (browser) {
				window.removeEventListener('writeAccessAllowed', handleWriteAccessAllowed);
			}
			cleanupOffline?.();
		};
	});

	function initializeAppAfterAccessCheck() {
		if (!browser) return;

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

		initializeApp();
	}

	afterNavigate(() => {
		updateBack(window.location.pathname);
	});
</script>

{#if (!appReady || isCheckingWriteAccess) && writeAccessStatus !== 'not_telegram'}
	<WriteAccessGate
		status={writeAccessStatus || 'denied'}
		bind:isChecking={isCheckingWriteAccess}
	/>
{:else if appReady}
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
	<NewYearPromoBanner />
	{@render children()}
{/if}
