import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface OfflineState {
	isOnline: boolean;
	isOfflineCapable: boolean;
	lastOnlineTime: Date | null;
	cacheStatus: 'loading' | 'ready' | 'error';
	showOfflineModal: boolean;
}

const defaultOfflineState: OfflineState = {
	isOnline: true,
	isOfflineCapable: false,
	lastOnlineTime: null,
	cacheStatus: 'loading',
	showOfflineModal: false
};

function createOfflineStore() {
	const { subscribe, set, update } = writable<OfflineState>(defaultOfflineState);

	let onlineCheckInterval: ReturnType<typeof setInterval>;
	let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

	const init = async () => {
		if (!browser) return;

		const initialState = {
			...defaultOfflineState,
			isOnline: navigator.onLine,
			lastOnlineTime: navigator.onLine ? new Date() : null
		};

		set(initialState);

		if ('serviceWorker' in navigator) {
			try {
				serviceWorkerRegistration = await navigator.serviceWorker.register(
					'/service-worker.js',
					{
						type: 'module'
					}
				);

				update((state) => ({
					...state,
					isOfflineCapable: true,
					cacheStatus: 'ready'
				}));

				serviceWorkerRegistration.addEventListener('updatefound', () => {
					const newWorker = serviceWorkerRegistration?.installing;
					if (newWorker) {
						newWorker.addEventListener('statechange', () => {
							if (newWorker.state === 'installed') {
								console.log('New app version available. Refresh to update.');
							}
						});
					}
				});
			} catch (error) {
				console.error('Service worker registration failed:', error);
				update((state) => ({
					...state,
					cacheStatus: 'error'
				}));
			}
		}

		const handleOnline = () => {
			update((state) => ({
				...state,
				isOnline: true,
				lastOnlineTime: new Date(),
				showOfflineModal: false
			}));
		};

		const handleOffline = () => {
			update((state) => ({
				...state,
				isOnline: false,
				showOfflineModal: true
			}));
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		onlineCheckInterval = setInterval(async () => {
			const wasOnline = await checkOnlineStatus();
			update((state) => {
				if (state.isOnline !== wasOnline) {
					return {
						...state,
						isOnline: wasOnline,
						lastOnlineTime: wasOnline ? new Date() : state.lastOnlineTime,
						showOfflineModal: !wasOnline && state.isOfflineCapable
					};
				}
				return state;
			});
		}, 30000);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
			if (onlineCheckInterval) {
				clearInterval(onlineCheckInterval);
			}
		};
	};

	const checkOnlineStatus = async (): Promise<boolean> => {
		if (!navigator.onLine) return false;

		try {
			const response = await fetch('/favicon.svg', {
				method: 'HEAD',
				cache: 'no-cache'
			});
			return response.ok;
		} catch {
			return false;
		}
	};

	const dismissOfflineModal = () => {
		update((state) => ({
			...state,
			showOfflineModal: false
		}));
	};

	const openOfflineModal = () => {
		update((state) => ({
			...state,
			showOfflineModal: true
		}));
	};

	const forceUpdateServiceWorker = async () => {
		if (serviceWorkerRegistration) {
			const newWorker = serviceWorkerRegistration.waiting;
			if (newWorker) {
				newWorker.postMessage({ type: 'SKIP_WAITING' });
				window.location.reload();
			}
		}
	};

	return {
		subscribe,
		init,
		dismissOfflineModal,
		openOfflineModal,
		forceUpdateServiceWorker,
		checkOnlineStatus
	};
}

export const offlineStore = createOfflineStore();

export const isOnline = derived(offlineStore, ($offline) => $offline.isOnline);
export const isOfflineCapable = derived(offlineStore, ($offline) => $offline.isOfflineCapable);
export const showOfflineModal = derived(offlineStore, ($offline) => $offline.showOfflineModal);
