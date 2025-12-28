import { browser } from '$app/environment';
import { checkIsTelegramMiniApp } from '$lib/utils/telegram';
import { retrieveRawInitData } from '@tma.js/sdk-svelte';

const API_BASE_URL =
	import.meta.env.VITE_NOTIFICATIONS_API_URL;

function getTelegramInitData(): string | null {
	if (!browser) {
		return null;
	}

	try {
		const initData = retrieveRawInitData();
		if (initData && typeof initData === 'string' && initData.length > 0) {
			return initData;
		}
	} catch (error) {
		console.error('Error getting initData from retrieveRawInitData', error);
	}

	const tg = (window as any).Telegram?.WebApp;
	if (tg) {
		if (tg.initData && typeof tg.initData === 'string' && tg.initData.length > 0) {
			return tg.initData;
		}
	}

	return null;
}

export interface NotificationSubscription {
	groupName: string;
	notifyMinutes: number;
	hiddenSubjects?: any[];
	excludeHidden?: boolean;
	manuallyExcludedSubjects?: string[];
}

export interface NotificationStatus {
	subscribed: boolean;
	notifyMinutes?: number;
	subscriptions?: NotificationSubscription[];
}

export interface NotificationResponse {
	success: boolean;
	subscribed?: boolean;
	notifyMinutes?: number;
	subscriptions?: NotificationSubscription[];
	message?: string;
}

export async function checkNotificationStatus(
	groupName?: string
): Promise<NotificationStatus | null> {
	if (!browser) {
		return null;
	}

	const isTelegram = checkIsTelegramMiniApp() || !!(window as any).Telegram?.WebApp;
	if (!isTelegram) {
		return null;
	}

	try {
		const initData = getTelegramInitData();
		if (!initData) {
			console.error('initData not available - проверьте, что приложение открыто в Telegram Web App');
			return null;
		}

		const response = await fetch(`${API_BASE_URL}/check-status`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				initData,
				groupName
			})
		});

		if (!response.ok) {
			if (response.status === 401) {
				console.error('Unauthorized: Invalid initData');
				return null;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: NotificationResponse = await response.json();

		if (data.success) {
			if (groupName && data.subscriptions) {
				const groupSubscription = data.subscriptions.find(
					(sub) => sub.groupName === groupName
				);
				return {
					subscribed: !!groupSubscription,
					notifyMinutes: groupSubscription?.notifyMinutes,
					subscriptions: data.subscriptions
				};
			}

			return {
				subscribed: !!(data.subscriptions && data.subscriptions.length > 0),
				subscriptions: data.subscriptions || []
			};
		}
	} catch (error) {
		console.error('Error checking notification status', error);
	}

	return null;
}

export async function toggleNotifications(
	groupName: string,
	notifyMinutes: number = 0,
	hiddenSubjects: any[] | null = null,
	update: boolean = false,
	manuallyExcludedSubjects: string[] = [],
	excludeHidden?: boolean
): Promise<boolean> {
	if (!browser) {
		return false;
	}

	const isTelegram = checkIsTelegramMiniApp() || !!(window as any).Telegram?.WebApp;
	if (!isTelegram) {
		return false;
	}

	try {
		const initData = getTelegramInitData();
		if (!initData) {
			console.error('initData not available');
			return false;
		}

		const finalNotifyMinutes = notifyMinutes >= 1 ? notifyMinutes : notifyMinutes === 0 ? 0 : 1;

		const finalExcludeHidden =
			excludeHidden !== undefined
				? excludeHidden
				: hiddenSubjects !== null && hiddenSubjects.length > 0;

		const response = await fetch(`${API_BASE_URL}/toggle`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				initData,
				groupName,
				notifyMinutes: finalNotifyMinutes,
				hiddenSubjects: hiddenSubjects || [],
				excludeHidden: finalExcludeHidden,
				update,
				manuallyExcludedSubjects: manuallyExcludedSubjects || []
			})
		});

		if (!response.ok) {
			if (response.status === 401) {
				console.error('Unauthorized: Invalid initData');
				return false;
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: NotificationResponse = await response.json();
		return data.success || false;
	} catch (error) {
		console.error('Error toggling notifications', error);
		return false;
	}
}
